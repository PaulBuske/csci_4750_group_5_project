import { NextResponse } from "next/server";
import { dbSingleton } from "@/app/lib/dbSingleton.ts";
import { Prisma } from "@prisma/client";

export const DELETE = async (
    request: Request,
) => {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        const timeEntryId = url.searchParams.get("timeEntryId");

        if (!userId || !timeEntryId) {
            return NextResponse.json(
                { message: "Missing userId or timeEntryId parameter" },
                { status: 400 },
            );
        }

        const authenticatedUser = await dbSingleton.user.findUnique({
            where: { userId },
            select: {
                userId: true,
                role: true,
            },
        });

        if (!authenticatedUser) {
            return NextResponse.json(
                { message: "Unauthorized - User not found" },
                { status: 401 },
            );
        }

        if (authenticatedUser.role !== "MANAGER" || authenticatedUser.userId !== userId ) {
            return NextResponse.json(
                { message: "Forbidden - User does not have permission" },
                { status: 403 },
            );
        }

        const timeEntry = await dbSingleton.timeEntry.findUnique({
            where: { timeEntryId },
            select: { userId: true },
        });

        if (!timeEntry) {
            return NextResponse.json(
                { message: "Time entry not found" },
                { status: 404 },
            );
        }

        if (timeEntry.userId !== authenticatedUser.userId) {
            return NextResponse.json(
                { message: "Forbidden - User does not own this time entry" },
                { status: 403 },
            );
        }

        await dbSingleton.timeEntry.delete({
            where: {
                timeEntryId: timeEntryId,
                userId: authenticatedUser.userId,
            },
        });

        return NextResponse.json(
            { message: "Time entry deleted successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error deleting time entry:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                return NextResponse.json(
                    { message: "Time entry not found during delete operation" },
                    { status: 404 },
                );
            }
        }

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
};

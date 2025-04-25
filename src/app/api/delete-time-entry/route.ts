import { NextResponse } from "next/server";
import { dbSingleton } from "@/app/lib/dbSingleton.ts";
import { Prisma } from "@prisma/client";

export const DELETE = async (
    request: Request,
) => {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const timeEntryId = url.searchParams.get('timeEntryId');

        if (!userId || !timeEntryId) {
            return NextResponse.json(
                { message: "Missing userId or timeEntryId parameter" },
                { status: 400 },
            );
        }

        const authenticatedUser = await dbSingleton.user.findUnique({
            where: { userId },
            select: { userId: true },
        });

        if (!authenticatedUser) {
            return NextResponse.json(
                { message: "Unauthorized - User not found" },
                { status: 401 },
            );
        }

        const timeEntry = await dbSingleton.timeEntry.findUnique({
            where: { timeEntryId },
            select: { userId: true },
        });

        if (!timeEntry) {
            // Correct structure for NextResponse.json
            return NextResponse.json(
                { message: "Time entry not found" },
                { status: 404 },
            );
        }

        if (timeEntry.userId !== authenticatedUser.userId) {
            // Correct structure for NextResponse.json
            return NextResponse.json(
                { message: "Forbidden - User does not own this time entry" },
                { status: 403 },
            );
        }

        // Delete the time entry using both timeEntryId and userId for safety
        await dbSingleton.timeEntry.delete({
            where: {
                timeEntryId: timeEntryId,
                userId: authenticatedUser.userId, // Use validated userId
            },
        });

        // Correct structure for NextResponse.json
        return NextResponse.json(
            { message: "Time entry deleted successfully" },
            { status: 200 },
        );

    } catch (error) {
        console.error("Error deleting time entry:", error);

        // Handle specific Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Record to delete not found.
            if (error.code === "P2025") {
                // Correct structure for NextResponse.json
                return NextResponse.json(
                    { message: "Time entry not found during delete operation" },
                    { status: 404 },
                );
            }
            // Add handling for other relevant Prisma errors if needed
        }

        // Generic internal server error for other cases
        // Correct structure for NextResponse.json
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
};
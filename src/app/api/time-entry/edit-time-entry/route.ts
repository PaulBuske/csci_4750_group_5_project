import {dbSingleton} from "@/app/lib/dbSingleton.ts";
import {NextResponse} from "next/server";
import bcrypt from "bcrypt";
import {verifySession} from "@/app/lib/data-access-layer.ts";

export async function POST(request: Request) {
    const session = await verifySession();

    const requestBody = await request.json();
    const { timeEntryId, newClockInTime, newClockOutTime } = requestBody;

    if (!session) {
        return new Response(null, { status: 401 });
    }

    const sessionUserId = session.userId.toString();

    try {
        const authenticatedUser = await dbSingleton.user.findUnique({
            where: { userId: sessionUserId },
            select: {
                userId: true,
                role: true,
            },
        });

        const timeEntryToBeEdited = await dbSingleton.timeEntry.findUnique({
            where: { timeEntryId },
            select: {
                timeEntryId: true,
                userId: true,
                clockInTime: true,
                clockOutTime: true,
            },
        }

        if (!authenticatedUser) {
            return NextResponse.json(
                { message: "Unauthorized - User not found" },
                { status: 401 },
            );
        }

        if (authenticatedUser.role !== "MANAGER" || authenticatedUser.userId !== timeEntryToBeEdited?.userId) {
            return NextResponse.json(
                {
                    message:
                        "Unauthorized - Only administrators can reset passwords",
                },
                { status: 403 },
            );
        }

        if (!timeEntryToBeEdited) {
            return NextResponse.json(
                { message: "Time entry not found" },
                { status: 404 },
            );
        }

        try {
            const updatedTimeEntry = await dbSingleton.timeEntry.update({
                where: { timeEntryId: timeEntryToBeEdited.timeEntryId },
                data: {
                    clockInTime: newClockInTime,
                    clockOutTime: newClockOutTime ? newClockOutTime : timeEntryToBeEdited.clockOutTime,
                    updatedAt: new Date()
                },
                select: {
                    timeEntryId: true,
                    userId: true,
                    clockInTime: true,
                    clockOutTime: true,
                    updatedAt: true,
                },
            });

            return NextResponse.json({
                message:
                    `Time entry update successfully`,
                status: 200,
                updatedTimeEntry: {
                    timeEntryId: updatedTimeEntry.timeEntryId,
                    userId: updatedTimeEntry.userId,
                    clockInTime: updatedTimeEntry.clockInTime,
                    clockOutTime: updatedTimeEntry.clockOutTime,
                },
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error resetting password:", error.message);
            } else {
                console.error("Unexpected error:", error);
            }
        }
    } catch (error) {
        console.error("Error during password reset:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

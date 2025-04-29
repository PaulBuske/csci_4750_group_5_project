import { dbSingleton } from "@/app/lib/dbSingleton.ts";
import { NextResponse } from "next/server";
import { verifySession } from "@/app/lib/data-access-layer.ts";

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
        });

        if (!authenticatedUser) {
            return NextResponse.json(
                { message: "Unauthorized - User not found" },
                { status: 401 },
            );
        }

        if (authenticatedUser.userId !== timeEntryToBeEdited?.userId && authenticatedUser.role !== "MANAGER") {
            return NextResponse.json(
                {
                    message:
                        "Unauthorized - Must be original user to edit time entry",
                },
                { status: 403 },
            );
        }

        if (!timeEntryToBeEdited) {
            console.error("Time entry not found");
            return NextResponse.json(
                { message: "Time entry not found" },
                { status: 404 },
            );
        }

        if (timeEntryToBeEdited.userId !== authenticatedUser.userId) {
            if (authenticatedUser.role !== "MANAGER") {
                return NextResponse.json(
                    { message: "Unauthorized - User not authorized" },
                    { status: 403 },
                );
            }
        }

        const updatedMinutesWorked = !newClockOutTime
            ? 0
            : Math.floor((new Date(newClockOutTime).getTime() - new Date(newClockInTime).getTime()) / 60000);

        try {
            const updatedTimeEntry = await dbSingleton.timeEntry.update({
                where: { timeEntryId: timeEntryToBeEdited.timeEntryId },
                data: {
                    clockInTime: newClockInTime,
                    clockOutTime: !newClockOutTime ? timeEntryToBeEdited.clockOutTime : newClockOutTime,
                    updatedAt: new Date(),
                    minutesWorked: updatedMinutesWorked,
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
                message: `Time entry update successfully`,
                updatedTimeEntry: {
                    timeEntryId: updatedTimeEntry.timeEntryId,
                    userId: updatedTimeEntry.userId,
                    clockInTime: updatedTimeEntry.clockInTime,
                    clockOutTime: updatedTimeEntry.clockOutTime,
                },
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error updating time entry:", error.message);
            } else {
                console.error("Unexpected error:", error);
            }
            return NextResponse.json(
                { message: "Error updating time entry" },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Error during time entry update:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

import {dbSingleton} from "@/app/lib/dbSingleton.ts";
import {NextResponse} from "next/server";
import bcrypt from "bcrypt";
import {verifySession} from "@/app/lib/data-access-layer.ts";

export async function UPDATE(request: Request) {
    const session = await verifySession();

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

        if (!authenticatedUser) {
            return NextResponse.json(
                { message: "Unauthorized - User not found" },
                { status: 401 },
            );
        }

        const requestBody = await request.json();
        const { userIdToEdit, updatedHourlyRate } = requestBody;

        if (!userIdToEdit || userIdToEdit.length === 0) {
            return NextResponse.json(
                { message: "No user IDs provided" },
                { status: 400 },
            );
        }

        if (!updatedHourlyRate) {
            return NextResponse.json(
                { message: "Hourly rate is required" },
                { status: 400 },
            );
        }
        if (updatedHourlyRate < 0 ) {
            return NextResponse.json(
                { message: "Hourly rate must be positve" },
                { status: 400 },
            );
        }

        if (userIdToEdit.includes(authenticatedUser.userId)) {
            return NextResponse.json(
                {
                    message:
                        "Managers cannot edit their own hourly rate.",
                },
                { status: 403 },
            );
        }

        if (authenticatedUser.role !== "MANAGER") {
            return NextResponse.json(
                {
                    message:
                        "Unauthorized - Only managers can edit hourly rates",
                },
                { status: 403 },
            );
        }

        try {
            const updatedUser = await dbSingleton.user.update({
                where: { userId: userIdToEdit },
                data: {
                    hourlyRate: updatedHourlyRate,
                    updatedAt: new Date(),
                },
                select: {
                    userId: true,
                    name: true,
                    email: true,
                    hourlyRate: true,
                    updatedAt: true,
                },
            });

            return NextResponse.json({
                message:
                    `Hourly rate updated successfully for user ${updatedUser.userId}`,
                status: 200,
                updatedUser: {
                    userId: updatedUser.userId,
                    email: updatedUser.email,
                    hourlyRate: updatedUser.hourlyRate,
                    updatedAt: updatedUser.updatedAt,
                },
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error updating hourly rate:", error.message);
            } else {
                console.error("Unexpected error:", error);
            }
        }
    } catch (error) {
        console.error("Error during hourly rate update:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

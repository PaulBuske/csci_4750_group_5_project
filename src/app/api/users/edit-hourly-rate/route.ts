import { dbSingleton } from "@/app/lib/dbSingleton.ts";
import { NextResponse } from "next/server";
import { verifySession } from "@/app/lib/data-access-layer.ts";


export async function PUT(request: Request) {
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
                { message: "User ID to edit is required" },
                { status: 400 },
            );
        }


        const rate = Number(updatedHourlyRate);

        if (updatedHourlyRate === undefined || updatedHourlyRate === null) {
            return NextResponse.json(
                { message: "Hourly rate is required" },
                { status: 400 },
            );
        }
        if (isNaN(rate) || rate < 0) {
            return NextResponse.json(
                { message: "Hourly rate must be a non-negative number" },
                { status: 400 },
            );
        }

        if (userIdToEdit === authenticatedUser.userId) {
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


        const updatedUser = await dbSingleton.user.update({
            where: { userId: userIdToEdit },
            data: {
                hourlyRate: rate,
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
    } catch (error) {
        console.error("Error during hourly rate update:", error);

        return NextResponse.json(
            { message: "Internal server error during update" },
            { status: 500 },
        );
    }
}
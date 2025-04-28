import {dbSingleton} from "@/app/lib/dbSingleton.ts";
import {NextResponse} from "next/server";
import bcrypt from "bcrypt";
import {verifySession} from "@/app/lib/data-access-layer.ts";

export async function POST(request: Request) {
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
        const { userIdToReset, password } = requestBody;

        if (!userIdToReset || userIdToReset.length === 0) {
            return NextResponse.json(
                { message: "No user IDs provided" },
                { status: 400 },
            );
        }

        if (!password || password.trim() === "") {
            return NextResponse.json(
                { message: "Password is required" },
                { status: 400 },
            );
        }

        if (userIdToReset.includes(authenticatedUser.userId)) {
            return NextResponse.json(
                {
                    message:
                        "Administrators cannot reset their own password through this interface",
                },
                { status: 403 },
            );
        }

        if (authenticatedUser.role !== "ADMIN") {
            return NextResponse.json(
                {
                    message:
                        "Unauthorized - Only administrators can reset passwords",
                },
                { status: 403 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const updatedUser = await dbSingleton.user.update({
                where: { userId: userIdToReset },
                data: {
                    password: hashedPassword,
                    updatedAt: new Date(),
                },
                select: {
                    userId: true,
                    name: true,
                    email: true,
                    updatedAt: true,
                },
            });

            return NextResponse.json({
                message:
                    `Password reset successfully for user ${updatedUser.userId}`,
                status: 200,
                updatedUser: {
                    userId: updatedUser.userId,
                    email: updatedUser.email,
                    updatedAt: updatedUser.updatedAt,
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

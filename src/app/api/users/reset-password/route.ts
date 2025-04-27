import {dbSingleton} from "@/app/lib/dbSingleton.ts";
import {NextResponse} from "next/server";
import bcrypt from "bcrypt";
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/app/lib/auth.ts";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "Unauthorized", status: 401 }
            );
        }

        const currentUserId = session.user.userId;
        const requestBody = await request.json();
        const { userIds, password } = requestBody;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { message: "No user IDs provided", status: 400 }
            );
        }

        if (!password || password.trim() === '') {
            return NextResponse.json(
                { message: "Password is required", status: 400 }
            );
        }

        // Prevent admin from resetting their own password through this endpoint
        if (userIds.includes(currentUserId)) {
            return NextResponse.json(
                { message: "Administrators cannot reset their own password through this interface", status: 403 }
            );
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update passwords in a transaction to ensure atomicity
        const updatedUsers = await dbSingleton.$transaction(
            userIds.map(userId =>
                dbSingleton.user.update({
                    where: { userId },
                    data: {
                        password: hashedPassword,
                        updatedAt: new Date() // This explicitly sets the updatedAt timestamp
                    },
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        updatedAt: true
                    }
                })
            )
        ).catch(error => {
            // Handle specific errors like user not found
            if (error.code === 'P2025') {
                return null; // Record not found
            }
            throw error; // Re-throw other errors
        });

        if (!updatedUsers) {
            return NextResponse.json(
                { message: "One or more users not found", status: 404 }
            );
        }

        return NextResponse.json({
            message: `Password reset successfully for ${updatedUsers.length} user(s)`,
            status: 200,
            updatedUsers: updatedUsers.map(user => ({
                userId: user.userId,
                email: user.email,
                updatedAt: user.updatedAt
            }))
        });
    }
    catch (error) {
        console.error("Error during password reset:", error);
        return NextResponse.json(
            { message: "Internal server error", status: 500 }
        );
    }
}
// src/app/api/users/delete-user/route.ts
import {dbSingleton} from "@/app/lib/dbSingleton.ts";
import {NextResponse} from "next/server";
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/app/lib/auth";

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
        const { userIds } = requestBody;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { message: "No user IDs provided", status: 400 }
            );
        }

        // Prevent admin from deleting themselves
        if (userIds.includes(currentUserId)) {
            return NextResponse.json(
                { message: "Administrators cannot delete their own account", status: 403 }
            );
        }

        // Delete users in a transaction to ensure atomicity
        const deletedUsers = await dbSingleton.$transaction(
            userIds.map(userId =>
                dbSingleton.user.delete({
                    where: { userId },
                    select: {
                        userId: true,
                        name: true,
                        email: true,
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

        if (!deletedUsers) {
            return NextResponse.json(
                { message: "One or more users not found", status: 404 }
            );
        }

        return NextResponse.json({
            message: `${deletedUsers.length} user(s) deleted successfully`,
            status: 200,
            deletedUsers
        });
    }
    catch (error) {
        console.error("Error during user deletion:", error);
        return NextResponse.json(
            { message: "Internal server error", status: 500 }
        );
    }
}
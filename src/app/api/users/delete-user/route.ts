import { dbSingleton } from "@/app/lib/dbSingleton.ts";
import { NextResponse } from "next/server";
import { verifySession } from "@/app/lib/data-access-layer.ts";

export async function POST(request: Request) {
    const session = await verifySession();

    if (!session) {
        return new Response(null, { status: 401 });
    }

    const userId = session.userId.toString();

    try {
        const authenticatedUser = await dbSingleton.user.findUnique({
            where: { userId: userId },
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

        const authenticatedUserRole: string = authenticatedUser.role.toString();

        console.log("Authenticated User Role:", authenticatedUserRole);

        if (authenticatedUserRole !== "ADMIN") {
            return new Response(null, { status: 403 });
        }

        const requestBody = await request.json();
        const { userIds } = requestBody;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { message: "No user IDs provided", status: 400 },
            );
        }

        if (userIds.includes(authenticatedUser.userId)) {
            return NextResponse.json(
                {
                    message: "Administrators cannot delete their own account",
                    status: 403,
                },
            );
        }

        const deletedUsers = await dbSingleton.$transaction(
            userIds.map((userId) =>
                dbSingleton.user.delete({
                    where: { userId },
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                    },
                })
            ),
        ).catch((error) => {
            if (error.code === "P2025") {
                return null;
            }
            throw error;
        });

        if (!deletedUsers) {
            return NextResponse.json(
                { message: "One or more users not found", status: 404 },
            );
        }

        return NextResponse.json({
            message: `${deletedUsers.length} user(s) deleted successfully`,
            status: 200,
            deletedUsers,
        });
    } catch (error) {
        console.error("Error during user deletion:", error);
        return NextResponse.json(
            { message: "Internal server error", status: 500 },
        );
    }
}

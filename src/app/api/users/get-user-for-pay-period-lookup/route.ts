import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifySession } from "@/app/lib/data-access-layer.ts";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    const session = await verifySession();

    if (!session) {
        return new Response(null, { status: 401 });
    }

    const requestBody = await request.json();
    const { userIdToSearch, currentUserId } = requestBody;

    if (!currentUserId || currentUserId.length === 0 || !userIdToSearch || userIdToSearch.length === 0) {
        return NextResponse.json(
            { message: "No user IDs provided" },
            { status: 400 }
        );
    }

    try {
        const authenticatedUser = await prisma.user.findUnique({
            where: { userId: currentUserId },
            select: {
                userId: true,
                role: true,
            },
        });

        const foundUser = await prisma.user.findUnique({
            where: { userId: userIdToSearch },
            select: {
                userId: true,
                name: true,
                email: true,
                hourlyRate: true,
                role: true,
            },
        });

        if (!authenticatedUser) {
            return NextResponse.json(
                { message: "Unauthorized - User not found" },
                { status: 401 }
            );
        }

        if (!foundUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        if (authenticatedUser.role !== "MANAGER") {
            return NextResponse.json(
                { message: "Unauthorized - Only managers can view pay periods of other users" },
                { status: 403 }
            );
        }

        return NextResponse.json({ foundUser });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error fetching user:', error.message);
        } else {
            console.error('Unexpected error fetching user:', error);
        }
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
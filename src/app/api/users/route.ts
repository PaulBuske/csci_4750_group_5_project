import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    // User authentication and role verification
    const session = await verifySession()

    // Check if the user is authenticated
    if (!session) {
        // User is not authenticated
        return new Response(null, { status: 401 })
    }

    // // Check if the user has the 'admin' role
    // if (session.user.role !== 'admin') {
    //     // User is authenticated but does not have the right permissions
    //     return new Response(null, { status: 403 })
    // }

    try {
        const users = await prisma.user.findMany();
        return NextResponse.json({ users });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error fetching users:', error.message);
        } else {
            console.error('Unexpected error fetching users:', error);
        }
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
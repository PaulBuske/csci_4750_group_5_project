import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
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
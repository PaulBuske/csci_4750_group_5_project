// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { encrypt } from '@/app/lib/session';
import { db } from '@/app/lib/db';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await db.users.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Set the expiration time to 15 minutes from now
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Create a session in the database
        const session = await db.sessions.create({
            data: {
                userId: user.id,
                expiresAt,
            }
        });

        // Encrypt the session data
        const encryptedSession = await encrypt({
            sessionId: session.id,
            userId: user.id,
            expiresAt: expiresAt.toISOString()
        });

        // Set the session cookie
        cookies().set('session', encryptedSession, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: expiresAt,
            sameSite: 'lax',
            path: '/',
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { dbSingleton } from '../lib/dbSingleton.ts';

const secretKey = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback_secret_key_at_least_32_chars_long!'
);

export async function encrypt(payload: JWTPayload | undefined) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(secretKey);
}

export async function decrypt(token: string | undefined) {
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error) {
        console.error('Failed to verify JWT:', error);
        return null;
    }
}

export async function createSession(userId: string) {
    // Set the expiration time to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 1. Create a session in the database
    const session = await dbSingleton.session.create({
        data: {
            userId: userId,
            expiresAt,
        }
    });

    const sessionId = session.sessionId;

    // 2. Encrypt the session ID
    const encryptedSession = await encrypt({ sessionId, userId, expiresAt });

    // 3. Store the session in cookies for optimistic auth checks
    const cookieStore = cookies();
    (await cookieStore).set('session', encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      sameSite: 'lax',
      path: '/',
    });

    return sessionId;
}
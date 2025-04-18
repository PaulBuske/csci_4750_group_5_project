// src/app/lib/session.ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback_secret_key_at_least_32_chars_long!'
);

export async function encrypt(payload: unknown) {
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
        logger.error('Failed to verify JWT:', error);
        return null;
    }
}
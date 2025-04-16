// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected and public routes
const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/public/login', '/signup'];

// This function mimics your decrypt function for middleware use
async function verifyToken(token: string | undefined) {
    if (!token) return null;

    const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET || 'fallback_secret_key_at_least_32_chars_long!'
    );

    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Get the session cookie directly from the request
    const sessionCookie = req.cookies.get('session')?.value;

    // Check route types
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

    // Skip middleware for non-relevant routes
    if (!isProtectedRoute && !isPublicRoute) {
        return NextResponse.next();
    }

    try {
        // Verify the token
        const session = sessionCookie ? await verifyToken(sessionCookie) : null;

        // Debug - log URL and session info
        console.log(`Path: ${path}, isProtected: ${isProtectedRoute}, isPublic: ${isPublicRoute}, hasSession: ${Boolean(session?.userId)}`);

        // Redirect cases
        if (isProtectedRoute && !session?.userId) {
            // User is trying to access protected route but not logged in
            return NextResponse.redirect(new URL('/public/login', req.url));
        }

        if (isPublicRoute && session?.userId) {
            // User is already logged in but trying to access login/signup
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // Otherwise, continue
        return NextResponse.next();
    } catch (error) {
        console.error('Middleware error:', error);
        // On error, clear session and redirect to login
        const response = NextResponse.redirect(new URL('/public/login', req.url));
        response.cookies.delete('session');
        return response;
    }
}

// Only run middleware on specified routes
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/public/login',
        '/signup'
    ],
};
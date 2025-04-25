import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected and public routes
const protectedRoutes = ['/dashboard'];
// Define public routes that should redirect if logged in
const authRoutes = ['/public/login', '/signup'];
// Define routes that are always public
const alwaysPublicRoutes = ['/docs/', '/public/docs/']; // Use startsWith for matching

// This function mimics your decrypt function for middleware use
async function verifyToken(token: string | undefined) {
    if (!token) return null;

    // Fix: Use Deno.env.get()
    const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET || 'fallback_secret_key_at_least_32_chars_long!'
    );

    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error) {
        console.log('Token verification error:', error);
        return null;
    }
}

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    // ADD LOGGING HERE
    console.log(`Middleware received request for: ${path}`);

    // Get the session cookie directly from the request
    const sessionCookie = req.cookies.get('session')?.value;

    // Fix: Check if path starts with always public routes first
    const isAlwaysPublic = alwaysPublicRoutes.some(route => path.startsWith(route));
    if (isAlwaysPublic) {
        // Allow access to docs regardless of login status
        return NextResponse.next();
    }

    // Check route types
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isAuthRoute = authRoutes.some(route => path.startsWith(route));

    // Skip middleware for non-relevant routes (if any slip through the matcher)
    if (!isProtectedRoute && !isAuthRoute) {
        return NextResponse.next();
    }

    try {
        // Verify the token
        const session = sessionCookie ? await verifyToken(sessionCookie) : null;

        // Debug - log URL and session info
        console.log(`Path: ${path}, isProtected: ${isProtectedRoute}, isAuth: ${isAuthRoute}, hasSession: ${Boolean(session?.userId)}`);

        // Redirect cases
        if (isProtectedRoute && !session?.userId) {
            // User is trying to access protected route but not logged in
            return NextResponse.redirect(new URL('/public/login', req.url));
        }

        // Fix: Only redirect from auth routes if logged in
        if (isAuthRoute && session?.userId) {
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
        '/signup', // Add signup if it exists and needs protection/redirection
        '/public/docs/:path*', // Fix: Add slash
        '/docs/:path*',
    ],
};
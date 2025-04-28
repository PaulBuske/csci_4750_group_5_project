import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/public/login", "/signup"];
const alwaysPublicRoutes = ["/docs/", "/public/docs/"];

async function verifyToken(token: string | undefined) {
    if (!token) return null;

    const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET || "fallback_secret_key_at_least_32_chars_long!",
    );

    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error) {
        console.log("Token verification error:", error);
        return null;
    }
}

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    console.log(`Middleware received request for: ${path}`);

    const sessionCookie = req.cookies.get("session")?.value;

    const isAlwaysPublic = alwaysPublicRoutes.some((route) =>
        path.startsWith(route)
    );
    if (isAlwaysPublic) {
        return NextResponse.next();
    }

    const isProtectedRoute = protectedRoutes.some((route) =>
        path.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

    if (!isProtectedRoute && !isAuthRoute) {
        return NextResponse.next();
    }

    try {
        const session = sessionCookie ? await verifyToken(sessionCookie) : null;

        console.log(
            `Path: ${path}, isProtected: ${isProtectedRoute}, isAuth: ${isAuthRoute}, hasSession: ${
                Boolean(session?.userId)
            }`,
        );

        if (isProtectedRoute && !session?.userId) {
            return NextResponse.redirect(new URL("/public/login", req.url));
        }

        if (isAuthRoute && session?.userId) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);
        const response = NextResponse.redirect(
            new URL("/public/login", req.url),
        );
        response.cookies.delete("session");
        return response;
    }
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/public/login",
        "/signup",
        "/public/docs/:path*",
        "/docs/:path*",
    ],
};

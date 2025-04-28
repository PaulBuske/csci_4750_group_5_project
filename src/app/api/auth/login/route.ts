import {NextResponse} from "next/server";
import bcrypt from "bcrypt";
import {cookies} from "next/headers";
import {encrypt} from "@/app/lib/sessions.ts";
import {dbSingleton} from "@/app/lib/dbSingleton.ts";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required"}, {status: 400 }
            );
        }

        const user = await dbSingleton.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password"}, {status: 401 }
            );
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: "Invalid password"}, {status: 401 }
            );
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const session = await dbSingleton.session.create({
            data: {
                userId: user.userId,
                expiresAt: expiresAt,
            },
        });

        const encryptedSession = await encrypt({
            sessionId: session.sessionId,
            userId: user.userId,
            expiresAt: expiresAt.toISOString(),
        });

        const cookieStore = await cookies();
        cookieStore.set("session", encryptedSession, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: expiresAt,
            sameSite: "lax",
            path: "/",
        });
        console.log("Session cookie set:", encryptedSession);
        return NextResponse.json({
            success: true,
            user: {
                id: user.userId,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal server error"}, {status: 500 }
        );
    }
}

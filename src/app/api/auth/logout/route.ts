import {dbSingleton} from "@/app/lib/dbSingleton.ts";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {decrypt} from "@/app/lib/sessions.ts";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const encryptedSession = cookieStore.get('session')?.value || '';
        const decryptedSession = await decrypt(encryptedSession);

        const sessionId: unknown = decryptedSession?.sessionId;

        cookieStore.delete("session");

        if (!sessionId) {
            return NextResponse.json(
                { message: "Session not found", status: 401 },
            );

        }

        if(typeof sessionId === 'string') {
            const deletedSession = await dbSingleton.session.delete({
                where: {sessionId},
            });
            console.info('Deleted session:', deletedSession);
        }
        return NextResponse.json({ message: "Logged out successfully", status: 200 });
    } catch (error) {
        console.error("Error during logout:", error);
        return NextResponse.json(
            { message: "Internal server error", status: 500 },
        );
    }
}
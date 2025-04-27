import {dbSingleton} from "@/app/lib/dbSingleton.ts";
import {NextResponse} from "next/server";

export async function POST(request: Request) {
    try {
        const requestBody = await request.json();
        const { name, email, password, role } = requestBody;

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { message: "Missing required fields", status: 400 },
            );
        }

        const currentDate = new Date();

        const addUser = await dbSingleton.user.create({
            data: {
                name: name,
                email: email,
                password: password,
                role: role,
                createdAt: currentDate
            },
            select: {
                userId: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(
            { message: "User added", status: 200, addedUser: addUser },
        );
    }
    catch (error) {
        console.error("Error during add user:", error);
        return NextResponse.json(
            { message: "Internal server error", status: 500 },
        );
    }
}
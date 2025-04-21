import {UserRole} from "@prisma/client";

export type ValidSession ={
    isAuth: boolean
    userId: string
}

export type ProjectUser ={
    userId: string;
    name: string | null;
    email: string;
    hourlyRate: number | null;
    role: UserRole | null;
}
import 'server-only'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session'
import { dbSingleton } from '@/app/lib/dbSingleton.ts'
import {cache} from "react";
import {redirect} from "next/navigation";

export const verifySession = cache(async () => {
    const providedCookies = await cookies()
    const cookie = providedCookies.get('session')?.value
    const session = await decrypt(cookie)

    if (!session?.userId) {
        redirect('/login')
    }

    return { isAuth: true, userId: session.userId }
})

export const getUser = cache(async () => {
    const session = await verifySession()
    if (!session) return null

    try {
        const foundUser = await dbSingleton.users.findUnique({
            where: { id: session.userId.toString() },
            select: {
                id: true,
                name: true,
                email: true,
            },
        })
        if (!foundUser) {
            alert('User not found')
            redirect('/login')
        }
        if(!foundUser.id) {
            const data = foundUser
            return data
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error('Failed to fetch user:', error.message)
        }
        return null
    }
})
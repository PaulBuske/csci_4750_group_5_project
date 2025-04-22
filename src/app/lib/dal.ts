'use server'

import {cookies} from 'next/headers'
import {decrypt} from "@/app/lib/sessions.ts"
import {dbSingleton} from "@/app/lib/dbSingleton.ts"
import {cache} from "react";
import {redirect} from "next/navigation";
import {checkPayPeriodRange} from "@/app/api/time-punch/checkPayPeriodRange.ts";

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
        const foundUser = await dbSingleton.user.findUnique({
            where: { userId: session.userId.toString() },
            select: {
                userId: true,
                name: true,
                email: true,
                hourlyRate: true,
                role: true,
            },
        })
        if (!foundUser) {
            alert('User not found')
            redirect('/login')
        }
        if(foundUser.userId) {
            const projectUser ={
                ...foundUser, hourlyRate: foundUser.hourlyRate.toNumber()
            }
            return projectUser
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to fetch user:', error.message)
        }
        return null
    }
})

export const createOrGetPayPeriodIfNotExists = async (userId: string, currentDate: Date) => {

    const existingPayPeriod = await dbSingleton.payPeriod.findFirst({
        where: {
            userId,
            startDate: { lte: currentDate },
            endDate: { gte: currentDate },
        },
    });

    const foundPayPeriodId = existingPayPeriod?.payPeriodId;

    if (!foundPayPeriodId) {
        const {startDate, endDate} = checkPayPeriodRange(currentDate);
        const newPayPeriod = await dbSingleton.payPeriod.create({
            data: {
                userId,
                startDate,
                endDate,
                totalHours: 0,
                grossPay: 0,
                status: 'PENDING',
            },
        });
        return newPayPeriod.payPeriodId
    }
    else{
        return foundPayPeriodId;
    }
}

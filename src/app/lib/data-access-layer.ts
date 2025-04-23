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
            return {
                ...foundUser, hourlyRate: foundUser.hourlyRate.toNumber()
            }
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to fetch user:', error.message)
        }
        return null
    }
})

export const getOrCreatePayPeriodIfNotExists = async (userId: string, currentDate: Date) => {

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

export const getTimeEntriesByPayPeriodIdAndUserId = async (userId: string, payPeriodId: string) => {

    try {
        const timeEntries = await dbSingleton.timeEntry.findMany({
            where: {
                userId,
                payPeriodId,
            },
        });

        if (!timeEntries) {
            console.error('No time entries found for this pay period and user.');
            return [];
        }
        return timeEntries;

    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error('Error fetching time entries:', e.message);
        }
        return [];
    }
}

export const getPayPeriodByPeriodIdAndUserId = async (payPeriodId: string, userId: string) => {
    try {
        const payPeriod = await dbSingleton.payPeriod.findFirst({
            where: {
                payPeriodId,
                userId,
            },
        });

        if (!payPeriod) {
            console.error('No pay period found for this ID and user.');
            return null;
        }
        if(payPeriod.payPeriodId) {
            return {
                ...payPeriod,
                totalHours: payPeriod.totalHours.toNumber(),
                grossPay: payPeriod.grossPay.toNumber(),
            }
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error('Error fetching pay period:', e.message);
        }
        return null;
    }
}

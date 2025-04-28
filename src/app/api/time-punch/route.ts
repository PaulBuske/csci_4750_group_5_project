import {dbSingleton} from "@/app/lib/dbSingleton.ts";
import {NextResponse} from "next/server";
import {getOrCreatePayPeriodIfNotExists} from "@/app/lib/data-access-layer.ts";

export async function POST(request: Request) {

    try{
        const requestBody = await request.json();
        const {userId, timestamp, type} = requestBody;

        if (!userId || !timestamp || !type) {
            return NextResponse.json(
                {message: "Missing required fields", status: 400},
            );
        }

        const currentDate = new Date(timestamp);

        const currentPayPeriodId = await getOrCreatePayPeriodIfNotExists(userId, currentDate);

        if(type == 'in'){
            const clockInTime = new Date(timestamp);
            const timeEntry = await dbSingleton.timeEntry.create({
                data: {
                    userId,
                    clockInTime,
                    payPeriodId: currentPayPeriodId,
                },
                select: {
                    clockInTime: true,
                    clockOutTime: true,
                    minutesWorked: true,
                },
            });
            return NextResponse.json(
                { message: "Clocked in successfully", status: 200, timeEntry},
            );
        }
        else if(type == 'out'){
            const clockOutTime = new Date(timestamp);
            await dbSingleton.timeEntry.updateMany({
                where: {
                    userId,
                    clockInTime: {
                        not: undefined,
                    },
                    clockOutTime: null,
                    payPeriodId: currentPayPeriodId,
                },
                data: {
                    clockOutTime: clockOutTime,
                },
            });

            const clockInEntry = await dbSingleton.timeEntry.findFirst({
                where: {
                    userId,
                    clockOutTime: clockOutTime,
                    payPeriodId: currentPayPeriodId
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                select: {
                    timeEntryId: true,
                    clockInTime: true,
                    clockOutTime: true,
                    minutesWorked: true,
                },
            });

            const minutesWorked = Math.floor((Number(clockInEntry?.clockOutTime) - Number(clockInEntry?.clockInTime)) / 60000);

            const updatedEntry = await dbSingleton.timeEntry.update({
                where: {
                    timeEntryId: clockInEntry?.timeEntryId,
                },
                data: {
                    minutesWorked: minutesWorked,
                },
                select: {
                    clockInTime: true,
                    clockOutTime: true,
                    minutesWorked: true,
                },
            });

            return NextResponse.json(
                { message: "Clocked out successfully", status: 200, updatedEntry },
            );
        }
        else{
            return NextResponse.json(
                { message: "Invalid type. Use 'in' or 'out'.", status: 400 },
            );
        }
    }
    catch (error) {
        console.error("Error during time punch:", error);
        return NextResponse.json(
            { message: "Internal server error", status: 500 },
        );
    }

}
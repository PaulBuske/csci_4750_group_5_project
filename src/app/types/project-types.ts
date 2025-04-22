import {PayStatus, UserRole} from "@prisma/client";

export type ValidSession = {
    isAuth: boolean;
    userId: string;
};

export type ProjectUser = {
    userId: string;
    name: string | null;
    email: string;
    hourlyRate: number | null;
    role: UserRole | null;
};

export type TimeEntry = {
    userId: string;
    clockInTime: Date;
    clockOutTime?: Date | null;
    minutesWorked?: number | null;
    notes?: string | null;
    payPeriodId?: string;
};

export type PayPeriod = {
    userId: string;
    startDate: Date;
    endDate: Date;
    totalHours?: number | null;
    grossPay?: number | null;
    status: PayStatus;
};

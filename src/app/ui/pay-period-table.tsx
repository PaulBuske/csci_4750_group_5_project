import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {PayPeriod, ProjectUser, TimeEntry} from "@/app/types/project-types.ts";
import dayjs from "dayjs";

const TAX_RATE = 0.12;

const ccyFormat = (num: number) => `${num.toFixed(2)}`;

const timeEntryPaySum = (hoursWorked: number, payRate: number) => hoursWorked * payRate;

const createRow = (workedDate: Date, clockIn: Date, clockOut: Date, minutesWorked: number, payRate: number) => {

    const hoursWorked = minutesWorked / 60;
    const earned = timeEntryPaySum(hoursWorked, payRate);

    return { workedDate, clockIn, clockOut, hoursWorked, earned };
};
/*

const grossPay = (items: {
    workedDate: dayjs.Dayjs;
    clockIn: dayjs.Dayjs;
    clockOut: dayjs.Dayjs;
    hoursWorked: number;
    earned: number
}[]) => items.map(({earned}) => earned).reduce((sum, i) => sum + i, 0);

*/


const calculatePayStubTaxes = (grossPay, TAX_RATE) =>{
    const payStubTaxes = grossPay * TAX_RATE ;
    return payStubTaxes;
}
const caclulateNetPay = (grossPay, payStubTaxes) => {
    const payStubNetPay = grossPay - payStubTaxes;
    return payStubNetPay;
}

type PayPeriodTableProps = {
    currentUser?: ProjectUser | null
}

const clockInTime: Date = new Date(2025, 4, 19, 5, 30);
const clockOutTime: Date = new Date(2025, 4, 19, 6, 0);
const timeEntry: TimeEntry = {
    userId: '1',
    clockInTime: clockInTime,
    clockOutTime: clockOutTime,
    updatedAt: clockOutTime,
    minutesWorked: 0,
    payPeriodId: '1',
}
const timeEntryArray: TimeEntry[] = [timeEntry];

const payPeriod: PayPeriod = {
    payPeriodId: '1',
    userId: '1',
    startDate: new Date(2025, 4, 1),
    endDate: new Date(2025, 4, 15),
    totalHours: .5,
    grossPay: 0,
    status: 'PENDING'
}
const payPeriodArray: PayPeriod[] = [payPeriod];

const PayPeriodTable = ({currentUser}: PayPeriodTableProps) => {
    const [payPeriods, setPayPeriods] = React.useState<PayPeriod[] | null>(null);
    const [timeEntries, setTimeEntries] = React.useState<TimeEntry[] | null>(null);
    const [payPeriodLookup, setPayPeriodLookup] = React.useState<Date>(new Date());

    setPayPeriods(payPeriodArray)
    setTimeEntries(timeEntryArray)

    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 700}} aria-label="spanning table">
                <TableHead>
                    <TableRow>
                        <TableCell align="left" colSpan={4}>
                            Pay Period Start: {} End: {}
                        </TableCell>
                        <TableCell align="right">Total Pay</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="left">Clock In</TableCell>
                        <TableCell align="left">Clock Out</TableCell>
                        <TableCell align="right">Hours Worked</TableCell>
                        <TableCell align="right">Earned</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.workedDate.toString()}>
                            <TableCell>{row.workedDate.toString()}</TableCell>
                            <TableCell align="left">{row.clockIn.toString()}</TableCell>
                            <TableCell align="left">{row.clockOut.toString()}</TableCell>
                            <TableCell align="right">{ccyFormat(row.hoursWorked)}</TableCell>
                            <TableCell align="right">{ccyFormat(row.earned)}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell rowSpan={3}/>
                        <TableCell colSpan={2}>Subtotal</TableCell>
                        <TableCell align="right">{ccyFormat(payStubGrossPay)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Tax</TableCell>
                        <TableCell align="right">{`${(TAX_RATE * 100).toFixed(0)} %`}</TableCell>
                        <TableCell align="right">{ccyFormat(payStubTaxes)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell align="right">{ccyFormat(payStubNetPay)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default PayPeriodTable;

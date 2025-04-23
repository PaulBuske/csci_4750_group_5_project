import * as React from 'react';
import {useEffect} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {PayPeriod, ProjectUser, TimeEntry} from "@/app/types/project-types.ts";
import {Box, Stack, Typography} from "@mui/material";

const TAX_RATE = 0.12;

const ccyFormat = (num: number): string => `${num.toFixed(2)}`;

const timeEntryPaySum = (hoursWorked: number, payRate: number): number => hoursWorked * payRate;

const createTimeEntryRows = (timeEntries: TimeEntry[], currentUser: ProjectUser): TimeEntryRow[] => {
    return timeEntries.map((timeEntry: TimeEntry) => {
        const workedDate = new Date(timeEntry.clockInTime);
        const clockIn = new Date(timeEntry.clockInTime);
        const clockOut = timeEntry.clockOutTime ? new Date(timeEntry.clockOutTime) : null;
        const hoursWorked = timeEntry.minutesWorked ? timeEntry.minutesWorked / 60 : 0;
        const earned = currentUser.hourlyRate ? (timeEntryPaySum(hoursWorked, currentUser.hourlyRate)) : 0;

        return {workedDate, clockIn, clockOut, hoursWorked, earned};
    });
};

type TimeEntryRow = {
    workedDate: Date;
    clockIn: Date;
    clockOut: Date | null;
    hoursWorked: number;
    earned: number
}

const calculateGrossPay = (timeEntryRows: TimeEntryRow[]) =>
    timeEntryRows.map(({earned}) => earned).reduce((sum, i) => sum + i, 0);

const calculatePayStubTaxes = (grossPay: number, TAX_RATE: number) => grossPay * TAX_RATE;

const calculateNetPay = (grossPay: number, payStubTaxes: number) => grossPay - payStubTaxes;

type PayPeriodTableProps = {
    currentUser?: ProjectUser | null
}

// Replace your hardcoded sample data with this
const today = new Date();
const startDate = new Date(today);
startDate.setDate(today.getDate() - 7); // Start date is 7 days ago
const endDate = new Date(today);
endDate.setDate(today.getDate() + 7); // End date is 7 days from now

const clockInTime: Date = new Date(today);
clockInTime.setHours(9, 30, 0); // 9:30 AM today
const clockOutTime: Date = new Date(today);
clockOutTime.setHours(17, 0, 0); // 5:00 PM today

const timeEntry: TimeEntry = {
    userId: '93301285-a6b1-4a79-9b41-b45f7454b0d2',
    clockInTime: clockInTime,
    clockOutTime: clockOutTime,
    updatedAt: clockOutTime,
    minutesWorked: 450, // 7.5 hours
    payPeriodId: '1',
}
const timeEntryArray: TimeEntry[] = [timeEntry];

const payPeriod: PayPeriod = {
    payPeriodId: '1',
    userId: '93301285-a6b1-4a79-9b41-b45f7454b0d2',
    startDate: startDate,
    endDate: endDate,
    totalHours: 7.5,
    grossPay: 0,
    status: 'PENDING'
}
const payPeriodArray: PayPeriod[] = [payPeriod];

const getPayPeriodId = (payPeriodLookUp: Date, payPeriods: PayPeriod[]): string | undefined => {
    for (const period of payPeriods) {
        if (period.startDate <= payPeriodLookUp && period.endDate >= payPeriodLookUp) {
            return period.payPeriodId.toString();
        }
    }
    return undefined;
}

const getTimeEntries = (payPeriodId: string, timeEntries: TimeEntry[]): TimeEntry[] => {
    return timeEntries.filter(entry => entry.payPeriodId === payPeriodId);
}

const PayPeriodTable = ({currentUser}: PayPeriodTableProps) => {
    const [payPeriods, setPayPeriods] = React.useState<PayPeriod[]>([]);
    const [timeEntries, setTimeEntries] = React.useState<TimeEntry[]>([]);
    const [payPeriodLookup] = React.useState<Date>(today);
    const [displayedTimeEntries, setDisplayedTimeEntries] = React.useState<TimeEntry[]>([]);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [timeEntryRows, setTimeEntryRows] = React.useState<TimeEntryRow[]>([]);
    const [payStubGrossPay, setPayStubGrossPay] = React.useState<number>(0);
    const [payStubTaxes, setPayStubTaxes] = React.useState<number>(0);
    const [payStubNetPay, setPayStubNetPay] = React.useState<number>(0);
    const [currentPayPeriod, setCurrentPayPeriod] = React.useState<PayPeriod | null>(null);

    // Initial data loading
    useEffect(() => {
        setPayPeriods(payPeriodArray);
        setTimeEntries(timeEntryArray);
    }, []);

    // Find the pay period based on lookup date
    useEffect(() => {
        if (payPeriods.length > 0) {
            const payPeriodId = getPayPeriodId(payPeriodLookup, payPeriods);

            if (!payPeriodId) {
                setErrorMessage('Pay period not found.');
                return;
            }

            const foundPayPeriod = payPeriods.find(p => p.payPeriodId === payPeriodId);
            setCurrentPayPeriod(foundPayPeriod || null);

            // Get time entries for this pay period
            const relevantEntries = getTimeEntries(payPeriodId, timeEntries);
            setDisplayedTimeEntries(relevantEntries);

            if (relevantEntries.length === 0) {
                setErrorMessage('No time entries found for this pay period.');
            } else {
                setErrorMessage(null);
            }
        }
    }, [payPeriods, timeEntries, payPeriodLookup]);

    // Calculate pay information when time entries or user changes
    useEffect(() => {
        if (displayedTimeEntries.length > 0 && currentUser) {
            const newTimeEntryRows = createTimeEntryRows(displayedTimeEntries, currentUser);
            setTimeEntryRows(newTimeEntryRows);

            const grossPay = calculateGrossPay(newTimeEntryRows);
            const taxes = calculatePayStubTaxes(grossPay, TAX_RATE);
            const netPay = calculateNetPay(grossPay, taxes);

            setPayStubGrossPay(grossPay);
            setPayStubTaxes(taxes);
            setPayStubNetPay(netPay);
        } else {
            setTimeEntryRows([]);
            setPayStubGrossPay(0);
            setPayStubTaxes(0);
            setPayStubNetPay(0);
        }
    }, [displayedTimeEntries, currentUser]);

    return (
        <Box>
            <Stack>
                {errorMessage && <Typography color="error">{errorMessage}</Typography>}
            </Stack>
            <TableContainer component={Paper}>
                <Table sx={{minWidth: 700}} aria-label="spanning table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="left" colSpan={3}>
                                Pay Period Start: {currentPayPeriod?.startDate.toLocaleDateString() || 'N/A'}
                            </TableCell>
                            <TableCell align='left'>End: {currentPayPeriod?.endDate.toLocaleDateString() || 'N/A'}</TableCell>
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
                        {timeEntryRows.map((row, index) => (
                            <TableRow key={`${row.workedDate.toISOString()}-${index}`}>
                                <TableCell>{row.workedDate?.toLocaleDateString()}</TableCell>
                                <TableCell align="left">{row.clockIn?.toLocaleTimeString()}</TableCell>
                                <TableCell align="left">{row.clockOut?.toLocaleTimeString()}</TableCell>
                                <TableCell align="right">{row.hoursWorked}</TableCell>
                                <TableCell align="right">{ccyFormat(row.earned)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell rowSpan={3}/>
                            <TableCell colSpan={3}>Subtotal</TableCell>
                            <TableCell align="right">{ccyFormat(payStubGrossPay)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={2}>Tax</TableCell>
                            <TableCell align="right">{`${(TAX_RATE * 100).toFixed(0)} %`}</TableCell>
                            <TableCell align="right">{ccyFormat(payStubTaxes)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={3}>Total</TableCell>
                            <TableCell align="right">{ccyFormat(payStubNetPay)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default PayPeriodTable;
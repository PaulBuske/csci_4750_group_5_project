import * as React from "react";
import { useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
    PayPeriod,
    ProjectUser,
    TimeEntry,
} from "@/app/types/project-types.ts";
import { Box, Stack, Typography } from "@mui/material";
import {
    getOrCreatePayPeriodIfNotExists, getPayPeriodByPeriodIdAndUserId,
    getTimeEntriesByPayPeriodIdAndUserId,
} from "@/app/lib/data-access-layer.ts";
import {DatePicker} from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";

const TAX_RATE = 0.12;

const ccyFormat = (num: number): string => `${num.toFixed(2)}`;

const timeEntryPaySum = (hoursWorked: number, payRate: number): number =>
    hoursWorked * payRate;

const createTimeEntryRows = (
    timeEntries: TimeEntry[],
    currentUser: ProjectUser,
): TimeEntryRow[] => {
    return timeEntries.map((timeEntry: TimeEntry) => {
        const workedDate = new Date(timeEntry.clockInTime);
        const clockIn = new Date(timeEntry.clockInTime);
        const clockOut = timeEntry.clockOutTime
            ? new Date(timeEntry.clockOutTime)
            : null;
        const hoursWorked = timeEntry.minutesWorked
            ? timeEntry.minutesWorked / 60
            : 0;
        const earned = currentUser.hourlyRate
            ? (timeEntryPaySum(hoursWorked, currentUser.hourlyRate))
            : 0;

        return { workedDate, clockIn, clockOut, hoursWorked, earned };
    });
};

type TimeEntryRow = {
    workedDate: Date;
    clockIn: Date;
    clockOut: Date | null;
    hoursWorked: number;
    earned: number;
};

const calculateGrossPay = (timeEntryRows: TimeEntryRow[]) =>
    timeEntryRows.map(({ earned }) => earned).reduce((sum, i) => sum + i, 0);

const calculatePayStubTaxes = (grossPay: number, TAX_RATE: number) =>
    grossPay * TAX_RATE;

const calculateNetPay = (grossPay: number, payStubTaxes: number) =>
    grossPay - payStubTaxes;

type PayPeriodTableProps = {
    currentUser?: ProjectUser | null;
    refreshTrigger?: number;
};

const today = new Date();

const PayPeriodTable = ({ currentUser,  refreshTrigger }: PayPeriodTableProps) => {
    const [payPeriodLookup, setPayPeriodLookup] = React.useState<Date>(today);
    const [displayedTimeEntries, setDisplayedTimeEntries] = React.useState<TimeEntry[]>([]);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [timeEntryRows, setTimeEntryRows] = React.useState<TimeEntryRow[]>([]);
    const [payStubGrossPay, setPayStubGrossPay] = React.useState<number>(0);
    const [payStubTaxes, setPayStubTaxes] = React.useState<number>(0);
    const [payStubNetPay, setPayStubNetPay] = React.useState<number>(0);
    const [currentPayPeriod, setCurrentPayPeriod] = React.useState<PayPeriod | null>(null);

    useEffect(() => {
        const fetchTimeEntriesForPayPeriod = async (
            userId: string,
            payPeriodLookup: Date,
        ) => {
            try {
                // Get or create pay period
                const payPeriodId = await getOrCreatePayPeriodIfNotExists(
                    userId,
                    payPeriodLookup,
                );
                if (!payPeriodId) {
                    setErrorMessage("Pay period not found.");
                    return;
                }

                // Get pay period details
                const payPeriod = await getPayPeriodByPeriodIdAndUserId(
                    payPeriodId,  // Use local variable instead of state
                    userId,
                );
                if (!payPeriod) {
                    setErrorMessage("Pay period not found.");
                    return;
                }
                setCurrentPayPeriod(payPeriod);

                // Get time entries
                const timeEntries = await getTimeEntriesByPayPeriodIdAndUserId(
                    userId,
                    payPeriodId,  // Use local variable instead of state
                );

                if (!timeEntries || timeEntries.length === 0) {
                    setErrorMessage("No time entries found for this pay period.");
                    return;
                }
                setDisplayedTimeEntries(timeEntries as TimeEntry[]);

            } catch (e: unknown) {
                if (e instanceof Error) {
                    setErrorMessage(e.message);
                    console.error("Failed to fetch data:", e.message);
                } else {
                    setErrorMessage("Unexpected error fetching data");
                    console.error("Unexpected error:", e);
                }
            }
        };
        if (!currentUser || !currentUser.userId) {
            setErrorMessage("User not found.");
            return;
        } else {
            fetchTimeEntriesForPayPeriod(currentUser.userId, payPeriodLookup).then();
        }
    }, [currentUser, payPeriodLookup, refreshTrigger, errorMessage]);

    useEffect(() => {
        if (displayedTimeEntries.length > 0 && currentUser) {
            const newTimeEntryRows = createTimeEntryRows(
                displayedTimeEntries,
                currentUser,
            );
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
    }, [displayedTimeEntries, currentUser, refreshTrigger, errorMessage]);

    return (
        <Box>
            <Stack sx={{paddingTop: '2rem', paddingBottom: '2rem'}}
            >
                {errorMessage && (
                    <Typography color="error">{errorMessage}</Typography>
                )}
                <Typography>Pick date to view previous pay periods:</Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    defaultValue={dayjs(payPeriodLookup)}
                    onChange={(newValue) => {
                    if (newValue) {
                        setPayPeriodLookup(newValue.toDate());
                    }
                }}/>
                </LocalizationProvider>
            </Stack>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 700 }} aria-label="spanning table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="left" colSpan={3}>
                                Pay Period Start: {currentPayPeriod?.startDate
                                    .toLocaleDateString() || "N/A"}
                            </TableCell>
                            <TableCell align="left">
                                End: {currentPayPeriod?.endDate
                                    .toLocaleDateString() || "N/A"}
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
                        {timeEntryRows.map((row, index) => (
                            <TableRow
                                key={`${row.workedDate.toISOString()}-${index}`}
                            >
                                <TableCell>
                                    {row.workedDate?.toLocaleDateString()}
                                </TableCell>
                                <TableCell align="left">
                                    {row.clockIn?.toLocaleTimeString()}
                                </TableCell>
                                <TableCell align="left">
                                    {row.clockOut?.toLocaleTimeString()}
                                </TableCell>
                                <TableCell align="right">
                                    {ccyFormat(row.hoursWorked)}
                                </TableCell>
                                <TableCell align="right">
                                    {ccyFormat(row.earned)}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell rowSpan={3} />
                            <TableCell colSpan={3}>Subtotal</TableCell>
                            <TableCell align="right">
                                {ccyFormat(payStubGrossPay)}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={2}>Tax</TableCell>
                            <TableCell align="right">
                                {`${(TAX_RATE * 100).toFixed(0)} %`}
                            </TableCell>
                            <TableCell align="right">
                                {ccyFormat(payStubTaxes)}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={3}>Total</TableCell>
                            <TableCell align="right">
                                {ccyFormat(payStubNetPay)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default PayPeriodTable;

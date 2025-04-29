import * as React from "react";
import {useEffect} from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {PayPeriod, ProjectUser, TimeEntry, TimeEntryRow,} from "@/app/types/project-types.ts";
import {Alert, Box, Fade, Stack, Typography} from "@mui/material";
import {
    getOrCreatePayPeriodIfNotExists,
    getPayPeriodByPeriodIdAndUserId,
    getTimeEntriesByPayPeriodIdAndUserId,
} from "@/app/lib/data-access-layer.ts";
import {DatePicker} from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import DeleteRowModalButton from "@/app/ui/delete-time-entry-row-modal-button.tsx";
import LogoSvgLoadingIcon from "@/app/ui/logo-svg-icon/logo-svg-loading-icon.tsx";
import EditTimeEntryRowModalButton from "@/app/ui/edit-time-entry-row-modal-button.tsx";

const TAX_RATE = 0.12;

const ccyFormat = (num: number): string => `${num.toFixed(2)}`;

const timeEntryPaySum = (hoursWorked: number, payRate: number): number =>
    hoursWorked * payRate;

const createTimeEntryRows = (
    timeEntries: TimeEntry[],
    currentUser: ProjectUser,
): TimeEntryRow[] => {
    return timeEntries.map((timeEntry: TimeEntry) => {
        const userId = timeEntry.userId;
        const timeEntryId = timeEntry.timeEntryId;
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

        return {
            userId,
            timeEntryId,
            workedDate,
            clockInTime: clockIn,
            clockOutTime: clockOut,
            hoursWorked,
            earned,
        };
    });
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


const PayPeriodTable = (
    { currentUser, refreshTrigger }: PayPeriodTableProps,
) => {
    const [payPeriodLookup, setPayPeriodLookup] = React.useState<Date>(today);
    const [timeEntryRows, setTimeEntryRows] = React.useState<TimeEntryRow[]>(
        [],
    );
    const [payStubGrossPay, setPayStubGrossPay] = React.useState<number>(0);
    const [payStubTaxes, setPayStubTaxes] = React.useState<number>(0);
    const [payStubNetPay, setPayStubNetPay] = React.useState<number>(0);
    const [currentPayPeriod, setCurrentPayPeriod] = React.useState<
        PayPeriod | null
    >(null);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [successAlertVisibility, setSuccessAlertVisibility] = React.useState<boolean>(false);
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
    const [errorAlertVisibility, setErrorAlertVisibility] = React.useState<boolean>(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const handleShowSuccessAlert = (providedSuccessMessage: string) => {
        const fiveSeconds = 5000;
        setSuccessAlertVisibility(true);
        setSuccessMessage(providedSuccessMessage)
        setTimeout(() => {
            setSuccessAlertVisibility(false);
        }, fiveSeconds);
    };

    const handleShowErrorAlert = (providedErrorMessage: string) => {
        const fiveSeconds = 5000;
        setErrorAlertVisibility(true);
        setErrorMessage(providedErrorMessage)
        setTimeout(() => {
            setErrorAlertVisibility(false);
        }, fiveSeconds);
    };


    useEffect(() => {
        const fetchAndProcessData = async () => {
            if (!currentUser || !currentUser.userId) {
                handleShowErrorAlert("User not found.")
                resetStates();
                setLoading(false);
                return;
            }

            try {
                const payPeriodId = await getOrCreatePayPeriodIfNotExists(
                    currentUser.userId,
                    payPeriodLookup,
                );

                if (!payPeriodId) {
                    handleShowErrorAlert("Pay period not found.")
                    resetStates();
                    setLoading(false);
                    return;
                }

                const payPeriod = await getPayPeriodByPeriodIdAndUserId(
                    payPeriodId,
                    currentUser.userId,
                );

                if (!payPeriod) {
                    handleShowErrorAlert("Pay period not found.")
                    resetStates();
                    setLoading(false);
                    return;
                }

                setCurrentPayPeriod(payPeriod);

                const timeEntries = await getTimeEntriesByPayPeriodIdAndUserId(
                    currentUser.userId,
                    payPeriodId,
                );

                if (!timeEntries || timeEntries.length === 0) {
                    handleShowErrorAlert("No time entries found for this pay period.")
                    resetStates();
                    setLoading(false);
                    return;
                }

                const entries = timeEntries as TimeEntry[];

                const newTimeEntryRows = createTimeEntryRows(
                    entries,
                    currentUser,
                );
                setTimeEntryRows(newTimeEntryRows);

                const grossPay = calculateGrossPay(newTimeEntryRows);
                const taxes = calculatePayStubTaxes(grossPay, TAX_RATE);
                const netPay = calculateNetPay(grossPay, taxes);

                setPayStubGrossPay(grossPay);
                setPayStubTaxes(taxes);
                setPayStubNetPay(netPay);

                setErrorMessage(null);
                setLoading(false);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    handleShowErrorAlert(e.message)
                    console.error("Failed to fetch data:", e.message);
                } else {
                    handleShowErrorAlert("Unexpected error fetching data")
                    console.error("Unexpected error:", e);
                }
                resetStates();
            } finally {
                setLoading(false);
            }
        };

        const resetStates = () => {
            setTimeEntryRows([]);
            setPayStubGrossPay(0);
            setPayStubTaxes(0);
            setPayStubNetPay(0);
        };

        fetchAndProcessData().then();
    }, [currentUser, payPeriodLookup, refreshTrigger, loading]);

    return (
 <Box>
     {loading
         ? (<LogoSvgLoadingIcon />) :
         (<Box>
             <Stack
                paddingTop="2rem"
                paddingBottom="2rem"
            >
                 <Fade in={successAlertVisibility} timeout={500}>
                     <Alert severity="success" onClose={() => {
                         setSuccessAlertVisibility(false);
                     }}>
                            {successMessage}
                     </Alert>
                 </Fade>

                 <Fade in={errorAlertVisibility} timeout={500}>
                     <Alert severity="success" onClose={() => {
                         setErrorAlertVisibility(false);
                     }}>
                         {errorMessage}
                     </Alert>
                 </Fade>

                <Typography>Pick date to view previous pay periods:</Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        defaultValue={dayjs(payPeriodLookup)}
                        onChange={(newValue) => {
                            if (newValue) {
                                setPayPeriodLookup(newValue.toDate());
                            }
                        }}
                    />
                </LocalizationProvider>
            </Stack>
                    <TableContainer component={Paper}>
                        <Table
                            sx={{ minWidth: 700 }}
                            aria-label="spanning table"
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        align="center"
                                        sx={{
                                            fontSize: "1.5rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Pay Period for {currentUser?.name}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align="left" colSpan={3}>
                                        Pay Period Start:{" "}
                                        {currentPayPeriod?.startDate
                                            .toLocaleDateString() || "N/A"}
                                    </TableCell>
                                    <TableCell align="left">
                                        End: {currentPayPeriod?.endDate
                                            .toLocaleDateString() || "N/A"}
                                    </TableCell>
                                    <TableCell align="right">
                                        Total Pay
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell align="left">Clock In</TableCell>
                                    <TableCell align="left">
                                        Clock Out
                                    </TableCell>
                                    <TableCell align="right">
                                        Hours Worked
                                    </TableCell>
                                    <TableCell align="right">Earned</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {timeEntryRows.length > 0
                                    ? (
                                        <>
                                            {timeEntryRows.map((
                                                timeEntryRow,
                                                index,
                                            ) => (
                                                <TableRow
                                                    key={`${timeEntryRow.workedDate.toISOString()}-${index}`}
                                                >
                                                    <TableCell>
                                                        {timeEntryRow.workedDate
                                                            ?.toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell align="left">
                                                        {timeEntryRow
                                                            .clockInTime
                                                            ?.toLocaleTimeString()}
                                                    </TableCell>
                                                    <TableCell align="left">
                                                        {timeEntryRow
                                                            .clockOutTime
                                                            ?.toLocaleTimeString()}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {ccyFormat(
                                                            timeEntryRow
                                                                .hoursWorked,
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {ccyFormat(
                                                            timeEntryRow.earned,
                                                        )}
                                                    </TableCell>
                                                    <TableCell width="15rem">
                                                        <Box
                                                            display="flex"
                                                            alignItems="center"
                                                            flexDirection="row"
                                                        >
                                                            <EditTimeEntryRowModalButton
                                                                timeEntryRow={timeEntryRow}
                                                                handleShowSuccessAlert={handleShowSuccessAlert}
                                                                handleShowErrorAlert={handleShowErrorAlert}
                                                                setLoading={setLoading}
                                                            />
                                                            <DeleteRowModalButton
                                                                timeEntryRow={timeEntryRow}
                                                                handleShowSuccessAlert={handleShowSuccessAlert}
                                                                handleShowErrorAlert={handleShowErrorAlert}
                                                                setLoading={setLoading}
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell rowSpan={3} />
                                                <TableCell colSpan={3}>
                                                    Subtotal
                                                </TableCell>
                                                <TableCell align="right">
                                                    {ccyFormat(payStubGrossPay)}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell colSpan={2}>
                                                    Tax
                                                </TableCell>
                                                <TableCell align="right">
                                                    {`${
                                                        (TAX_RATE * 100)
                                                            .toFixed(0)
                                                    } %`}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {ccyFormat(payStubTaxes)}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell colSpan={3}>
                                                    Total
                                                </TableCell>
                                                <TableCell align="right">
                                                    {ccyFormat(payStubNetPay)}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    )
                                    : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                align="center"
                                            >
                                                No time entries found for this
                                                pay period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                            </TableBody>
                        </Table>
                    </TableContainer>
             </Box>
                )}
        </Box>
    );
};

export default PayPeriodTable;

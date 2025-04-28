import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { ProjectUser, TimeEntry } from "@/app/types/project-types.ts";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import dayjs, { Dayjs } from "dayjs";
import { Stack } from "@mui/material";
import { getAnyNullTimeEntryClockedInWithUserId } from "@/app/lib/data-access-layer.ts";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    overFlowY: "auto",
    maxHeight: "90vh",
};

type TimePunchModalProps = {
    currentUser?: ProjectUser | null;
    onPunchSuccess?: () => void;
};

const TimePunchModal = (
    { currentUser, onPunchSuccess }: TimePunchModalProps,
) => {
    const [open, setOpen] = useState(false);
    const [selectedTime, setSelectedTime] = useState<Dayjs | null>(dayjs());
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [timeEntry, setTimeEntry] = useState<TimeEntry | null>(null);
    const [clockedIn, setClockedIn] = useState<boolean>(false);
    const [lastTimeEntry, setLastTimeEntry] = useState<TimeEntry | null>(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const CLOCK_IN = "Clock In";
    const CLOCK_OUT = "Clock Out";

    const showClockInStatus = clockedIn ? CLOCK_OUT : CLOCK_IN;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedTime || !currentUser?.userId) {
            setErrorMessage("Something went wrong. Please try again.");
            return;
        }

        if (
            clockedIn && lastTimeEntry &&
            selectedTime.isBefore(dayjs(lastTimeEntry.clockInTime))
        ) {
            setErrorMessage("Clock out time cannot be before clock in time.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch("/api/time-punch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: currentUser.userId,
                    timestamp: selectedTime.toISOString(),
                    type: clockedIn ? "out" : "in",
                }),
            });

            if (response.ok) {
                setClockedIn(!clockedIn);
                const data = await response.json();
                setTimeEntry(data.timeEntry);
                setSubmitting(false);
                if (onPunchSuccess) {
                    onPunchSuccess();
                }
                handleClose();
            } else {
                console.error("Time punch failed");
                setErrorMessage(
                    "Failed to submit time punch. Please try again.",
                );
                setSubmitting(false);
            }
        } catch (error) {
            console.error("Error submitting time punch:", error);
            setErrorMessage(
                "An error occurred while submitting the time punch.",
            );
            setSubmitting(false);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchTimeEntry = async () => {
            if (currentUser?.userId) {
                try {
                    const timeEntryData =
                        await getAnyNullTimeEntryClockedInWithUserId(
                            currentUser.userId,
                        );

                    if (timeEntryData === null) {
                        console.log(
                            "No previous time entry found for this user.",
                        );
                    } else {
                        setClockedIn(!timeEntryData.clockOutTime);
                        if (timeEntryData.payPeriodId === null) {
                            console.warn(
                                "Fetched time entry has a null payPeriodId:",
                                timeEntryData,
                            );
                        } else {
                            setLastTimeEntry(timeEntryData as TimeEntry);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching time entry:", error);
                    setErrorMessage(
                        "An error occurred while fetching the time entry.",
                    );
                    setClockedIn(false);
                    setLastTimeEntry(null);
                }
            }
        };

        fetchTimeEntry();
    }, [currentUser]);
    return (
        <div>
            <Button
                onClick={handleOpen}
                variant="contained"
                color={clockedIn ? "secondary" : "primary"}
                sx={{ mt: 3, mb: 2, width: "100%", maxWidth: "300px" }}
            >
                {showClockInStatus}
            </Button>

            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="time-punch-modal"
                aria-describedby="time-punch-modal"
            >
                <Box sx={style}>
                    <Typography>
                        Clocked in at: {timeEntry?.clockInTime
                            ? dayjs(timeEntry.clockInTime).format("HH:mm:ss")
                            : "N/A"}
                    </Typography>
                    <Typography>
                        Clocked out at: {timeEntry?.clockOutTime
                            ? dayjs(timeEntry.clockOutTime).format("HH:mm:ss")
                            : "N/A"}
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <Typography
                                id="time-punch-modal"
                                variant="h6"
                                component="h2"
                            >
                                Input Time to {showClockInStatus}
                            </Typography>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                    label={`Select time to ${showClockInStatus.toLowerCase()}`}
                                    value={selectedTime}
                                    onChange={(newValue) =>
                                        setSelectedTime(newValue)}
                                    viewRenderers={{
                                        hours: renderTimeViewClock,
                                        minutes: renderTimeViewClock,
                                    }}
                                />
                            </LocalizationProvider>

                            {errorMessage && (
                                <Typography color="error">
                                    {errorMessage}
                                </Typography>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!selectedTime || submitting}
                            >
                                {submitting
                                    ? "Submitting..."
                                    : showClockInStatus}
                            </Button>
                        </Stack>
                    </form>
                </Box>
            </Modal>
        </div>
    );
};

export default TimePunchModal;

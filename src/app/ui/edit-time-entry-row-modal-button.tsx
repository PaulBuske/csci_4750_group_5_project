import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import CheckIcon from "@mui/icons-material/Check";
import Cancel from "@mui/icons-material/Cancel";
import { TimeEntryRow } from "@/app/types/project-types.ts";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { useEffect } from "react";
import dayjs from "dayjs";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";

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
};

type EditTimeEntryRowModalButtonProps = {
    timeEntryRow?: TimeEntryRow;
    setLoading?: (value: ((prevState: boolean) => boolean) | boolean) => void;
};

const EditTimeEntryRowModalButton = (
    { timeEntryRow, setLoading }: EditTimeEntryRowModalButtonProps,
) => {
    const [open, setOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [clockInTime, setClockInTime] = React.useState<dayjs.Dayjs | null>(
        null,
    );
    const [clockOutTime, setClockOutTime] = React.useState<dayjs.Dayjs | null>(
        null,
    );

    useEffect(() => {
        if (timeEntryRow?.clockInTime) {
            setClockInTime(dayjs(timeEntryRow.clockInTime));
        }
        if (timeEntryRow?.clockOutTime) {
            setClockOutTime(dayjs(timeEntryRow.clockOutTime));
        }
    }, [timeEntryRow]);

    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
        setLoading!(true);
    };

    async function editRowData(timeEntryRow: TimeEntryRow) {
        const apiUrl = `/api/time-entry/delete-time-entry`;

        try {
            const response = await fetch(apiUrl, {
                method: "UPDATE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    timeEntryId: timeEntryRow.timeEntryId,
                    clockInTime: clockInTime?.toISOString(),
                    clockOutTime: clockOutTime?.toISOString(),
                }),
            });

            if (response.ok) {
                console.log("Time entry edited successfully.");
                handleClose();
                setLoading!(true);
                setError(null);
            } else {
                const errorData = await response.json();
                console.error(
                    "Failed to edit time entry:",
                    response.status,
                    errorData.message,
                );
                setError("Failed to edit time entry. Please try again.");
            }
        } catch (error) {
            console.error("Error calling edit API:", error);
            setError("An error occurred while editing the time entry.");
        }
    }

    return (
        <div>
            <Button
                color={"secondary"}
                onClick={handleOpen}
                variant="contained"
                size="small"
            >
                Edit
            </Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography
                        id="modal-modal-title"
                        variant="h6"
                        component="h2"
                    >
                        Edit time entry:
                    </Typography>
                    <Typography>
                        Clock in date: {timeEntryRow?.clockInTime
                            ? timeEntryRow.clockInTime.toLocaleDateString()
                            : "N/A"}
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker
                            label="Clock In Timer"
                            sx={{margin: "1rem"}}
                            value={clockInTime || dayjs()}
                            onChange={(newClockInTime) =>
                                setClockInTime(newClockInTime)}
                        />
                        {timeEntryRow?.clockOutTime && (
                        <TimePicker
                            label="Clock Out Timer"
                            sx={{margin: "1rem"}}
                            value={clockOutTime || dayjs()}
                            onChange={(newClockOutTime) => {
                                if (
                                    newClockOutTime && clockInTime &&
                                    newClockOutTime.isBefore(clockInTime)
                                ) {
                                    setError(
                                        "Clock out time cannot be before clock in time.",
                                    );
                                    return;
                                }
                                setClockOutTime(newClockOutTime);
                            }}
                        />
                        )}
                    </LocalizationProvider>
                    {error && (
                        <Typography color="error">
                            {error}
                        </Typography>
                    )}
                    <Box
                        display="flex"
                        flexDirection="row"
                        justifyContent="space-around"
                        marginTop="2rem"
                        marginBottom="1rem"
                    >
                        <Button
                            color="warning"
                            onClick={() => {
                                editRowData(timeEntryRow!).then();
                            }}
                            variant="contained"
                        >
                            <CheckIcon />
                        </Button>
                        <Button
                            onClick={handleClose}
                            variant="contained"
                        >
                            <Cancel />
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
};

export default EditTimeEntryRowModalButton;

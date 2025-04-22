import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import {ProjectUser, TimeEntry} from "@/app/types/project-types.ts";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs, { Dayjs } from 'dayjs';
import { Stack } from '@mui/material';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    overFlowY: 'auto',
    maxHeight: '90vh',
};

type TimePunchModalProps = {
    currentUser?: ProjectUser | null
}

const TimePunchModal = ({ currentUser }: TimePunchModalProps) => {
    const [open, setOpen] = React.useState(false);
    const [clockedIn, setClockedIn] = React.useState(false);
    const [selectedTime, setSelectedTime] = React.useState<Dayjs | null>(dayjs());
    const [submitting, setSubmitting] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [timeEntry, setTimeEntry] = React.useState<TimeEntry | null>(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const CLOCK_IN = 'Clock In';
    const CLOCK_OUT = 'Clock Out';

    const showClockInStatus = clockedIn ? CLOCK_OUT : CLOCK_IN;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedTime || !currentUser?.userId) {
            setErrorMessage('Something went wrong. Please try again.');
            return
        };

        if(clockedIn && timeEntry && selectedTime.isBefore(dayjs(timeEntry.clockInTime))){
            setErrorMessage('Clock out time cannot be before clock in time.');
            return;
        }

            setSubmitting(true)
            try {
                const response = await fetch('/api/time-punch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: currentUser.userId,
                        timestamp: selectedTime.toISOString(),
                        type: clockedIn ? 'out' : 'in'
                    }),
                });

                if (response.ok) {
                    setClockedIn(!clockedIn);
                    const data = await response.json();
                    setTimeEntry(data.timeEntry);
                    setSubmitting(false)
                    handleClose();
                } else {
                    console.error('Time punch failed');
                    setErrorMessage('Failed to submit time punch. Please try again.');
                    setSubmitting(false)
                }
            } catch (error) {
                console.error('Error submitting time punch:', error);
                setErrorMessage('An error occurred while submitting the time punch.');
                setSubmitting(false)
            } finally {
                setSubmitting(false);
            }
    };

    return (
        <div>
            <Button
                onClick={handleOpen}
                variant="contained"
                color={clockedIn ? "secondary" : "primary"}
                sx={{ mt: 2 }}
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

                    <Typography>Clocked in at: {timeEntry?.clockInTime ?  dayjs(timeEntry.clockInTime).format('HH:mm:ss') : 'N/A'}</Typography>
                    <Typography>Clocked out at: {timeEntry?.clockOutTime ?  dayjs(timeEntry.clockOutTime).format('HH:mm:ss') : 'N/A'}</Typography>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <Typography id="time-punch-modal" variant="h6" component="h2">
                                Input Time to {showClockInStatus}
                            </Typography>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                    label={`Select time to ${showClockInStatus.toLowerCase()}`}
                                    value={selectedTime}
                                    onChange={(newValue) => setSelectedTime(newValue)}
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
                                {submitting ? 'Submitting...' : showClockInStatus}
                            </Button>
                        </Stack>
                    </form>
                </Box>
            </Modal>
        </div>
    );
};

export default TimePunchModal;
import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import CheckIcon from "@mui/icons-material/Check";
import Cancel from "@mui/icons-material/Cancel";
import {TimeEntryRow} from "@/app/types/project-types.ts";

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

type DeleteTimeEntryModalProps = {
    timeEntryRow?: TimeEntryRow;
    setLoading?: (value: ((prevState: boolean) => boolean) | boolean) => void;
    handleShowSuccessAlert?: (message: string) => void;
    handleShowErrorAlert?: (message: string) => void;
}

const DeleteTimeEntryModal = (
    { timeEntryRow, setLoading, handleShowSuccessAlert, handleShowErrorAlert }: DeleteTimeEntryModalProps,
) => {
    const [open, setOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
        setLoading!(true);
    };

    async function deleteRowData(timeEntryRow: TimeEntryRow) {
        const apiUrl =
            `/api/time-entry/delete-time-entry?userId=${timeEntryRow.userId}&timeEntryId=${timeEntryRow.timeEntryId}`;

        try {
            const response = await fetch(apiUrl, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                console.log("Time entry deleted successfully.");
                handleShowSuccessAlert?.("Time entry deleted successfully.");
                handleClose();
                setLoading!(true);
                setError(null);
            } else {
                const errorData = await response.json();
                console.error(
                    "Failed to delete time entry:",
                    response.status,
                    errorData.message,
                );
                setError(errorData.message || "Failed to delete time entry.");
                setError("Failed to delete time entry. Please try again.");
            }
        } catch (error) {
            console.error("Error calling delete API:", error);
            handleShowErrorAlert("An error occurred while deleting the time entry.");
            setError("An error occurred while deleting the time entry.");
        }
    }

    return (
        <div>
            <Button
                color={"error"}
                onClick={handleOpen}
                variant="contained"
                size="small"
            >
                DELETE
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
                        Delete time entry:
                    </Typography>
                    <Typography>
                        Clock in date: {timeEntryRow?.clockInTime
                            ? timeEntryRow.clockInTime.toLocaleDateString()
                            : "N/A"}
                    </Typography>
                    <Typography>
                        Clock in time: {timeEntryRow?.clockInTime
                            ? timeEntryRow.clockInTime.toLocaleTimeString()
                            : "N/A"}
                    </Typography>
                    <Typography>
                        Clock out time: {timeEntryRow?.clockOutTime
                            ? timeEntryRow.clockOutTime.toLocaleTimeString()
                            : "N/A"}
                    </Typography>
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
                                deleteRowData(timeEntryRow!).then();
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

export default DeleteTimeEntryModal;

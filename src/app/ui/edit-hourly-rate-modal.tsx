import React, {useState} from "react";
import {Alert, Box, Button, Modal, TextField, Typography,} from "@mui/material";

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
    overflowY: "auto",
    maxHeight: "90vh",
};
type EditHourlyRateProps = {
    open: boolean;
    onClose: () => void;
    selectedUserId: string;
    onEditHourlyRate: (userId: string, hourlyRate: number) => Promise<void>;
};

const EditHourlyRateModal = (
    { open, onClose, selectedUserId, onEditHourlyRate }: EditHourlyRateProps,
) => {

    const [hourlyRateInput, setHourlyRateInput] = useState<string>("");
    const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        setModalErrorMessage(null);
        const rate = parseFloat(hourlyRateInput);


        if (isNaN(rate)) {
            setModalErrorMessage("Please enter a valid number for the hourly rate.");
            return;
        }
        if (rate < 0) {
            setModalErrorMessage("Hourly rate must be positive.");
            return;
        }

        try {

            await onEditHourlyRate(selectedUserId, rate);
            setModalErrorMessage(null);
            handleClose();
        } catch (error: unknown) {
            console.error("Failed to edit hourly rate:", error);

            const message = error instanceof Error ? error.message : "Failed to edit hourly rate";
            setModalErrorMessage(message);
        }
    };

    const handleClose = () => {
        setHourlyRateInput("");
        setModalErrorMessage(null);
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">
                    Edit User Hourly Rate
                </Typography>
                <TextField
                    fullWidth
                    required
                    label="Hourly Rate"
                    margin="normal"
                    type="number"
                    value={hourlyRateInput}
                    onChange={(e) => setHourlyRateInput(e.target.value)}
                />
                {modalErrorMessage && (
                    <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
                        {modalErrorMessage}
                    </Alert>
                )}
                <Box
                    sx={{
                        mt: 2,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                    >
                        Edit Hourly Rate
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default EditHourlyRateModal;

import React, { useState } from "react";
import { Box, Button, Modal, TextField, Typography } from "@mui/material";

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

type ResetPasswordModalProps = {
    open: boolean;
    userIdToReset: string;
    onClose: () => void;
    handleShowSuccessAlert: (message: string) => void;
    handleShowErrorAlert: (message: string) => void;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const ResetPasswordModal = ({
    open,
    userIdToReset,
    onClose,
    handleShowSuccessAlert,
    handleShowErrorAlert,
    setLoading,
}: ResetPasswordModalProps) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordErrorState, setPasswordErrorState] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const validatePassword = () => {
        if (password.length < 12) {
            setPasswordErrorState(true);
            setPasswordError("Password must be at least 12 characters long");
            return false;
        }

        if (!/[A-Z]/.test(password)) {
            setPasswordErrorState(true);
            setPasswordError(
                "Password must contain at least one uppercase letter",
            );
            return false;
        }

        if (!/[a-z]/.test(password)) {
            setPasswordErrorState(true);
            setPasswordError(
                "Password must contain at least one lowercase letter",
            );
            return false;
        }

        if (!/\d/.test(password)) {
            setPasswordErrorState(true);
            setPasswordError("Password must contain at least one number");
            return false;
        }

        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            setPasswordErrorState(true);
            setPasswordError(
                "Password must contain at least one special character",
            );
            return false;
        }

        if (password !== confirmPassword) {
            setPasswordErrorState(true);
            setPasswordError("Passwords do not match");
            return false;
        }
        setPasswordErrorState(false);
        setPasswordError("");
        return true;
    };

    const handleSubmit = async () => {
        if (!validatePassword()) {
            return;
        }

        if (userIdToReset.length === 0) {
            handleShowErrorAlert("No user selected");
            return;
        }

        if (setLoading) {
            setLoading(true);
        }

        try {
            const response = await fetch("/api/users/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userIdToReset, password }),
            });

            if (!response.ok) {
                handleShowErrorAlert(
                    `Failed to reset password: ${response.statusText}`,
                );
                throw new Error(`Failed to reset password: ${response.status}`);
            }
            handleShowSuccessAlert(`Password reset successfully.`);
            onClose();
        } catch (error) {
            console.error("Error resetting passwords:", error);
            if (error instanceof Error) {
                handleShowErrorAlert(error.message);
            } else {
                handleShowErrorAlert("Failed to reset passwords");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">
                    Reset Password for {userIdToReset.length} User
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    placeholder="Enter new password"
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={passwordErrorState}
                    helperText={passwordErrorState && password !== ""
                        ? passwordError
                        : "Password must be at least 12 characters with uppercase, lowercase, numbers, and symbols"}
                />
                <TextField
                    fullWidth
                    type="password"
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    margin="normal"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={passwordErrorState && password === confirmPassword}
                />
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
                        Reset Password
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ResetPasswordModal;

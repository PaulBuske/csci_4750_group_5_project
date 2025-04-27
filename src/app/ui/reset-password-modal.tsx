import React, {useState} from 'react';
import {Box, Button, Modal, TextField, Typography} from '@mui/material';

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
    overflowY: 'auto',
    maxHeight: '90vh',
};

interface ResetPasswordModalProps {
    open: boolean;
    userIds: string[];
    onClose: () => void;
    setErrorState: React.Dispatch<React.SetStateAction<boolean>>;
    setErrorMessage?: (value: (((prevState: string) => string) | string)) => void;
    setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResetPasswordModal = ({
                                open,
                                userIds,
                                onClose,
                                setErrorState,
                                setErrorMessage,
                                setLoading
                            }: ResetPasswordModalProps) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validatePassword = () => {
        // Password must be at least 12 characters long
        if (password.length < 12) {
            setPasswordError('Password must be at least 12 characters long');
            return false;
        }

        // Password must contain at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            setPasswordError('Password must contain at least one uppercase letter');
            return false;
        }

        // Password must contain at least one lowercase letter
        if (!/[a-z]/.test(password)) {
            setPasswordError('Password must contain at least one lowercase letter');
            return false;
        }

        // Password must contain at least one number
        if (!/\d/.test(password)) {
            setPasswordError('Password must contain at least one number');
            return false;
        }

        // Password must contain at least one special character
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            setPasswordError('Password must contain at least one special character');
            return false;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return false;
        }

        setPasswordError('');
        return true;
    };

    const handleSubmit = async () => {
        if (!validatePassword()) {
            return;
        }

        if (userIds.length === 0) {
            setErrorState(true);
            if (setErrorMessage) {
                setErrorMessage("No users selected");
            }
            return;
        }

        if (setLoading) {
            setLoading(true);
        }

        try {
            const response = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIds, password }),
            });

            if (!response.ok) {
                throw new Error(`Failed to reset password: ${response.status}`);
            }

            const data = await response.json();
            if (setErrorMessage) {
                setErrorMessage(data.message || "Password reset successfully");
            }

            onClose();
        } catch (error) {
            console.error("Error resetting passwords:", error);
            setErrorState(true);
            if (setErrorMessage) {
                setErrorMessage(error instanceof Error ? error.message : "Failed to reset passwords");
            }
        } finally {
            if (setLoading) {
                setLoading(false);
            }
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">
                    Reset Password for {userIds.length} User{userIds.length !== 1 ? 's' : ''}
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    placeholder="Enter new password"
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!passwordError && password !== ''}
                    helperText={passwordError && password !== '' ? passwordError :
                        "Password must be at least 12 characters with uppercase, lowercase, numbers, and symbols"}
                />
                <TextField
                    fullWidth
                    type="password"
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    margin="normal"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!passwordError && password === confirmPassword}
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                        Reset Password
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ResetPasswordModal;
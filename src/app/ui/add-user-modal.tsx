import React, { useState } from "react";
import {
    Alert,
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Modal,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { UserRole } from "@prisma/client";

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

type AddUserModalProps = {
    open: boolean;
    onClose: () => void;
    setErrorState: React.Dispatch<React.SetStateAction<boolean>>;
    setErrorMessage?: (value: ((prevState: string) => string) | string) => void;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const AddUserModal = (
    { open, onClose, setErrorState, setErrorMessage, setLoading }:
        AddUserModalProps,
) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);
    const [modalErrorMessage, setModalErrorMessage] = useState("");

    const handleSubmit = async () => {
        setErrorState(false);
        if (setErrorMessage) {
            setErrorMessage("");
        }
        setModalErrorMessage("");

        if (!name || !email || !password) {
            setModalErrorMessage("Please fill out all required fields");
            return;
        }

        if (email.includes(" ")) {
            setModalErrorMessage("Email cannot contain spaces");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            setModalErrorMessage("Please enter a valid email address");
            return;
        }

        try {
            const response = await fetch("/api/users/add-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password, role }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: `HTTP error ${response.status}`,
                }));
                setErrorState(true);
                if (setErrorMessage) {
                    setErrorMessage(
                        `Failed to add user: ${
                            errorData.message || response.statusText
                        }`,
                    );
                }
                return;
            }

            if (setLoading) {
                setLoading(true);
            }
            onClose();
        } catch (error) {
            console.error("Error submitting new user:", error);
            setErrorState(true);
            if (setErrorMessage) {
                setErrorMessage(
                    "An unexpected error occurred while adding the user.",
                );
            }
        }
    };

    const handleClose = () => {
        setName("");
        setEmail("");
        setPassword("");
        setRole(UserRole.EMPLOYEE);
        setErrorState(false);
        if (setErrorMessage) {
            setErrorMessage("");
        }
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">
                    Add User
                </Typography>
                <TextField
                    fullWidth
                    required
                    label="Name"
                    placeholder="Enter user name"
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <TextField
                    fullWidth
                    required
                    label="Email"
                    placeholder="Enter user email"
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                />
                <TextField
                    fullWidth
                    required
                    type="password"
                    label="Password"
                    placeholder="Enter user password"
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel id="role-select-label">Role</InputLabel>
                    <Select
                        labelId="role-select-label"
                        id="role-select"
                        value={role}
                        label="Role"
                        onChange={(e) => setRole(e.target.value as UserRole)}
                    >
                        <MenuItem value={UserRole.EMPLOYEE}>EMPLOYEE</MenuItem>
                        <MenuItem value={UserRole.MANAGER}>MANAGER</MenuItem>
                        <MenuItem value={UserRole.ADMIN}>ADMIN</MenuItem>
                    </Select>
                </FormControl>
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
                        Add User
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

export default AddUserModal;

import React, {useState} from 'react';
import {Box, Button, FormControl, InputLabel, MenuItem, Modal, Select, TextField, Typography} from '@mui/material';
import {UserRole} from '@prisma/client';

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

interface AddUserModalProps {
    open: boolean,
    onClose: () => void,
    setErrorState: React.Dispatch<React.SetStateAction<boolean>>,
    setErrorMessage?: (value: (((prevState: string) => string) | string)) => void
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
}

const AddUserModal = ({open, onClose, setErrorState, setErrorMessage, setLoading}: AddUserModalProps) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);

    const handleSubmit = async () => {
        if (!name || !email || !password) {
            setErrorState(true);
            if (setErrorMessage) {
                setErrorMessage("Please fill out all required fields");
            }
            return;
        }

        const response = await fetch('/api/users/add-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({name, email, password, role}),
        });

        if (!response.ok) {
            setErrorState(true);
            if (setErrorMessage) {
                setErrorMessage(`Failed to add user: ${response.status}`);
            }
            return;
        }

        if (setLoading) {
            setLoading(true);
        }
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">
                    Add User
                </Typography>
                <TextField
                    fullWidth
                    label="Name"
                    placeholder="Enter user name"
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <TextField
                    fullWidth
                    label="Email"
                    placeholder="Enter user email"
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    fullWidth
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
                <Box sx={{mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                        Add User
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddUserModal;
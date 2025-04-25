'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Avatar, Box, Button, CircularProgress, Container, Paper, TextField, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import UserManualButton from "@/app/ui/user-manual-button.tsx";

export default function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to login');
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            console.error('Login failed:', error);
            setError(error instanceof Error ? error.message : 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    }
    return (
        // Using 'xs' maxWidth to constrain overall form width
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                sx={{
                    marginTop: 8,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Log In
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{ mt: 1, width: '100%' }}
                >
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    {/* Buttons container - centers the buttons */}
                    <Box
                        display='flex'
                        flexDirection='column'
                        alignItems='center' // Center items horizontally
                        justifyContent='center'
                        sx={{ width: '100%', mt: 1 }}
                    >
                        <Button
                            type="submit"
                            variant="contained"
                            // Removed fullWidth
                            sx={{ mt: 3, mb: 2, width: '100%', maxWidth: '300px' }} // Add maxWidth
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Log In'}
                        </Button>
                        {/* UserManualButton uses its own defined style */}
                        <UserManualButton loading={loading} />
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}
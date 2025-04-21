import {Box, Button, Typography} from '@mui/material';
import React from "react";
import NextLink from "next/link";

export default function Home() {

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
            }}
        >
            <Typography variant="h2" component="h1" gutterBottom>
                CSCI 4750 Group 5 Project
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom>
                Spring 2025
            </Typography>

            <Box sx={{ mt: 4 }}>
                <Button
                    variant="contained"
                    color="primary"
                    component={NextLink}
                    href="/public/login"
                    sx={{ mx: 1 }}
                >
                    Login
                </Button>
{/*                <Button
                    variant="outlined"
                    color="primary"
                    component={Link}
                    href="/signup"
                    sx={{ mx: 1 }}
                >
                    Sign Up
                </Button>*/}
            </Box>
        </Box>
    );
}
'use client';

import * as React from 'react';
import {useEffect, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import {formatDate} from "@/app/helper-functions.ts";
import type {ProjectUser} from "../types/project-types.ts";

// Fields to exclude from the table display
const EXCLUDED_FIELDS = ['password', 'resetToken'];

// Custom display names for fields
const FIELD_LABELS: Record<string, string> = {
    userId: 'User ID',
    email: 'Email',
    name: 'Name',
    hourlyRate: 'Hourly Rate',
    role: 'Role',
    createdAt: 'Created',
    updatedAt: 'Updated',
};

const UserTable = () => {
    const [currentUsers, setCurrentUsers] = useState<ProjectUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorState, setErrorState] = useState<boolean>(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users');
                if (!response.ok) {
                    console.error(`Failed to fetch users: ${response.status}`);
                }
                const data = await response.json();
                setCurrentUsers(data.users);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error('Error fetching users:', error.message);
                } else {
                    console.error('Unexpected error fetching users:', error);
                }
                setErrorState(true);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers().then();
    }, []);

    // Only render content when on client-side to prevent hydration mismatch
    if (!isClient) {
        return null; // Return null on first render to avoid hydration mismatch
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (errorState) {
        return (
            <Box sx={{ color: 'error.main', p: 2, textAlign: 'center' }}>
                <Typography variant="h6">Error loading users</Typography>
                <Typography variant="body2">Please try again later</Typography>
            </Box>
        );
    }

    // Only proceed if currentUsers exists and is an array
    if (!currentUsers || currentUsers.length === 0) {
        return (
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="users table">
                    <TableHead>
                        <TableRow>
                            <TableCell>User Data</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell align="center">No users found</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    // Get the keys from the first user, excluding sensitive fields
    const headerKeys = Object.keys(currentUsers[0])
        .filter(key => !EXCLUDED_FIELDS.includes(key));

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="users table">
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                        {headerKeys.map((key) => (
                            <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                                {FIELD_LABELS[key] || key}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {currentUsers.map((user) => (
                        <TableRow
                            key={user.userId}
                            sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                        >
                            {headerKeys.map((key) => (
                                <TableCell key={`${user.userId}-${key}`}>
                                    {renderCellContent(user, key)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// Helper function to render cell content appropriately based on field type
function renderCellContent(user: ProjectUser, key: string): React.ReactNode {
    const value = (user as Record<string, unknown>)[key];

    if (value === null || value === undefined) {
        return 'N/A';
    }

    if (key === 'createdAt' || key === 'updatedAt') {
        return formatDate(value.toString());
    }

    if (key === 'hourlyRate') {
        return `$${Number(value).toFixed(2)}`;
    }

    return value.toString();
}

export default UserTable;
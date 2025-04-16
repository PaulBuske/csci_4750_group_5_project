'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import {formatDate} from "@/app/HelperFunctions.ts";
import type { User } from "@/app/types/User.ts";

const UserTable = () => {
    const [currentUsers, setCurrentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorState, setErrorState] = useState<boolean>(false);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            setCurrentUsers(data.users);
            setLoading(false);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error fetching users:', error.message);
                setErrorState(true);
            } else {
                console.error('Unexpected error fetching users:', error);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers().then();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (errorState) {
        return <Box sx={{ color: 'error.main', p: 2 }}>Error, something went wrong.</Box>;
    }

    // Only proceed if currentUsers exists and is an array
    if (!currentUsers || currentUsers.length === 0) {
        return (
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="users table">
                    <TableHead>
                        <TableRow>
                            <TableCell>No Data</TableCell>
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

    // Get the keys from the first user for table headers
    const headerKeys = Object.keys(currentUsers[0]);

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="users table">
                <TableHead>
                    <TableRow>
                        {headerKeys.map((key) => (
                            <TableCell key={key}>{key}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {currentUsers[0].id && currentUsers.map((currentUser) => (
                        <TableRow key={currentUser.id}>
                            {headerKeys.map((key) => (
                                <TableCell key={`${currentUser.id}-${key}`}>
                                    {key === 'createdAt' || key === 'updatedAt'
                                        ? formatDate((currentUser as Record<string, unknown>)[key]?.toString() || '')
                                        : (currentUser as Record<string, unknown>)[key]?.toString() || 'N/A'}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default UserTable;
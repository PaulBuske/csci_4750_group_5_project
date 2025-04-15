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

const UserTable = () => {
    const [currentUsers, setCurrentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            setCurrentUsers(data.users);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.message);
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

    if (error) {
        return <Box sx={{ color: 'error.main', p: 2 }}>{error}</Box>;
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
                    {currentUsers.map((user) => (
                        <TableRow key={user.id}>
                            {headerKeys.map((key) => (
                                <TableCell key={`${user.id}-${key}`}>
                                    {key === 'createdAt' || key === 'updatedAt'
                                        ? formatDate(user[key])
                                        : user[key] || 'N/A'}
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
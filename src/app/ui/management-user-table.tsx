"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type { ProjectUser } from "../types/project-types.ts";
// Correct the import here
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { formatDate } from "@/app/helper-functions.ts"; // Assuming you have this helper
import { Button } from "@mui/material";

// Fields to exclude from the table
const EXCLUDED_FIELDS = [
    "password",
    "resetToken",
    "resetTokenExpiresAt",
    "role",
    "createdAt",
    "updatedAt"
];

const FIELD_LABELS: Record<string, string> = {
    userId: "User ID",
    email: "Email",
    name: "Name",
    role: "Role",
    createdAt: "Created",
    updatedAt: "Updated",
};

// Function to generate columns dynamically
const generateColumns = (user: ProjectUser): GridColDef[] => {
    // Filter out excluded fields AND empty string keys
    const validKeys = Object.keys(user)
        .filter((key) => key.trim() !== "" && !EXCLUDED_FIELDS.includes(key));

    return validKeys.map((key): GridColDef => {
        const columnDef: GridColDef = {
            field: key,
            headerName: FIELD_LABELS[key] ||
                key.charAt(0).toUpperCase() + key.slice(1), // Use label or capitalize key
            width: 150, // Default width, adjust as needed
            sortable: true,
        };

        // Customize specific columns
        if (key === "userId") {
            columnDef.width = 90;
        } else if (key === "email") {
            columnDef.width = 200;
        } else if (key === "role") {
            columnDef.width = 100;
        } else if (key === "createdAt" || key === "updatedAt") {
            columnDef.width = 180;
            // Use GridValueGetter type
            columnDef.valueGetter = (value: unknown) =>
                value ? formatDate(value.toString()) : "N/A";
        }

        return columnDef;
    });
};

const ManagementUserTable = () => {
    const [currentUsers, setCurrentUsers] = useState<ProjectUser[]>([]);
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorState, setErrorState] = useState<boolean>(false);
    const [isClient, setIsClient] = useState(false);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: 10, // Default page size
        page: 0,
    });

    useEffect(() => {
        setIsClient(true);

        const fetchUsers = async () => {
            setLoading(true);
            setErrorState(false);
            try {
                const response = await fetch("/api/users");
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch users: ${response.status}`,
                    );
                }
                const data = await response.json();
                if (data.users && data.users.length > 0) {
                    const usersWithId = data.users.map((user: ProjectUser) => ({
                        ...user,
                    }));
                    setCurrentUsers(usersWithId);
                    setColumns(generateColumns(usersWithId[0]));
                } else {
                    setCurrentUsers([]);
                    setColumns([]);
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error("Error fetching users:", error.message);
                } else {
                    console.error("Unexpected error fetching users:", error);
                }
                setErrorState(true);
                setCurrentUsers([]);
                setColumns([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers().then();
    }, []);

    if (!isClient) {
        return null; // Don't render server-side
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (errorState) {
        return (
            <Paper sx={{ p: 2, textAlign: "center", color: "error.main" }}>
                <Typography variant="h6">Error loading users</Typography>
                <Typography variant="body2">Please try again later</Typography>
            </Paper>
        );
    }

    if (columns.length === 0 && currentUsers.length > 0) {
        // Still generating columns or first user had no valid keys
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!currentUsers || currentUsers.length === 0) {
        return (
            <Paper
                sx={{
                    height: 150,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography>No users found</Typography>
            </Paper>
        );
    }

    return (
        <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            width='100%'
        >
            <Paper
                sx={{
                    height: "auto",
                    width: "min-content",
                    maxWidth: "lg",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <DataGrid
                    rows={currentUsers}
                    columns={columns}
                    getRowId={(row) => row.userId} // Specify the unique ID field
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[5, 10, 20, 50]} // Options for page size dropdown
                    checkboxSelection
                    disableRowSelectionOnClick
                    sx={{ border: 0 }}
                />
            </Paper>
            <Box
                component={Paper}
                display='flex'
                flexDirection='column'
                justifyContent='space-around'
                alignItems='center'
                width='100%'
                maxWidth='lg'
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    User Management
                </Typography>
                <Button variant='contained'
                        sx={{height: '3rem', mb: 2}}
                >
                    Edit Hourly Rate
                </Button>
                <Button variant='contained'>
                    View User Pay Stubs
                </Button>
            </Box>
        </Box>
    );
};

export default ManagementUserTable;

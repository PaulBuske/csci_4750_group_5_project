"use client";

import * as React from "react";
import {useEffect, useState} from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type {ProjectUser} from "../types/project-types.ts";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {formatDate} from "@/app/helper-functions.ts";
import {Button} from "@mui/material";
import AddUserModal from "@/app/ui/add-user-modal.tsx";
import ResetPasswordModal from "@/app/ui/reset-password-modal.tsx";

interface AdminUserTableProps {
    currentUser: ProjectUser;
}

const handleDeleteUsers = async (userIds: string[]) => {
    try {
        const response = await fetch("/api/users/delete-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userIds }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete users: ${response.status}`);
        }

        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error("Error deleting users:", error);
    }
}

const EXCLUDED_FIELDS = ["password", "resetToken", "resetTokenExpiresAt", "hourlyRate"];

const FIELD_LABELS: Record<string, string> = {
    userId: "User ID",
    email: "Email",
    name: "Name",
    role: "Role",
    createdAt: "Created",
    updatedAt: "Updated",
};

const generateColumns = (user: ProjectUser): GridColDef[] => {
    const validKeys = Object.keys(user).filter(
        (key) => key.trim() !== "" && !EXCLUDED_FIELDS.includes(key)
    );

    return validKeys.map((key): GridColDef => {
        const columnDef: GridColDef = {
            field: key,
            headerName: FIELD_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
            width: 150,
            sortable: true,
        };

        if (key === "userId") {
            columnDef.width = 90;
        } else if (key === "email") {
            columnDef.width = 200;
        } else if (key === "role") {
            columnDef.width = 100;
        } else if (key === "createdAt" || key === "updatedAt") {
            columnDef.width = 180;
            columnDef.valueGetter = (value: unknown) =>
                value ? formatDate(value.toString()) : "N/A";
        }

        return columnDef;
    });
};

const AdminUserTable = ({ currentUser }: AdminUserTableProps) => {
    const [currentUsers, setCurrentUsers] = useState<ProjectUser[]>([]);
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorState, setErrorState] = useState<boolean>(false);
    const [isClient, setIsClient] = useState(false);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: 10,
        page: 0,
    });
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);

    const handleDeleteSelected = async () => {
        if (selectedUsers.length === 0) {
            setErrorState(true);
            setErrorMessage("No users selected");
            return;
        }

        setLoading(true);
        try {
            await handleDeleteUsers(selectedUsers);
            // Refresh the user list after deletion
            const response = await fetch("/api/users");
            const data = await response.json();
            if (data.users && data.users.length > 0) {
                setCurrentUsers(data.users.map((user: ProjectUser) => ({ ...user })));
            } else {
                setCurrentUsers([]);
            }
            setSelectedUsers([]);
        } catch (error) {
            setErrorState(true);
            setErrorMessage("Failed to delete users");
            console.error("Error deleting users:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        setIsClient(true);

        const fetchUsers = async () => {
            setErrorState(false);
            try {
                const response = await fetch("/api/users");
                if (!response.ok) {
                    throw new Error(`Failed to fetch users: ${response.status}`);
                }
                const data = await response.json();
                if (data.users && data.users.length > 0) {
                    const usersWithId = data.users.map((user: ProjectUser) => ({
                        ...user,
                    }));
                    setCurrentUsers(usersWithId);
                    if (columns.length === 0) {
                        setColumns(generateColumns(usersWithId[0]));
                    }
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
                setErrorMessage(
                    "An error occurred while fetching users. Please try again."
                );
                setCurrentUsers([]);
                setColumns([]);
            } finally {
                setLoading(false);
            }
        };

        if (loading) {
            fetchUsers();
        }
    }, [loading]);

    if (!isClient) {
        return null;
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
                <Typography variant="h6">{errorMessage}</Typography>
            </Paper>
        );
    }

    if (columns.length === 0 && currentUsers.length > 0) {
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
    const isCurrentUserSelected = Array.isArray(selectedUsers) &&
        selectedUsers.some(id => String(id) === String(currentUser.userId));


    const canResetPassword = selectedUsers.length === 1 && !isCurrentUserSelected;


    return (
        <Box display="flex" flexDirection="row" justifyContent="space-between" width="100%">
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
                    getRowId={(row) => row.userId}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[5, 10, 20, 50]}
                    checkboxSelection
                    disableRowSelectionOnClick
                    sx={{ border: 0 }}
                    onRowSelectionModelChange={(newSelection) => {
                        const selectionArray = Array.isArray(newSelection)
                            ? newSelection
                            : (newSelection ? [newSelection] : []);
                        setSelectedUsers(selectionArray as string[]);
                    }}
                />
            </Paper>
            <Box
                component={Paper}
                display="flex"
                flexDirection="column"
                justifyContent="space-around"
                alignItems="center"
                width="100%"
                maxWidth="lg"
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    fullWidth={true}
                    sx={{ height: "3rem", mb: 2 }}
                    onClick={() => setAddUserModalOpen(true)}
                >
                    Add New User
                </Button>
                <Button
                    variant="contained"
                    fullWidth={true}
                    sx={{ height: "3rem", mb: 2 }}
                    onClick={handleDeleteSelected}
                    disabled={selectedUsers.length === 0 || isCurrentUserSelected}
                >
                    Delete Selected Users ({selectedUsers.length})
                    {isCurrentUserSelected && " (Cannot delete yourself)"}
                </Button>
                <Button
                    variant="contained"
                    fullWidth={true}
                    sx={{ height: "3rem", mb: 2 }}
                    onClick={() => setResetPasswordModalOpen(true)}
                    disabled={!canResetPassword}
                >
                    Reset User Password
                    {selectedUsers.length > 1 && " (Select only one user)"}
                    {selectedUsers.length === 0 && " (Select a user)"}
                    {isCurrentUserSelected && " (Cannot reset your own password)"}
                </Button>
            </Box>
            {addUserModalOpen && (
                <AddUserModal
                    open={addUserModalOpen}
                    onClose={() => setAddUserModalOpen(false)}
                    setErrorState={setErrorState}
                    setErrorMessage={setErrorMessage}
                    setLoading={setLoading}
                />
            )}
            {resetPasswordModalOpen && (
                <ResetPasswordModal
                    open={resetPasswordModalOpen}
                    userIds={selectedUsers}
                    onClose={() => setResetPasswordModalOpen(false)}
                    setErrorState={setErrorState}
                    setErrorMessage={setErrorMessage}
                    setLoading={setLoading}
                />
            )}
        </Box>
    );
};

export default AdminUserTable;
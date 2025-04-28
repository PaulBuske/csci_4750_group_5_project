"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type { ProjectUser } from "../types/project-types.ts";
import {
    DataGrid,
    GridColDef,
    type GridRowId,
    GridRowSelectionModel,
} from "@mui/x-data-grid";
import { formatDate } from "@/app/helper-functions.ts";
import { Alert, Button } from "@mui/material";
import AddUserModal from "@/app/ui/add-user-modal.tsx";
import ResetPasswordModal from "@/app/ui/reset-password-modal.tsx";

interface AdminUserTableProps {
    currentUser: ProjectUser;
}

const handleDeleteUsers = async (userIds: string[]): Promise<boolean> => {
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
        return true;
    } catch (error) {
        console.error("Error deleting users:", error);
        return false;
    }
};

const EXCLUDED_FIELDS = [
    "password",
    "resetToken",
    "resetTokenExpiresAt",
    "hourlyRate",
];

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
        (key) => key.trim() !== "" && !EXCLUDED_FIELDS.includes(key),
    );

    return validKeys.map((key): GridColDef => {
        const columnDef: GridColDef = {
            field: key,
            headerName: FIELD_LABELS[key] ||
                key.charAt(0).toUpperCase() + key.slice(1),
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
    const [deleteUserButtonErrorMessage, setDeleteUserButtonErrorMessage] =
        useState("");
    const [resetPasswordWarning, setResetPasswordWarning] = useState("");

    const handleDeleteSelected = async () => {
        if (selectedUsers.length === 0) return;

        setLoading(true);
        setErrorState(false);
        setErrorMessage("");

        try {
            const success = await handleDeleteUsers(selectedUsers);
            if (success) {
                const response = await fetch("/api/users");
                const data = await response.json();
                if (data.users && data.users.length > 0) {
                    setCurrentUsers(
                        data.users.map((user: ProjectUser) => ({ ...user })),
                    );
                } else {
                    setCurrentUsers([]);
                }
                setSelectedUsers([]);
                setDeleteUserButtonErrorMessage("");
            } else {
                setErrorState(true);
                setErrorMessage("Failed to delete selected users.");
            }
        } catch (error) {
            setErrorState(true);
            setErrorMessage("An error occurred while deleting users.");
            console.error("Error deleting users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsClient(true);

        const fetchUsers = async () => {
            setErrorState(false);
            setErrorMessage("");
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
                    setErrorMessage(
                        `Error fetching users: ${error.message}. Please try again.`,
                    );
                } else {
                    console.error("Unexpected error fetching users:", error);
                    setErrorMessage(
                        "An unexpected error occurred while fetching users. Please try again.",
                    );
                }
                setErrorState(true);
                setCurrentUsers([]);
                setColumns([]);
            } finally {
                setLoading(false);
            }
        };

        if (loading) {
            fetchUsers();
        }
    }, [loading, columns.length, selectedUsers]);

    if (!isClient) {
        return null;
    }

    if (loading || (columns.length === 0 && currentUsers.length > 0)) {
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
                    flexDirection: "column",
                    p: 2,
                }}
            >
                <Typography sx={{ mb: 2 }}>No users found</Typography>
                <Button
                    variant="contained"
                    onClick={() => setAddUserModalOpen(true)}
                >
                    Add New User
                </Button>
                {addUserModalOpen && (
                    <AddUserModal
                        open={addUserModalOpen}
                        onClose={() => setAddUserModalOpen(false)}
                        setErrorState={setErrorState}
                        setErrorMessage={setErrorMessage}
                        setLoading={setLoading}
                    />
                )}
            </Paper>
        );
    }

    const isCurrentUserSelected = selectedUsers.includes(currentUser.userId);

    const canResetPassword = selectedUsers.length === 1 &&
        !isCurrentUserSelected;

    return (
        <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            width="100%"
            gap={2}
        >
            {errorState && (
                <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                    {errorMessage}
                </Alert>
            )}
            <Paper
                sx={{
                    height: "auto",
                    width: { xs: "100%", md: "70%" },
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
                    onRowSelectionModelChange={(
                        newSelectionModel: GridRowSelectionModel,
                    ) => {
                        const selectedRowIdsSet: Set<GridRowId> =
                            newSelectionModel.ids;
                        const selectedUserIds = Array.from(selectedRowIdsSet)
                            .map((id) => String(id));
                        setSelectedUsers(selectedUserIds);

                        if (
                            selectedUserIds.includes(String(currentUser.userId))
                        ) {
                            setDeleteUserButtonErrorMessage(
                                "Cannot delete yourself",
                            );
                            setResetPasswordWarning(
                                "Admins cannot reset their own password.",
                            );
                        } else {
                            setDeleteUserButtonErrorMessage("");
                        }
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
                    color="error"
                    fullWidth={true}
                    sx={{ height: "3rem", mb: 2 }}
                    onClick={handleDeleteSelected}
                    disabled={selectedUsers.length === 0 ||
                        isCurrentUserSelected}
                >
                    Delete Selected ({selectedUsers.length})
                </Button>
                {isCurrentUserSelected && (
                    <Alert severity="warning" sx={{ width: "100%", mt: 1 }}>
                        {deleteUserButtonErrorMessage}
                    </Alert>
                )}
                <Button
                    variant="contained"
                    fullWidth={true}
                    sx={{ height: "3rem", mb: 2 }}
                    onClick={() => setResetPasswordModalOpen(true)}
                    disabled={!canResetPassword || isCurrentUserSelected}
                >
                    Reset User Password
                </Button>
                {isCurrentUserSelected && (
                    <Alert severity="warning" sx={{ width: "100%", mt: 1 }}>
                        {resetPasswordWarning}
                    </Alert>
                )}
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
                    userIdToReset={selectedUsers[0]}
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

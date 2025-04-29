"use client";

import * as React from "react";
import {useEffect, useState} from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type {ProjectUser} from "../types/project-types.ts";
import {DataGrid, GridColDef, type GridRowId, GridRowSelectionModel,} from "@mui/x-data-grid";
import {formatDate} from "@/app/helper-functions.ts";
import {Alert, Button, Fade} from "@mui/material";
import AddUserModal from "@/app/ui/add-user-modal.tsx";
import ResetPasswordModal from "@/app/ui/reset-password-modal.tsx";
import LogoSvgLoadingIcon from "@/app/ui/logo-svg-icon/logo-svg-loading-icon.tsx";

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


type AdminUserTableProps = {
    currentUser: ProjectUser;
}

const AdminUserTable = ({ currentUser }: AdminUserTableProps) => {
    const [currentUsers, setCurrentUsers] = useState<ProjectUser[]>([]);
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isClient, setIsClient] = useState(false);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: 10,
        page: 0,
    });
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [deleteUserButtonErrorMessage, setDeleteUserButtonErrorMessage] =
        useState("");
    const [setResetPasswordButtonErrorMessage, setSetResetPasswordButtonErrorMessage] = useState("");
    const [successAlertVisibility, setSuccessAlertVisibility] = React.useState<boolean>(false);
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
    const [errorAlertVisibility, setErrorAlertVisibility] = React.useState<boolean>(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const handleShowSuccessAlert = (providedSuccessMessage: string) => {
        const fiveSeconds = 5000;
        setSuccessAlertVisibility(true);
        setSuccessMessage(providedSuccessMessage)
        setTimeout(() => {
            setSuccessAlertVisibility(false);
        }, fiveSeconds);
    };

    const handleShowErrorAlert = (providedErrorMessage: string) => {
        const fiveSeconds = 5000;
        setErrorAlertVisibility(true);
        setErrorMessage(providedErrorMessage)
        setTimeout(() => {
            setErrorAlertVisibility(false);
        }, fiveSeconds);
    };

    const handleDeleteUsers = async (userIds: string[]): Promise<boolean> => {
        setLoading(true)
        try {
            const response = await fetch("/api/users/delete-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userIds }),
            });

            if (!response.ok) {
                handleShowErrorAlert(`Failed to delete users: ${response.status}`);
                throw new Error(`Failed to delete users: ${response.status}`);
            }

            const data = await response.json();
            console.log(data.message);
            handleShowSuccessAlert(data.message || "Users deleted successfully");
            return true;
        } catch (error) {
            console.error("Error deleting users:", error);
            handleShowErrorAlert(
                error instanceof Error
                    ? error.message
                    : "Failed to delete users",
            );
            return false;
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedUsers.length === 0) return;
        setLoading(true);
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
                handleShowSuccessAlert("Users deleted successfully");
            } else {
                handleShowErrorAlert("Failed to delete selected users.");
            }
        } catch (error) {
            handleShowErrorAlert("An error occurred while deleting users.");
            console.error("Error deleting users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsClient(true);

        const fetchUsers = async () => {
            try {
                const response = await fetch("/api/users");
                if (!response.ok) {
                    handleShowErrorAlert(`Failed to fetch users: ${response.status}`);
                    throw new Error(
                        `Failed to fetch users: ${response.status}`,
                    );
                }
                const data = await response.json();
                if (data.users && data.users.length > 0) {
                    const usersWithId = data.users.map((user: ProjectUser) => ({
                        ...user,
                    }));
                    handleShowSuccessAlert("Users fetched successfully");
                    setCurrentUsers(usersWithId);
                    if (columns.length === 0) {
                        setColumns(generateColumns(usersWithId[0]));
                    }
                } else {
                    handleShowErrorAlert("No users found.");
                    setCurrentUsers([]);
                    setColumns([]);
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error("Error fetching users:", error.message);
                    handleShowErrorAlert(
                        `Error fetching users: ${error.message}. Please try again.`,
                    );
                } else {
                    console.error("Unexpected error fetching users:", error);
                    handleShowErrorAlert(
                        "An unexpected error occurred while fetching users. Please try again.",
                    );
                }
                setCurrentUsers([]);
                setColumns([]);
            } finally {
                setLoading(false);
            }
        };

        if (loading) {
            fetchUsers().then();
        }
    }, [loading, columns.length, selectedUsers]);

    if (!isClient) {
        return null;
    }

    if (loading || (columns.length === 0 && currentUsers.length > 0)) {
        return (
            <LogoSvgLoadingIcon/>
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
                        handleShowSuccessAlert={handleShowSuccessAlert}
                        handleShowErrorAlert={handleShowErrorAlert}
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
            <Fade in={successAlertVisibility} timeout={500}>
                <Alert severity="success" onClose={() => {
                    setSuccessAlertVisibility(false);
                }}>
                    {successMessage}
                </Alert>
            </Fade>

            <Fade in={errorAlertVisibility} timeout={500}>
                <Alert severity="success" onClose={() => {
                    setErrorAlertVisibility(false);
                }}>
                    {errorMessage}
                </Alert>
            </Fade>
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
                            setSetResetPasswordButtonErrorMessage(
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
                        {setResetPasswordButtonErrorMessage}
                    </Alert>
                )}
            </Box>

            {addUserModalOpen && (
                <AddUserModal
                    open={addUserModalOpen}
                    onClose={() => setAddUserModalOpen(false)}
                    handleShowSuccessAlert={handleShowSuccessAlert}
                    handleShowErrorAlert={handleShowErrorAlert}
                    setLoading={setLoading}
                />
            )}
            {resetPasswordModalOpen && (
                <ResetPasswordModal
                    open={resetPasswordModalOpen}
                    userIdToReset={selectedUsers[0]}
                    onClose={() => setResetPasswordModalOpen(false)}
                    handleShowSuccessAlert={handleShowSuccessAlert}
                    handleShowErrorAlert={handleShowErrorAlert}
                    setLoading={setLoading}
                />
            )}
        </Box>
    );
};

export default AdminUserTable;

"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
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
import LogoSvgLoadingIcon from "@/app/ui/logo-svg-icon/logo-svg-loading-icon.tsx";
import EditHourlyRateModal from "@/app/ui/edit-hourly-rate-modal.tsx";

const EXCLUDED_FIELDS = [
    "password",
    "resetToken",
    "resetTokenExpiresAt",
    "role",
    "createdAt",
    "updatedAt",
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
    const validKeys = Object.keys(user)
        .filter((key) => key.trim() !== "" && !EXCLUDED_FIELDS.includes(key));

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

type ManagementUserTableProps = {
    currentUser: ProjectUser;
    handlePayTableUserChange: (userId: string) => void;
};

const ManagementUserTable = (
    { currentUser, handlePayTableUserChange }: ManagementUserTableProps,
) => {
    const [currentUsers, setCurrentUsers] = useState<ProjectUser[]>([]);
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorState, setErrorState] = useState<boolean>(false);
    const [isClient, setIsClient] = useState(false);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: 10,
        page: 0,
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[] | null>(null);
    const [
        editHourlyRateButtonErrorMessage,
        setEditHourlyRateButtonErrorMessage,
    ] = useState<string | null>(null);
    const [editHourlyRateModelOpen, setEditHourlyRateModelOpen] = useState(
        false,
    );
    const [viewPayPeriodErrorMessage, setViewPayPeriodErrorMessage] = useState<
        string | null
    >(null);
    const currentUserId = currentUser.userId;

    const handleEditHourlyRate = async (userId: string, hourlyRate: number) => {
        if (!userId || userId.length === 0) {
            setErrorMessage("No user ID provided");
            return;
        }
        if (
            hourlyRate === undefined || hourlyRate === null || isNaN(hourlyRate)
        ) {
            setErrorMessage("Hourly rate is required and must be a number");
            return;
        }
        if (hourlyRate < 0) {
            setErrorMessage("Hourly rate must be positive");
            return;
        }

        try {
            const response = await fetch("/api/users/edit-hourly-rate", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userIdToEdit: userId,
                    updatedHourlyRate: hourlyRate,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(
                    `Failed to update hourly rate: ${response.status}`,
                    errorData,
                );
                setErrorMessage(
                    errorData.message || "Failed to update hourly rate",
                );
                throw new Error(
                    errorData.message ||
                        `HTTP error! status: ${response.status}`,
                );
            }

            setErrorMessage(null);
            setLoading(true);
        } catch (error) {
            console.error("Error in handleEditHourlyRate:", error);
            if (!errorMessage) {
                setErrorMessage(
                    "An error occurred while updating the hourly rate.",
                );
            }
            throw error;
        }
    };
    const isCurrentUserSelected = selectedUsers?.includes(currentUser.userId);

    useEffect(() => {
        setIsClient(true);

        const fetchUsers = async () => {
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
                    console.error(
                        "Unexpected errorMessage fetching users:",
                        error,
                    );
                }
                setErrorState(true);
                setCurrentUsers([]);
                setColumns([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers().then();
    }, [loading]);

    if (!isClient) {
        return null;
    }

    if (loading) {
        return <LogoSvgLoadingIcon />;
    }

    if (columns.length === 0 && currentUsers.length > 0) {
        return <LogoSvgLoadingIcon />;
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
            width="100%"
        >
            {errorState && (
                <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                    {errorMessage}
                </Alert>
            )}
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
                    onRowSelectionModelChange={(
                        newSelectionModel: GridRowSelectionModel,
                    ) => {
                        const selectedRowIdsSet: Set<GridRowId> =
                            newSelectionModel.ids;
                        const selectedUserIds = Array.from(selectedRowIdsSet)
                            .map((id) => String(id));
                        setSelectedUsers(selectedUserIds);

                        if (
                            selectedUserIds.includes(currentUserId)
                        ) {
                            setEditHourlyRateButtonErrorMessage(
                                "Cannot edit your own hourly rate.",
                            );
                        } else if (selectedUserIds.length > 1) {
                            setEditHourlyRateButtonErrorMessage(
                                "Cannot edit multiple users at once.",
                            );
                            setViewPayPeriodErrorMessage(
                                "Cannot view pay periods of multiple users at once.",
                            );
                        } else {
                            setEditHourlyRateButtonErrorMessage(null);
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
                    sx={{ height: "3rem", mb: 2 }}
                    disabled={selectedUsers === null ||
                        selectedUsers.length === 0 ||
                        isCurrentUserSelected}
                    onClick={() => {
                        setEditHourlyRateModelOpen(true);
                    }}
                >
                    Edit Hourly Rate
                </Button>
                {isCurrentUserSelected && (
                    <Alert severity="warning" sx={{ width: "100%", mt: 1 }}>
                        {editHourlyRateButtonErrorMessage}
                    </Alert>
                )}
                <Button
                    variant="contained"
                    disabled={selectedUsers === null ||
                        selectedUsers.length === 0}
                    onClick={() =>
                        handlePayTableUserChange(
                            selectedUsers ? selectedUsers[0] : currentUserId,
                        )}
                >
                    View User Pay Stubs
                </Button>
                {isCurrentUserSelected && (
                    <Alert severity="warning" sx={{ width: "100%", mt: 1 }}>
                        {viewPayPeriodErrorMessage}
                    </Alert>
                )}
            </Box>
            {editHourlyRateModelOpen && selectedUsers &&
                selectedUsers.length === 1 && (
                <EditHourlyRateModal
                    open={editHourlyRateModelOpen}
                    onClose={() => setEditHourlyRateModelOpen(false)}
                    selectedUserId={selectedUsers[0]}
                    onEditHourlyRate={handleEditHourlyRate}
                />
            )}
        </Box>
    );
};

export default ManagementUserTable;

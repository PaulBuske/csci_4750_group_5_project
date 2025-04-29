"use client";

import { getUser, verifySession } from "@/app/lib/data-access-layer.ts";
import { Alert, Box, Fade, Stack, Typography } from "@mui/material";
import React, { useCallback, useEffect } from "react";
import { ProjectUser, ValidSession } from "@/app/types/project-types.ts";
import LandingPageAppBar from "@/app/ui/landing-page-app-bar.tsx";
import TimePunchModal from "@/app/ui/time-punch-modal.tsx";
import PayPeriodTable from "@/app/ui/pay-period-table.tsx";
import UserManualButton from "@/app/ui/user-manual-button.tsx";
import AdminUserTable from "@/app/ui/admin-user-table.tsx";
import ManagementUserTable from "@/app/ui/management-user-table.tsx";
import LogoSvgLoadingIcon from "@/app/ui/logo-svg-icon/logo-svg-loading-icon.tsx";

export default function Dashboard() {
    const [currentUser, setCurrentUser] = React.useState<ProjectUser | null>(
        null,
    );
    const [loading, setLoading] = React.useState(true);
    const [timeEntryRefreshTrigger, setTimeEntryRefreshTrigger] = React
        .useState(0);
    const [payTableUser, setPayTableUser] = React.useState<ProjectUser | null>(
        null,
    );
    const [successAlertVisibility, setSuccessAlertVisibility] = React.useState<
        boolean
    >(false);
    const [successMessage, setSuccessMessage] = React.useState<string | null>(
        null,
    );
    const [errorAlertVisibility, setErrorAlertVisibility] = React.useState<
        boolean
    >(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const handleShowSuccessAlert = (providedSuccessMessage: string) => {
        const fiveSeconds = 5000;
        setSuccessAlertVisibility(true);
        setSuccessMessage(providedSuccessMessage);
        setTimeout(() => {
            setSuccessAlertVisibility(false);
        }, fiveSeconds);
    };

    const handleShowErrorAlert = (providedErrorMessage: string) => {
        const fiveSeconds = 5000;
        setErrorAlertVisibility(true);
        setErrorMessage(providedErrorMessage);
        setTimeout(() => {
            setErrorAlertVisibility(false);
        }, fiveSeconds);
    };

    const handlePayTableUserChange = async (newUserId: string) => {
        if (currentUser?.userId === newUserId) {
            setPayTableUser(currentUser);
            return;
        } else {
            try {
                const response = await fetch(
                    `/api/users/get-user-for-pay-period-lookup`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            userIdToSearch: newUserId,
                            currentUserId: currentUser?.userId,
                        }),
                    },
                );
                const data = await response.json();
                if (response.ok) {
                    setPayTableUser(data.foundUser);
                } else {
                    console.error("Error fetching user:", data.message);
                    handleShowErrorAlert(
                        `Error fetching user: ${data.message}`,
                    );
                }
            } catch (error) {
                console.error("Error in handlePayTableUserChange:", error);
                handleShowErrorAlert(
                    "Failed to fetch user for pay period lookup.",
                );
            }
        }
    };

    const refreshSession = useCallback(
        async (): Promise<ValidSession | null> => {
            try {
                const session = await verifySession();
                const currentSession = session?.userId
                    ? {
                        ...session,
                        userId: session.userId.toString(),
                    }
                    : null;

                if (!currentSession?.isAuth || !currentSession?.userId) {
                    console.error("Session not found or invalid");
                    return null;
                }
                return currentSession;
            } catch (e) {
                console.error(
                    "Failed to fetch session:",
                    e instanceof Error ? e.message : e,
                );
                return null;
            }
        },
        [],
    );

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const fetchedSession = await refreshSession();

            if (!fetchedSession?.userId) {
                console.error(
                    new Error(
                        "Session invalid or missing user ID. Please log in.",
                    ),
                );
                handleShowErrorAlert(
                    "Session invalid or missing user ID. Please log in.",
                );
                setCurrentUser(null);
                setPayTableUser(null);
                setLoading(false);
                return;
            }

            try {
                const foundUser = await getUser();
                if (!foundUser) {
                    console.error("User not found");
                    handleShowErrorAlert("User not found");
                    setCurrentUser(null);
                    setPayTableUser(null);
                } else {
                    handleShowSuccessAlert("User found");
                    setCurrentUser(foundUser);
                    setPayTableUser(foundUser);
                }
            } catch (error) {
                if (error instanceof Error) {
                    console.error("Error fetching user:", error.message);
                    handleShowErrorAlert(
                        `Error fetching user: ${error.message}`,
                    );
                } else {
                    console.error(
                        "An unknown error occurred while fetching user:",
                        error,
                    );
                    handleShowErrorAlert(
                        "An unknown error occurred while fetching user.",
                    );
                }
                setCurrentUser(null);
                setPayTableUser(null); //
            } finally {
                setLoading(false);
            }
        };

        loadInitialData().then();
    }, [refreshSession]);

    const handleTimePunchEvent = async () => {
        setTimeEntryRefreshTrigger((prev) => prev + 1);
    };

    return (
        <Box
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ px: 2, py: 4 }}
        >
            {loading
                ? <LogoSvgLoadingIcon />
                : (
                    <Box sx={{ width: "100%", maxWidth: "lg" }}>
                        <Stack spacing={3}>
                            <LandingPageAppBar currentUser={currentUser} />
                            {currentUser && (
                                <Box>
                                    <Fade
                                        in={successAlertVisibility}
                                        timeout={500}
                                    >
                                        <Alert
                                            severity="success"
                                            onClose={() => {
                                                setSuccessAlertVisibility(
                                                    false,
                                                );
                                            }}
                                        >
                                            {successMessage}
                                        </Alert>
                                    </Fade>

                                    <Fade
                                        in={errorAlertVisibility}
                                        timeout={500}
                                    >
                                        <Alert
                                            severity="error"
                                            onClose={() => {
                                                setErrorAlertVisibility(false);
                                            }}
                                        >
                                            {errorMessage}
                                        </Alert>
                                    </Fade>

                                    <Box
                                        display="flex"
                                        flexDirection={{
                                            xs: "column",
                                            sm: "row",
                                        }}
                                        justifyContent="space-between"
                                        alignItems={{
                                            xs: "stretch",
                                            sm: "flex-start",
                                        }}
                                        gap={2}
                                        width="100%"
                                    >
                                        <Stack spacing={1} sx={{ flexGrow: 1 }}>
                                            <Typography variant="h4">
                                                Welcome back,{" "}
                                                {currentUser.name || "User"}
                                            </Typography>
                                            <Typography variant="h6">
                                                Email:{" "}
                                                {currentUser.email || "N/A"}
                                            </Typography>
                                            <Typography>
                                                Role:{" "}
                                                {currentUser.role || "N/A"}
                                            </Typography>
                                            <Typography>
                                                Hourly Rate:{" "}
                                                {currentUser.hourlyRate
                                                    ? `$${
                                                        currentUser.hourlyRate
                                                            .toFixed(2)
                                                    }`
                                                    : "N/A"}
                                            </Typography>
                                        </Stack>

                                        <Box
                                            sx={{
                                                width: "100%",
                                                maxWidth: {
                                                    xs: "100%",
                                                    sm: "250px",
                                                },
                                            }}
                                        >
                                            <TimePunchModal
                                                currentUser={currentUser}
                                                onPunchSuccess={handleTimePunchEvent}
                                                handleShowSuccessAlert={handleShowSuccessAlert}
                                                handleShowErrorAlert={handleShowErrorAlert}
                                            />
                                            <UserManualButton
                                                loading={loading}
                                            />
                                        </Box>
                                    </Box>

                                    <PayPeriodTable
                                        currentUser={payTableUser}
                                        refreshTrigger={timeEntryRefreshTrigger}
                                    />

                                    {currentUser.role === "ADMIN" && (
                                        <AdminUserTable
                                            currentUser={currentUser}
                                        />
                                    )}
                                    {currentUser.role === "MANAGER" && (
                                        <ManagementUserTable
                                            currentUser={currentUser}
                                            handlePayTableUserChange={handlePayTableUserChange}
                                        />
                                    )}
                                </Box>
                            )}
                        </Stack>
                    </Box>
                )}
        </Box>
    );
}

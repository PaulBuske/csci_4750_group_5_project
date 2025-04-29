"use client";

import {getUser, verifySession} from "@/app/lib/data-access-layer.ts";
import {Alert, Box, Stack, Typography} from "@mui/material";
import React, {useCallback, useEffect} from "react";
import {ProjectUser, ValidSession} from "@/app/types/project-types.ts";
import LandingPageAppBar from "@/app/ui/landing-page-app-bar.tsx";
import TimePunchModal from "@/app/ui/time-punch-modal.tsx";
import PayPeriodTable from "@/app/ui/pay-period-table.tsx";
import UserManualButton from "@/app/ui/user-manual-button.tsx";
import AdminUserTable from "@/app/ui/admin-user-table.tsx";
import ManagementUserTable from "@/app/ui/management-user-table.tsx";
import LogoSvgLoadingIcon from "@/app/ui/logo-svg-icon/logo-svg-loading-icon.tsx";

export default function Dashboard() {
    const [currentValidSession, setCurrentValidSession] = React.useState<
        ValidSession | null
    >(null);
    const [error, setError] = React.useState<Error | null>(null);
    const [currentUser, setCurrentUser] = React.useState<ProjectUser | null>(
        null,
    );
    const [loading, setLoading] = React.useState(true);
    const [timeEntryRefreshTrigger, setTimeEntryRefreshTrigger] = React
        .useState(0);
    const [payTableUser, setPayTableUser] = React.useState<ProjectUser | null>(null);

    const handlePayTableUserChange = async (newUserId: string) => {
        console.log("handlePayTableUserChange called with newUserId:", newUserId);
        console.log("Current user ID:", currentUser?.userId);
        if (currentUser?.userId === newUserId) {
            setPayTableUser(currentUser);
            return
        } else {
            try {
                const response = await fetch(`/api/users/get-user-for-pay-period-lookup`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userIdToSearch: newUserId,
                        currentUserId: currentUser?.userId,
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    console.log("User found:", data.foundUser);
                    setPayTableUser(data.foundUser);
                } else {
                    console.error("Error fetching user:", data.message);
                    setError(new Error(data.message));
                }
            } catch (error) {
                console.error("Error in handlePayTableUserChange:", error);
                setError(new Error("Failed to fetch user for pay period lookup."));
            }
        }
    };

    const refreshSession = useCallback(async () => {
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
                return false;
            }
            setCurrentValidSession(currentSession);
            return true;
        } catch (e) {
            console.error(
                "Failed to fetch session:",
                e instanceof Error ? e.message : e,
            );
            return false;
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const loadInitialData = async () => {
            const sessionValid = await refreshSession();
            if (!sessionValid) {
                setError(new Error("Session invalid. Please log in."));
                setLoading(false);
                return;
            }

            try {
                if (!currentValidSession?.userId) {
                    setError(new Error("Session data is missing user ID."));
                    setLoading(false);
                    return;
                }
                const foundUser = await getUser();
                if (!foundUser) {
                    setError(new Error("User not found"));
                    console.error("User not found");
                } else {
                    setError(null);
                    setCurrentUser(foundUser);
                    setPayTableUser(foundUser);
                }
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error
                        : new Error("Failed to fetch user"),
                );
                console.error("Failed to fetch user:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData().then();
    }, [refreshSession, currentValidSession?.userId]);

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
            {error && (
                <Alert
                    severity="error"
                    sx={{ width: "100%", maxWidth: "lg", mt: 2, mb: 2 }}
                >
                    {/* Constrain alert width */}
                    {error.message}
                </Alert>
            )}

            {loading
                ? <LogoSvgLoadingIcon />
                : (
                    <Box sx={{ width: "100%", maxWidth: "lg" }}>
                        <Stack spacing={3}>
                            {/* Increased spacing */}
                            <LandingPageAppBar currentUser={currentUser} />
                            {currentUser
                                ? (
                                    <>
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
                                            {/* User Info Section */}
                                            <Stack
                                                spacing={1}
                                                sx={{ flexGrow: 1 }}
                                            >
                                                {/* Allow info to grow */}
                                                <Typography variant="h4">
                                                    Welcome back,{" "}
                                                    {currentUser.name || "User"}
                                                </Typography>
                                                <Typography variant="h6">
                                                    {/* Use h6 for better hierarchy */}
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
                                                            currentUser
                                                                .hourlyRate
                                                                .toFixed(2)
                                                        }`
                                                        : "N/A"}
                                                </Typography>
                                            </Stack>

                                            {/* Time Punch Button Section - Constrained Width */}
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

                                        {currentUser.role === "ADMIN" &&
                                            (
                                                <AdminUserTable
                                                    currentUser={currentUser}
                                                />
                                            )}
                                        {currentUser.role === "MANAGER" &&
                                            <ManagementUserTable
                                                currentUser={currentUser}
                                                handlePayTableUserChange={handlePayTableUserChange}
                                            />}
                                    </>
                                )
                                : (
                                    !error && (
                                        <Typography>
                                            User data not available.
                                        </Typography>
                                    )
                                )}
                        </Stack>
                    </Box>
                )}
        </Box>
    );
}

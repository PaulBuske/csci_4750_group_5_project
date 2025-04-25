// src/app/dashboard/page.tsx
"use client";

import {getUser, verifySession} from "@/app/lib/data-access-layer.ts";
import {Alert, Box, CircularProgress, Stack, Typography} from "@mui/material";
import UserTable from "@/app/ui/user-table.tsx";
import React, {useCallback, useEffect} from "react";
import {ProjectUser, ValidSession} from "@/app/types/project-types.ts";
import LandingPageAppBar from "@/app/ui/landing-page-app-bar.tsx";
import TimePunchModal from "@/app/ui/time-punch-modal.tsx";
import PayPeriodTable from "@/app/ui/pay-period-table.tsx";
import UserManualButton from "@/app/ui/user-manual-button.tsx";

export default function Dashboard() {
    const [currentValidSession, setCurrentValidSession] = React.useState<
        ValidSession | null
    >(null);
    const [error, setError] = React.useState<Error | null>(null);
    const [currentUser, setCurrentUser] = React.useState<ProjectUser | null>(
        null);
    const [loading, setLoading] = React.useState(true);
    const [timeEntryRefreshTrigger, setTimeEntryRefreshTrigger] = React.useState(0);


    const refreshSession = useCallback(async () => {
        try {
            const session = await verifySession();
            const currentSession = session?.userId ? {
                ...session,
                userId: session.userId.toString(),
            } : null;

            if (!currentSession?.isAuth || !currentSession?.userId) {
                console.error("Session not found or invalid");
                return false;
            }
            setCurrentValidSession(currentSession);
            return true;
        } catch (e) {
            console.error("Failed to fetch session:", e instanceof Error ? e.message : e);
            return false;
        }
    }, []);

    // Initial data loading
    useEffect(() => {
        setLoading(true); // Start loading
        setError(null); // Clear previous errors
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
                    setError(null)
                    setCurrentUser(foundUser);
                }
            } catch (error) {
                setError(error instanceof Error ? error : new Error("Failed to fetch user"));
                console.error("Failed to fetch user:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [refreshSession, currentValidSession?.userId]); // Re-run if session user ID changes

    const handleTimePunchEvent = async () => {
        await setTimeEntryRefreshTrigger(prev => prev + 1);
    };

    function checkForAdminOrManagerRoles() {
        return currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
    }

    return (
        <Box
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ px: 2, py: 4 }}
        >
            {error && (
                <Alert severity="error" sx={{ width: "100%", maxWidth: 'lg', mt: 2, mb: 2 }}> {/* Constrain alert width */}
                    {error.message}
                </Alert>
            )}

            {loading ? <CircularProgress size={36} /> : (
                <Box sx={{ width: '100%', maxWidth: 'lg' }}>
                    <Stack spacing={3}> {/* Increased spacing */}
                        <LandingPageAppBar currentUser={currentUser} />
                        {currentUser ? (
                            <>
                                <Box
                                    display='flex'
                                    flexDirection={{ xs: 'column', sm: 'row' }} // Stack on small screens, row on larger
                                    justifyContent='space-between'
                                    alignItems={{ xs: 'stretch', sm: 'flex-start' }} // Align items
                                    gap={2} // Add gap between items
                                    width="100%"
                                >
                                    {/* User Info Section */}
                                    <Stack spacing={1} sx={{ flexGrow: 1 }}> {/* Allow info to grow */}
                                        <Typography variant="h4">
                                            Welcome back, {currentUser.name || "User"}
                                        </Typography>
                                        <Typography variant="h6"> {/* Use h6 for better hierarchy */}
                                            Email: {currentUser.email || "N/A"}
                                        </Typography>
                                        <Typography>
                                            Role: {currentUser.role || "N/A"}
                                        </Typography>
                                        <Typography>
                                            Hourly Rate: {currentUser.hourlyRate
                                            ? `$${currentUser.hourlyRate.toFixed(2)}`
                                            : "N/A"}
                                        </Typography>
                                    </Stack>

                                    {/* Time Punch Button Section - Constrained Width */}
                                    <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '250px' } }}>
                                        <TimePunchModal
                                            currentUser={currentUser}
                                            onPunchSuccess={handleTimePunchEvent}
                                        />
                                         <UserManualButton loading={loading} />
                                    </Box>
                                </Box>

                                <PayPeriodTable
                                    currentUser={currentUser}
                                    refreshTrigger={timeEntryRefreshTrigger}
                                />

                                {checkForAdminOrManagerRoles() && (
                                    <UserTable />
                                )}
                            </>
                        ) : (
                            !error && <Typography>User data not available.</Typography>
                        )}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}
"use client";

import { getUser, verifySession } from "@/app/lib/data-access-layer.ts";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import UserTable from "@/app/ui/user-table.tsx";
import React, { useCallback, useEffect } from "react";
import type { ProjectUser, ValidSession } from "@/app/types/project-types.ts";
import LandingPageAppBar from "@/app/ui/landing-page-app-bar.tsx";
import TimePunchModal from "@/app/ui/time-punch-modal.tsx";
import PayPeriodTable from "@/app/ui/pay-period-table.tsx";

export default function Dashboard() {
    const [currentValidSession, setCurrentValidSession] = React.useState<
        ValidSession | null
    >(null);
    const [error, setError] = React.useState<Error | null>(null);
    const [currentUser, setCurrentUser] = React.useState<ProjectUser | null>(
        null,
    );
    const [loading, setLoading] = React.useState(true);
    const [timeEntryRefreshTrigger, setTimeEntryRefreshTrigger] = React.useState(0);

    const refreshSession = useCallback(async () => {
        try {
            const session = await verifySession();
            const currentSession = {
                ...session,
                userId: session.userId.toString(),
            };
            if (!currentSession.isAuth || !currentSession.userId) {
                setError(new Error("Session not found or invalid"));
                console.error("Session not found or invalid");
                return false;
            }
            setCurrentValidSession(currentSession);
            return true;
        } catch (e) {
            if (e instanceof Error && e.message != null) {
                setError(e);
                console.error("Failed to fetch session:", e.message);
            } else {
                setError(new Error("Unexpected error fetching session"));
                console.error("Unexpected error fetching session:", e);
            }
            return false;
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {

            const sessionValid = await refreshSession();
            if (!sessionValid) return;

            try {
                const foundUser = await getUser();
                if (!foundUser) {
                    setError(new Error("User not found"));
                    console.error("User not found");
                    return;
                }
                setCurrentUser(foundUser);
            } catch (error) {
                setError(error instanceof Error ? error : new Error("Failed to fetch user"));
                console.error("Failed to fetch user:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData().then();
    }, [refreshSession]);

    const handleTimePunchEvent = async () => {
        await refreshSession();
        setTimeEntryRefreshTrigger(prev => prev + 1);
    };

    function checkForAdminOrManagerRoles() {
        return currentUser?.role?.toString() === "ADMIN" ||
            currentUser?.role?.toString() === "MANAGER";
    }

    return (
        <Box
            width="100%"
            height="min-content"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
        >
            {error && (
                <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
                    {error.message}
                </Alert>
            )}

            {loading ? <CircularProgress size={36} /> : (
                <Box>
                    <Stack spacing={2}>
                        <Box>
                            <LandingPageAppBar currentUser={currentUser} />
                            {currentValidSession && (
                                <Box
                                    display='flex'
                                    flexDirection='column'
                                    justifyContent='space-between'
                                    width="100%"
                                    height="min-content"
                                >
                                    <Box
                                        display="flex"
                                        flexDirection="row"
                                        justifyContent={'space-between'}
                                    >
                                        <Stack>
                                            <Typography variant="h4" sx={{ mt: 2 }}>
                                                Welcome back,
                                                {currentUser?.name
                                                    ? ` ${currentUser.name}`
                                                    : "Error loading name."}
                                            </Typography>
                                            <Typography variant="h5" sx={{ mt: 2 }}>
                                                Your email is:
                                                {currentUser?.email
                                                    ? ` ${currentUser.email}`
                                                    : "Error loading email."}
                                            </Typography>
                                            <Typography>
                                                Your current role is:
                                                {currentUser?.role
                                                    ? ` ${currentUser.role}`
                                                    : "Error loading role."}
                                            </Typography>
                                            <Typography>
                                                Your current hourly rate is:
                                                {currentUser?.hourlyRate
                                                    ? ` $${
                                                        currentUser.hourlyRate
                                                            .toFixed(
                                                                2,
                                                            )
                                                    }`
                                                    : "Error loading pay rate."}
                                            </Typography>
                                        </Stack>
                                        <TimePunchModal
                                            currentUser={currentUser}
                                            onPunchSuccess={handleTimePunchEvent}
                                        />
                                    </Box>
                                    <PayPeriodTable
                                        currentUser={currentUser}
                                        refreshTrigger={timeEntryRefreshTrigger}
                                    />
                                    {
                                        checkForAdminOrManagerRoles() && (
                                            <UserTable/>)
                                    }
                                </Box>
                            )}
                        </Box>
                    </Stack>
                </Box>
            )}
        </Box>
    );
}
"use client";

import { getUser, verifySession } from "@/app/lib/dal.ts";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import UserTable from "@/app/ui/user-table.tsx";
import React, { useEffect } from "react";
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

    useEffect(() => {
        verifySession().then((session) => {
            try {
                const currentSession = {
                    ...session,
                    userId: session.userId.toString(),
                };
                if (!currentSession.isAuth || !currentSession.userId) {
                    const sessionError = new Error(
                        "Session not found or invalid",
                    );
                    setError(sessionError);
                    console.error("Session not found or invalid");
                    return;
                }
                setCurrentValidSession(currentSession);
            } catch (e) {
                if (e instanceof Error && e.message != null) {
                    setError(e);
                    console.error("Failed to fetch session:", e.message);
                    return;
                } else {
                    console.error("Unexpected error fetching session:", error);
                    setError(new Error("Unexpected error fetching session"));
                }
            }
        })
            .catch((error) => {
                setError(error);
                console.error("Failed to fetch session:", error);
            });
        getUser().then((foundUser: ProjectUser | null | undefined) => {
            if (!foundUser) {
                const userError = new Error("User not found");
                setError(userError);
                console.error("User not found");
                return;
            }
            setCurrentUser(foundUser);
            setLoading(false);
        }).catch((error) => {
            setError(error);
            console.error("Failed to fetch user:", error);
        });
    }, [currentUser?.userId, error]);

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
                                    display="flex"
                                    flexDirection="row"
                                    justifyContent={'space-between'}>
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
                                    <TimePunchModal currentUser={currentUser} />
                                </Box>
                            )}
                        </Box>
                    </Stack>

                    <PayPeriodTable currentUser={currentUser} />

                    {checkForAdminOrManagerRoles() && (
                        <Stack maxWidth="80vw" margin="auto" marginTop={4}>
                            <Typography variant="h3">Current Users:</Typography>
                            <UserTable />
                        </Stack>
                    )}
                </Box>
            )}
        </Box>
    );
}

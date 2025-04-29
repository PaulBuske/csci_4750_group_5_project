import {Box, Button, Typography} from "@mui/material";
import React from "react";
import NextLink from "next/link";
import LogoSvgIcon from "@/app/ui/logo-svg-icon/logo-svg-icon.tsx";


export default function Home() {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="start"
            height="100vh"
        >
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                mb={4}
            >
                <LogoSvgIcon
                    sx={{
                        width: 100,
                        height: 100,
                        mr: 2,
                        color: "primary.main",
                    }}/>
                <Typography variant="h2" component="h1">
                    Time and Expense 2.0
                </Typography>
            </Box>

            <Box>
                <Button
                    variant="contained"
                    color="primary"
                    component={NextLink}
                    href="/public/login"
                    sx={{ mx: 1 }}
                >
                    Login
                </Button>
            </Box>
        </Box>
    );
}
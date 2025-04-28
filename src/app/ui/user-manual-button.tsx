import React from "react";
import { Button, CircularProgress } from "@mui/material";

interface UserManualButtonProps {
    loading?: boolean;
}

export const UserManualButton = ({ loading }: UserManualButtonProps) => {
    return (
        <Button
            variant="contained"
            sx={{ mt: 3, mb: 2, width: "100%", maxWidth: "300px" }}
            disabled={loading}
            href="/docs/User_Manual.pdf"
            target="_blank"
            rel="noopener noreferrer"
        >
            {loading ? <CircularProgress size={24} /> : "User Manual"}
        </Button>
    );
};

export default UserManualButton;

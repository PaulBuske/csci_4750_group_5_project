import React from "react";
import {Button} from "@mui/material";
import LogoSvgLoadingIcon from "@/app/ui/logo-svg-icon/logo-svg-loading-icon.tsx";

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
            {loading
                ? <LogoSvgLoadingIcon/>
                : "User Manual"}
        </Button>
    );
};

export default UserManualButton;

import type { Metadata } from "next";
import React from "react";
import "@/app/globals.css";
import ThemeRegistry from "@/app/theme-registry.tsx";

export const metadata: Metadata = {
    title: "CSCI 4750 Group 5 Spring 2025 Project",
    description: "Group 5 Project MVP",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <ThemeRegistry>{children}</ThemeRegistry>
            </body>
        </html>
    );
}

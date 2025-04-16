import { verifySession } from '@/app/lib/dal'
import {Box, List, ListItem, ListItemText, Stack, Typography} from "@mui/material";
import UserTable from "@/app/components/UserTable";

export default function Dashboard() {
    const session = await verifySession()
    // const userRole = session?.user?.role // Assuming 'role' is part of the session object

    if (!session) {
        return (
            <Box>
                <Box position="relative" width="100%" height="50vh" overflow="hidden">
                    {/* YouTube Video Background */}
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/zqLEO5tIuYs?autoplay=1&mute=1"
                        title="YouTube video background"
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: -1,
                            pointerEvents: "none",
                        }}
                    ></iframe>

                    {/* Title Text */}
                    <Box
                        position="absolute"
                        top="40%"
                        left="25%"
                        textAlign="center"
                        color="white"
                    >
                        <Typography variant="h1" component="h1" align='center'>
                            CSCI 4750 Group 5 Project Title: TBD
                        </Typography>
                        <Typography variant="h2">Spring 2025</Typography>
                    </Box>
                </Box>
                <Stack spacing={2}>
                    <Typography variant="h2">
                        Spring 2025
                    </Typography>
                    <Typography variant="h3">
                        Current tech stack:
                    </Typography>
                    <List sx={{listStyleType: 'disc', paddingLeft: 4, marginTop: 2}}>
                        <ListItem sx={{display: 'list-item'}}>
                            <ListItemText primary="Deno"/>
                        </ListItem>
                        <ListItem sx={{display: 'list-item'}}>
                            <ListItemText primary="Next.js"/>
                        </ListItem>
                        <ListItem sx={{display: 'list-item'}}>
                            <ListItemText primary="React"/>
                        </ListItem>
                        <ListItem sx={{display: 'list-item'}}>
                            <ListItemText primary="TypeScript"/>
                        </ListItem>
                        <ListItem sx={{display: 'list-item'}}>
                            <ListItemText primary="Material UI"/>
                        </ListItem>
                        <ListItem sx={{display: 'list-item'}}>
                            <ListItemText primary="PostgreSQL"/>
                        </ListItem>
                    </List>
                </Stack>
                <Stack maxWidth='80vw' margin='auto' marginTop={4}>
                    <Typography variant='h3'>Current Users:</Typography>
                    <UserTable/>
                </Stack>
                <Box marginTop={4} display="flex" justifyContent="center">
                    <iframe
                        width="1920"
                        height="1080"
                        src="https://www.youtube.com/embed/0aBkyfz9anQ?autoplay=1&mute=1"
                        title="He-Man!"
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    ></iframe>
                </Box>
            </Box>
        );
    }
}
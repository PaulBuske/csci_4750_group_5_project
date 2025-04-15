import {Stack, Typography, List, ListItem, ListItemText, Box} from "@mui/material";
import UserTable from "@/app/components/UserTable";

export default function Home() {
  return (
      <Box>
          <Stack spacing={2}>
              <Typography variant="h1" component="h1">
                  CSCI 4750 Group 5 Project Title: TBD
              </Typography>
              <Typography variant="h2">
                  Spring 2025
              </Typography>
              <Typography variant="h3">
                  Current tech stack:
              </Typography>
              <List sx={{listStyleType: 'disc', paddingLeft: 4, marginTop: 2}}>
                  <ListItem sx={{ display: 'list-item' }}>
                      <ListItemText primary="Deno" />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                      <ListItemText primary="Next.js" />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                      <ListItemText primary="React" />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                      <ListItemText primary="TypeScript" />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                      <ListItemText primary="Material UI" />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                      <ListItemText primary="PostgreSQL" />
                  </ListItem>
              </List>
          </Stack>
          <Stack maxWidth='80vw' margin='auto' marginTop={4}>
              <Typography variant='h3'>Current Users:</Typography>
              <UserTable/>
          </Stack>
      </Box>
    );
}

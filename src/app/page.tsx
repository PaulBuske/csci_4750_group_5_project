import {Stack, Typography, List, ListItem, ListItemText, Grid} from "@mui/material";

export default function Home() {
  return (
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
    );
}

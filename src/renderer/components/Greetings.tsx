import { Box, Container, Grid, Typography } from "@mui/material";
import React from "react";
import shpdLogo from "../../../static/shpd.png";

export default function Greetings(): JSX.Element {
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Grid container justifyContent="center">
        <Box component="img" src={shpdLogo} />
      </Grid>
      <Typography variant="h1" textAlign="center" sx={{ mt: 8 }}>
        SHPD BodyCam Tagger
      </Typography>
      <Typography variant="body1" textAlign="center" sx={{ mt: 2 }}>
        Alex Brown, Alex Jen, Jason Vu, Kent Ziti
      </Typography>
    </Container>
  );
}

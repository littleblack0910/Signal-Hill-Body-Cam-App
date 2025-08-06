import { Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemText, ThemeProvider, Typography } from "@mui/material";
import React, { useState } from "react";
import theme from "../theme";
import AllVideos from "./AllVideos";
import UploadVideos from "./UploadVideos";
import ReviewTaggedVideos from "./ReviewTaggedVideos";
import ProcessProgress from "./ProcessProgress";

const drawerWidth = 280;

export default function App(): JSX.Element {
  const [page, setPage] = useState("All Videos");

  const renderPage = () => {
    switch (page) {
      case "All Videos":
        return <AllVideos />;
      case "Upload Videos":
        return <UploadVideos />;
      case "Review Tagged Videos":
        return <ReviewTaggedVideos />;
	  case "Process Progress":
        return <ProcessProgress />;
      default:
        return <AllVideos />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Bodycam Tagger
            </Typography>
          </Box>
          <List>
			{[
				{ text: "All Videos", icon: "fa-solid fa-magnifying-glass" },
				{ text: "Upload Videos", icon: "fa-solid fa-arrow-up-from-bracket" },
				{ text: "Review Tagged Videos", icon: "fa-solid fa-video" },
				{ text: "Process Progress", icon: "fa-solid fa-list-check" },
			].map(({ text, icon }) => (
				<ListItem key={text} disablePadding>
				<ListItemButton onClick={() => setPage(text)}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<i className={icon}></i>
					<Typography>{text}</Typography>
					</Box>
				</ListItemButton>
				</ListItem>
			))}
			</List>
        </Drawer>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {renderPage()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

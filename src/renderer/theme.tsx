import { createTheme } from "@mui/material/styles";

// Create a Material-UI theme instance
// https://mui.com/customization/theming/
const theme = createTheme({
  palette: {
    primary: {
      main: "#9EEAF9",
    },
    secondary: {
      main: "#9575CD",
    },
    background: {
      default: "#ffffff",
    },
  },
  typography: {
    fontWeightMedium: 600,
    fontSize: 17,
    h1: {
      fontSize: "2.2rem",
      fontWeight: 400,
      color: "#000000",
    },
    body1: {
      color: "#000000",
    },
  },
});

export default theme;

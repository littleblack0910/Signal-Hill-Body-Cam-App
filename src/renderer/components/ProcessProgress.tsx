import * as React from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
const { ipcRenderer } = window.require("electron");
const path = window.require("path");

export default function ProcessProgress(): JSX.Element {
  const [processing, setProcessing] = React.useState<{ filename: string; status: string }[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const data = await ipcRenderer.invoke("get-processing-queue");
      setProcessing(data);
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Box sx={{ width: "80%", margin: "0 auto" }}>
        <Typography variant="h4" gutterBottom sx={{ paddingBottom: 7 }}>
          Process Progress
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Currently Processing Videos
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Prediction</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processing.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{path.basename(item.filename)}</TableCell>
                  <TableCell>{item.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

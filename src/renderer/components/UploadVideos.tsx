import * as React from "react";
import {
  Box,
  Switch,
  FormControlLabel,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";

const { ipcRenderer } = window.require("electron");
const path = window.require("path");

export default function UploadVideos(): JSX.Element {
  const [unprocessed, setUnprocessed] = React.useState<string[]>([]);
  const [useImagebind, setUseImagebind] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);
  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLocked) {
      setUseImagebind(event.target.checked);
    }
  };
  const dropRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    loadUnprocessed();
  }, []);

  const loadUnprocessed = async () => {
    const paths: string[] = await ipcRenderer.invoke("get-video-paths");
    const videos: any[] = await ipcRenderer.invoke("get-all-videos");
    const processedSet = new Set(videos.map((v) => v.filename));
    const unprocessedPaths = paths.filter((p) => !processedSet.has(p));
    setUnprocessed(unprocessedPaths);
  };

  const handleFileDialog = async () => {
    const files: string[] = await ipcRenderer.invoke("open-file-dialog");
    const mp4Files = files.filter((filePath) => typeof filePath === "string" && filePath.endsWith(".mp4"));
    if (mp4Files.length > 0) {
      ipcRenderer.send("store-video-paths", mp4Files);
      loadUnprocessed();
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files)
      .map((file) => {
        return file?.path ?? file.name;
      })
      .filter((filePath) => typeof filePath === "string" && filePath.endsWith(".mp4"));

    if (files.length > 0) {
      ipcRenderer.send("store-video-paths", files);
      loadUnprocessed();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleProcessVideos = async () => {
    ipcRenderer.send("set-imagebind-enabled", useImagebind);
    ipcRenderer.send("start-processing", unprocessed);
    setUnprocessed([]);
    setIsLocked(true); // Lock the toggle after starting
  };


  return (
    <Box>
      <Box sx={{ width: "80%", margin: "0 auto" }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ paddingBottom: 7 }}
        >
          Upload Videos
        </Typography>
      </Box>

      <Paper
        elevation={3}
        ref={dropRef}
        onClick={handleFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          mt: 3,
		  mb: 10,
          width: "50%",
          margin: "0 auto",
          py: 8,
          border: "3px dashed #aaa",
          borderRadius: "20px",
          textAlign: "center",
          cursor: "pointer",
          borderStyle: "dashed",
          borderWidth: "3px",
        }}
      >
        <Box sx={{ fontSize: 48, color: "#555" }}>
          <i className="fa-solid fa-cloud-arrow-up"></i>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", mt: 2 }}>
          Drag a file here
        </Typography>
        <Typography
          sx={{
            textDecoration: "underline",
            color: "#1976d2",
            cursor: "pointer",
            mt: 1,
            fontWeight: "medium",
          }}
        >
          Choose file(s) to upload
        </Typography>
      </Paper>

      {unprocessed.length > 0 && (
        <Box sx={{ mt: 8, width: "80%", margin: "0 auto" }}>
          <Typography variant="h6" gutterBottom>
            Unprocessed Videos
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Filename</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unprocessed.map((file, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{path.basename(file)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
		  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
			<FormControlLabel
				control={
					<Switch
					checked={useImagebind}
					onChange={handleToggleChange}
					disabled={isLocked}
					color="primary"
					/>
				}
				label="Enable Imagebind"
				/>
            <Button variant="contained" onClick={handleProcessVideos}>
              Process Videos
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

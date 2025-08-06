import * as React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";

const path = window.require("path");
const { pathToFileURL } = window.require("url");
const { ipcRenderer } = window.require("electron");

export default function ReviewTaggedVideos(): JSX.Element {
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 20;

  React.useEffect(() => {
    ipcRenderer.invoke("get-all-videos").then((data: Video[]) => {
      setVideos(data);
    });
  }, []);

  const currentVideo = videos[selectedIndex];

  const handleTag = (tag: string) => {
    const updatedVideos = [...videos];
    const currentTag = updatedVideos[selectedIndex].tag;
    updatedVideos[selectedIndex].tag = currentTag === tag ? "Pending" : tag;
    setVideos(updatedVideos);
    ipcRenderer.send("update-videos-json", updatedVideos);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const renderTagChip = (tag: string) => {
    const isDelete = tag.toLowerCase() === "delete";
    const isPending = tag.toLowerCase() === "pending";
    return (
      <Box
        sx={{
          display: "inline-block",
          px: 1.5,
          py: 0.5,
          fontSize: "0.75rem",
          fontWeight: "bold",
          borderRadius: "9px",
          color: isDelete ? "red" : isPending ? "#b58900" : "black",
          backgroundColor: isDelete
            ? "#ffe5e5"
            : isPending
            ? "#fff9cc"
            : "#ffffff",
          border: "1px solid lightgray",
        }}
      >
        {tag}
      </Box>
    );
  };

  const renderPredictionChip = (prediction: string) => (
    <Box
      sx={{
        display: "inline-block",
        px: 1.5,
        py: 0.5,
        fontSize: "0.75rem",
        fontWeight: "bold",
        borderRadius: "9px",
        color: "black",
        backgroundColor: "#ffffff",
        border: "1px solid lightgray",
      }}
    >
      {prediction}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ width: "90%", margin: "0 auto" }}>
        <Typography variant="h4" gutterBottom>
          Review Tagged Videos
        </Typography>
      </Box>

      {currentVideo && (
        <Box sx={{ width: "90%", margin: "0 auto", display: "flex", gap: 4, alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: "bold", mb: 0.5 }}>
              {path.basename(currentVideo.filename)}
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", color: "gray", mb: 1 }}>
              Prediction: {currentVideo.prediction}
            </Typography>
            <video
              controls
              width="90%"
              height="420"
              src={pathToFileURL(currentVideo.filename).href}
              style={{ borderRadius: "8px" }}
              onError={(e) => console.error("Video playback error", e)}
            />
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 2 }}>
              <Button
                sx={{ color: "black", textTransform: "none" }}
                onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
              >
                {"< Previous"}
              </Button>
              <Button
                sx={{ color: "black", textTransform: "none" }}
                onClick={() => setSelectedIndex(Math.min(videos.length - 1, selectedIndex + 1))}
              >
                {"Next >"}
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}> {/* Align with top of video */}
            {["Important", "Delete"].map((tag) => {
              const selected = currentVideo.tag === tag;
              const label = tag === "Important" ? "Mark Important" : "Mark for Deletion";
              return (
                <Box
                  key={tag}
                  sx={{
                    border: "1px solid lightgray",
                    borderRadius: "12px",
                    px: 3,
                    py: 2,
                    fontSize: "1.4rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    width: "260px",
                  }}
                  onClick={() => handleTag(tag)}
                >
                  {label}
                  {selected && <i className="fa-solid fa-check"></i>}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box sx={{ width: "90%", margin: "3rem auto 0" }}>
        <Typography variant="h6" gutterBottom>
          All Videos
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ width: "90%", margin: "0 auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "normal", color: "gray", padding: "6px 16px" }}>Video ID</TableCell>
              <TableCell sx={{ fontWeight: "normal", padding: "6px 16px" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: "bold", padding: "6px 16px" }}>Prediction</TableCell>
              <TableCell sx={{ fontWeight: "bold", padding: "6px 16px" }}>Tag</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {videos
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((video, i) => {
                const title = path.basename(video.filename);
                const isExpanded = page * rowsPerPage + i === selectedIndex;
                return (
                  <TableRow
                    key={video.id}
                    hover
                    selected={isExpanded}
                    onClick={() => handleRowClick(page * rowsPerPage + i)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ color: "gray", padding: "6px 16px" }}>{video.id}</TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "normal",
                        whiteSpace: isExpanded ? "normal" : "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        padding: "6px 16px",
                      }}
                    >
                      {title}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", padding: "6px 16px" }}>
                      {renderPredictionChip(video.prediction)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", padding: "6px 16px" }}>
                      {renderTagChip(video.tag)}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={videos.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
        sx={{ width: "90%", margin: "0 auto" }}
      />
    </Box>
  );
}

type Video = {
  id: string;
  filename: string;
  prediction: string;
  tag: string;
};

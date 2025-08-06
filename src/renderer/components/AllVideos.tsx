import * as React from "react";
import {
  Box,
  Typography,
  InputAdornment,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const { ipcRenderer } = window.require("electron");
const path = window.require("path");

const filterOptions = ["All", "Important", "Pending", "Delete"];

type Video = {
  id: string;
  filename: string;
  prediction: string;
  tag: string;
};

export default function AllVideos(): JSX.Element {
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [filtered, setFiltered] = React.useState<Video[]>([]);
  const [search, setSearch] = React.useState("");
  const [filterTag, setFilterTag] = React.useState("All");
  const [page, setPage] = React.useState(0);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuVideo, setMenuVideo] = React.useState<Video | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
  const [smartDeleteOpen, setSmartDeleteOpen] = React.useState(false);

  const rowsPerPage = 20;

  React.useEffect(() => {
    loadVideos();
  }, []);

  React.useEffect(() => {
    applyFilters();
  }, [videos, search, filterTag]);

  const loadVideos = () => {
    ipcRenderer.invoke("get-all-videos").then((data: Video[]) => {
      setVideos(data);
    });
  };

  const applyFilters = () => {
    const lowerSearch = search.toLowerCase();
    const result = videos.filter(
      (v) =>
        (filterTag === "All" || v.tag === filterTag) &&
        (v.id.toLowerCase().includes(lowerSearch) ||
          v.filename.toLowerCase().includes(lowerSearch) ||
          v.prediction.toLowerCase().includes(lowerSearch) ||
          v.tag.toLowerCase().includes(lowerSearch))
    );
    setFiltered(result);
    setPage(0);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const toggleExpandRow = (id: string) => {
    const newSet = new Set(expandedRows);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedRows(newSet);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, video: Video) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuVideo(video);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuVideo(null);
  };

  const handleDeleteClick = () => {
    setMenuAnchorEl(null);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (menuVideo) {
      ipcRenderer.invoke("delete-video", menuVideo.filename).then(() => {
        setConfirmOpen(false);
        setMenuVideo(null);
        loadVideos();
      });
    }
  };

  const handleSmartDelete = () => {
    ipcRenderer.invoke("delete-tagged-videos").then(() => {
      setSmartDeleteOpen(false);
      loadVideos();
    });
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
          All Videos
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, width: "90%", margin: "0 auto" }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            placeholder="Search videos..."
            value={search}
            onChange={handleSearch}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </InputAdornment>
              ),
              sx: {
                borderRadius: "12px",
                height: 36,
                fontSize: "0.95rem",
                '&:focus-within fieldset': {
                  borderColor: '#ccc',
                },
              },
            }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<i className="fa-solid fa-filter"></i>}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            sx={{
              textTransform: "none",
              fontSize: "0.8rem",
              color: "#555",
              borderColor: "#ccc",
              height: 36,
              px: 1.5,
            }}
          >
            Filter
          </Button>
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={() => setSmartDeleteOpen(true)}
          sx={{
            textTransform: "none",
            fontSize: "0.8rem",
            color: "#555",
            borderColor: "#ccc",
            height: 36,
            px: 2,
          }}
        >
          Smart Delete
        </Button>
      </Box>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        {filterOptions.map((option) => (
          <MenuItem
            key={option}
            selected={filterTag === option}
            onClick={() => {
              setFilterTag(option);
              setFilterAnchorEl(null);
            }}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>

      <TableContainer component={Paper} sx={{ width: "90%", margin: "32px auto 0 auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "normal", color: "gray", padding: "6px 16px" }}>Video ID</TableCell>
              <TableCell sx={{ fontWeight: "normal", padding: "6px 16px" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: "bold", padding: "6px 16px" }}>Prediction</TableCell>
              <TableCell sx={{ fontWeight: "bold", padding: "6px 16px" }}>Tag</TableCell>
              <TableCell sx={{ padding: "6px 16px" }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((video) => {
                const title = path.basename(video.filename);
                const isExpanded = expandedRows.has(video.id);
                return (
                  <TableRow
                    key={video.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => toggleExpandRow(video.id)}
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
                    <TableCell align="right" sx={{ padding: "6px 16px" }}>
                      <IconButton onClick={(e) => handleMenuClick(e, video)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
        sx={{ width: "90%", margin: "0 auto" }}
      />

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
      </Menu>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Are you sure you want to delete this video?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={smartDeleteOpen} onClose={() => setSmartDeleteOpen(false)}>
        <DialogTitle>
          This action will delete all videos tagged for deletion. Press 'Confirm' to proceed.
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setSmartDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleSmartDelete} color="error">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
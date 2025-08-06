import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as url from "url";
import { ipcMain, dialog } from "electron";
import fs from "fs";
import trash from "trash";
import fetch from "node-fetch";


let mainWindow: Electron.BrowserWindow | null;

type Video = {
  id: string;
  filename: string;
  prediction: string;
  tag: string;
};

function createWindow() {
  mainWindow = new BrowserWindow({
  width: 1920,
  height: 1280,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
    webSecurity: false, // 👈 disables same-origin restriction
  },
});

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:4000");
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "renderer/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
ipcMain.handle("open-file-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Videos", extensions: ["mp4"] }],
  });

  return result.filePaths;
});
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

const dataFile = path.join(__dirname, "video_paths.json");

ipcMain.on("store-video-paths", (_event, files: string[]) => {
	const mp4Files = files.filter((filePath) => typeof filePath === "string" && filePath.endsWith(".mp4"));

  let existing: string[] = [];
  if (fs.existsSync(dataFile)) {
    try {
      existing = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    } catch (err) {
      console.error("Failed to read JSON, resetting file.");
    }
  }

  const combined = Array.from(new Set([...existing, ...mp4Files]));
  fs.writeFileSync(dataFile, JSON.stringify(combined, null, 2));
});

const videosFile = path.join(__dirname, "videos.json");

ipcMain.handle("get-all-videos", () => {
  if (!fs.existsSync(videosFile)) return [];
  const json = fs.readFileSync(videosFile, "utf-8");
  return JSON.parse(json);
});

ipcMain.on("update-videos-json", (_event, updatedVideos: Video[]) => {
  fs.writeFileSync(
    path.join(__dirname, "videos.json"),
    JSON.stringify(updatedVideos, null, 2)
  );
});

ipcMain.handle("delete-video", async (_event, videoPath: string) => {
  try {

    // Verify file exists before trying to trash
    if (!fs.existsSync(videoPath)) {
      console.warn("File does not exist:", videoPath);
      return false;
    }

    await trash([videoPath]);

    // Remove from videos.json
    const videosFile = path.join(__dirname, "videos.json");
    if (fs.existsSync(videosFile)) {
      const videos = JSON.parse(fs.readFileSync(videosFile, "utf-8"));
      const updated = videos.filter((v: any) => v.filename !== videoPath);
      fs.writeFileSync(videosFile, JSON.stringify(updated, null, 2));
    }

    return true;
  } catch (err) {
    console.error("Error deleting video:", err);
    return false;
  }
});


// Get stored file paths
ipcMain.handle("get-video-paths", () => {
  const pathFile = path.join(__dirname, "video_paths.json");
  if (!fs.existsSync(pathFile)) return [];
  return JSON.parse(fs.readFileSync(pathFile, "utf-8"));
});

// Append new videos
ipcMain.on("append-videos", (_event, newVideos: any[]) => {
  const videosFile = path.join(__dirname, "videos.json");
  let existing = [];
  if (fs.existsSync(videosFile)) {
    existing = JSON.parse(fs.readFileSync(videosFile, "utf-8"));
  }
  const combined = [...existing, ...newVideos];
  fs.writeFileSync(videosFile, JSON.stringify(combined, null, 2));
});


let processingQueue: { filename: string; status: string }[] = [];

ipcMain.handle("get-processing-queue", () => {
  return processingQueue;
});

let useImagebind = false;
ipcMain.on("set-imagebind-enabled", (_event, enabled: boolean) => {
  useImagebind = enabled;
});


ipcMain.on("start-processing", async (_event, unprocessed: string[]) => {
  processingQueue = unprocessed.map((filename, i) => ({
    filename,
    status: i === 0 ? "Currently Processing" : "Waiting to Process",
  }));

  for (let i = 0; i < processingQueue.length; i++) {
    const filename = processingQueue[i].filename;

    // Update current video's status
    processingQueue[i].status = "Currently Processing";
    if (i > 0) processingQueue[i - 1].status = "Completed";

    mainWindow?.webContents.send("processing-queue-updated", processingQueue);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filepath: filename,
          use_imagebind: useImagebind,
        }),
      });

      const data = (await res.json()) as { prediction: string; score: number };
      const prediction = data.prediction || "Other/Unsure";
      const tag = prediction === "Car Check|Confident" ? "Delete" : "Pending";

      let videos = [];
      const videoPath = path.join(__dirname, "videos.json");
      if (fs.existsSync(videoPath)) {
        videos = JSON.parse(fs.readFileSync(videoPath, "utf-8"));
      }

      videos.push({
        id: `vid_${Date.now()}`,
        filename,
        prediction,
        tag,
      });

      fs.writeFileSync(videoPath, JSON.stringify(videos, null, 2));
    } catch (err) {
      console.error(`Failed to process ${filename}:`, err);
    }

    mainWindow?.webContents.send("processing-queue-updated", processingQueue);
  }

  processingQueue = [];
  mainWindow?.webContents.send("processing-queue-updated", processingQueue);

});



// ✅ NEW: delete-tagged-videos handler
ipcMain.handle("delete-tagged-videos", async () => {
  const videosFile = path.join(__dirname, "videos.json");

  if (!fs.existsSync(videosFile)) return;

  const allVideos = JSON.parse(fs.readFileSync(videosFile, "utf-8")) as Video[];

  const keptVideos: Video[] = [];

  for (const video of allVideos) {
    if (video.tag.toLowerCase() === "delete") {
      try {
        if (fs.existsSync(video.filename)) {
          await trash([video.filename]); // move to recycling bin
        } else {
          console.warn("File not found for deletion:", video.filename);
        }
      } catch (err) {
        console.error("Failed to trash:", video.filename, err);
      }
    } else {
      keptVideos.push(video);
    }
  }

  fs.writeFileSync(videosFile, JSON.stringify(keptVideos, null, 2));
});
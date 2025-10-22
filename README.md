# Signal Hill Body Cam App

AI-powered video classification application for law enforcement body camera footage.

## Prerequisites

- Python 3.11+
- Node.js 16.13.0+
- npm 7.0.0+

## Quick Start

1. **Navigate to the project directory:**
   ```bash
   cd Signal-Hill-Body-Cam-App
   ```

2. **Setup Python environment:**
   ```bash
   python setup.py
   ```
   Choose your platform when prompted (Windows/Mac/Linux)

3. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

That's it! The app will open in an Electron window.

## Run the Application

1. **To boot up the application on your local machine, all you need to do is run:**
   ```bash
   npm run dev
   ```

2. **Port Requirements:**
   - Make sure that ports 4000 and 8000 are not in use, as those are hosting the frontend and backend
   - If they are in use, you can change the port numbers in `package.json` before running `npm run dev`

## About the Application

There are currently 4 pages you may navigate between: **All Videos**, **Upload Videos**, **Review Tagged Videos**, and **Process Progress**.

### All Videos
Contains a table with all Uploaded Videos. You can:
- Search for a video by title
- Filter a video by its Tag
- Delete individual videos using the triple dots menu (moves to system's local trash bin)
- Use the **Smart Delete** button (top right) to delete all videos with the Delete Tag

### Upload Videos
Allows you to select/drag one or multiple files to be processed. It isn't actually uploading the videos anywhere, but saving their file paths and creating json objects for processing. After selecting videos:
- A table with the files titled "Unprocessed Videos" should appear
- Click **Process Videos** button
- Toggle **Enable Imagebind** slider before processing
- **Recommendation**: Don't enable Imagebind unless you have false positives (false Car Check|Confident predictions) as it takes significantly longer to process each video
- Thresholds for imagebind and imageSimilarity can be adjusted in `ensemble_model.py` or `ensemble_model_full.py` (full includes Imagebind)

### Process Progress
Includes all videos scheduled to be processed. One video at a time gets processed, and each time a video finishes processing, it gets assigned a prediction and will appear in **All Videos** and **Review Tagged Videos**

## Features

- **AI Video Classification**: Uses ensemble of image similarity + speech-to-text + text classification
- **Real-time Processing**: Queue-based video processing
- **Modern UI**: React + Material-UI interface
- **Cross-platform**: Works on Windows, Mac, Linux

## Support

For issues or questions, please create an issue in the GitHub repository.
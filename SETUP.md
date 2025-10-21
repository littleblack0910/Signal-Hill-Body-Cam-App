# Signal Hill Body Cam App - Setup Guide

## Quick Setup (Automated)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/littleblack0910/Signal-Hill-Body-Cam-App.git
   cd Signal-Hill-Body-Cam-App
   ```

2. **Run the automated setup:**
   ```bash
   python setup.py
   ```

3. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

## Manual Setup (Step by Step)

### Prerequisites
- Python 3.11+ 
- Node.js 16.13.0+
- npm 7.0.0+

### Python Environment Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment:**
   - **Windows:**
     ```bash
   .\venv\Scripts\Activate.ps1
   ```
   - **Mac/Linux:**
     ```bash
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

### Running the Application

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **The app will open in an Electron window with:**
   - Frontend: http://localhost:4000
   - Backend: http://127.0.0.1:8000

## Troubleshooting

### Common Issues

1. **"conda not found" error:**
   - This is fixed in the current version
   - The app now uses `venv` instead of conda

2. **"ImageBind not available" warning:**
   - This is normal and expected
   - The app works without ImageBind

3. **Port already in use:**
   - Kill existing processes: `taskkill /f /im node.exe`
   - Or change ports in package.json

### File Structure
```
Signal-Hill-Body-Cam-App/
├── src/
│   ├── backend/          # Python FastAPI backend
│   ├── main/             # Electron main process
│   └── renderer/         # React frontend
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies & scripts
└── setup.py             # Automated setup script
```

## Features

- **AI Video Classification**: Uses ensemble of image similarity + speech-to-text + text classification
- **Real-time Processing**: Queue-based video processing
- **Modern UI**: React + Material-UI interface
- **Cross-platform**: Works on Windows, Mac, Linux

## Support

For issues or questions, please create an issue in the GitHub repository.

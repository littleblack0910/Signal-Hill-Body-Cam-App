#!/usr/bin/env node
/**
 * Cross-platform backend startup script
 * Handles Windows vs Mac/Linux Python path differences
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Determine the correct Python executable path
const isWindows = os.platform() === 'win32';
const venvPath = path.join(__dirname, 'venv');
const pythonExecutable = isWindows 
  ? path.join(venvPath, 'Scripts', 'python.exe')
  : path.join(venvPath, 'bin', 'python');

// Change to src directory and start the backend
process.chdir(path.join(__dirname, 'src'));

const args = [
  '-m', 'uvicorn', 
  'backend.main:app', 
  '--host', '127.0.0.1', 
  '--port', '8000'
];

console.log(`Starting backend with: ${pythonExecutable} ${args.join(' ')}`);

const backend = spawn(pythonExecutable, args, {
  stdio: 'inherit',
  shell: false
});

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down backend...');
  backend.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down backend...');
  backend.kill('SIGTERM');
});

#!/usr/bin/env python3
"""
Setup script for Signal Hill Body Cam App
This script automates the Python environment setup
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"[INFO] {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"[SUCCESS] {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    print("Setting up Signal Hill Body Cam App...")
    
    # Check if Python is available
    if not run_command("python --version", "Checking Python version"):
        print("ERROR: Python is not installed or not in PATH")
        sys.exit(1)
    
    # Create virtual environment
    if not run_command("python -m venv venv", "Creating virtual environment"):
        sys.exit(1)
    
    # Activate virtual environment and install requirements
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/Mac
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    # Install requirements
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing Python dependencies"):
        print("WARNING: Some packages might have failed to install, but continuing...")
    
    print("\nSetup completed!")
    print("\nNext steps:")
    print("1. Install Node.js dependencies: npm install")
    print("2. Start the app: npm run dev")
    print("\nTo activate the virtual environment manually:")
    if os.name == 'nt':
        print("   .\\venv\\Scripts\\Activate.ps1")
    else:
        print("   source venv/bin/activate")

if __name__ == "__main__":
    main()

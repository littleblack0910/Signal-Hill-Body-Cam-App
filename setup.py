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

def get_platform_choice():
    """Ask user to choose platform"""
    print("\n" + "="*50)
    print("PLATFORM SELECTION")
    print("="*50)
    print("Please choose your platform:")
    print("1. Windows")
    print("2. Mac (macOS)")
    print("3. Linux")
    print("="*50)
    
    while True:
        choice = input("Enter your choice (1-3): ").strip()
        if choice == '1':
            return 'windows'
        elif choice == '2':
            return 'mac'
        elif choice == '3':
            return 'linux'
        else:
            print("Invalid choice. Please enter 1, 2, or 3.")

def main():
    print("Setting up Signal Hill Body Cam App...")
    
    # Check if Python is available
    if not run_command("python --version", "Checking Python version"):
        print("ERROR: Python is not installed or not in PATH")
        sys.exit(1)
    
    # Get platform choice from user
    platform = get_platform_choice()
    print(f"\nSelected platform: {platform.upper()}")
    
    # Create virtual environment
    if not run_command("python -m venv venv", "Creating virtual environment"):
        sys.exit(1)
    
    # Determine paths based on platform
    if platform == 'windows':
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
        requirements_file = "requirements-windows.txt"
    else:  # Mac/Linux
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
        requirements_file = "requirements-mac.txt"
    
    # Check if platform-specific requirements file exists
    if not os.path.exists(requirements_file):
        print(f"WARNING: {requirements_file} not found, using default requirements.txt")
        requirements_file = "requirements.txt"
    
    # Install requirements
    print(f"Installing dependencies from {requirements_file}...")
    
    # Mac-specific optimizations
    if platform in ['mac', 'linux']:
        print("Applying Mac/Linux optimizations...")
        # Upgrade pip first for better package resolution
        run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip")
        # Install with --no-cache-dir to avoid conflicts
        install_cmd = f"{pip_cmd} install --no-cache-dir -r {requirements_file}"
    else:
        install_cmd = f"{pip_cmd} install -r {requirements_file}"
    
    if not run_command(install_cmd, "Installing Python dependencies"):
        print("WARNING: Some packages might have failed to install, but continuing...")
    
    # Mac-specific PyTorch installation
    if platform == 'mac':
        print("\nInstalling PyTorch for Mac...")
        if not run_command(f"{pip_cmd} install torch torchvision torchaudio", "Installing PyTorch packages"):
            print("WARNING: PyTorch installation failed, but continuing...")
    
    print("\nSetup completed!")
    print("\nNext steps:")
    print("1. Install Node.js dependencies: npm install")
    print("2. Start the app: npm run dev")
    print("\nTo activate the virtual environment manually:")
    if platform == 'windows':
        print("   .\\venv\\Scripts\\Activate.ps1")
    else:
        print("   source venv/bin/activate")

if __name__ == "__main__":
    main()

#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Flow CLI is installed
if ! command_exists flow; then
    echo "Flow CLI is not installed. Installing..."
    sh -ci "$(curl -fsSL https://storage.googleapis.com/flow-cli/install.sh)"
fi

# Check if Node.js is installed
if ! command_exists node; then
    echo "Node.js is not installed. Please install Node.js version 14 or higher."
    exit 1
fi

# Kill any existing Flow emulator processes
pkill -f "flow emulator" || true

# Start Flow emulator in the background
echo "Starting Flow emulator..."
flow emulator &

# Wait for emulator to start
echo "Waiting for emulator to start..."
sleep 5

# Deploy contracts
echo "Deploying contracts..."
flow project deploy

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd web
rm -rf node_modules package-lock.json
npm install

# Start frontend
echo "Starting frontend..."
npm start 
#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if virtual environment exists
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source "$SCRIPT_DIR/venv/bin/activate"

# Install/upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Run the Python script
echo "Running generate_questions.py..."
python "$SCRIPT_DIR/generate_questions.py"

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "Script completed successfully!"
else
    echo "Script failed with error code $?"
fi

# Deactivate virtual environment
deactivate 
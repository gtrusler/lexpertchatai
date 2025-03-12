#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Install dependencies if needed
if [ "$1" == "--install" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Run the server
echo "Starting Lexpert Case AI server..."
python app.py 
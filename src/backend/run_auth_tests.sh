#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Check if server is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "Error: Server is not running. Please start the server first with ./run_server.sh"
    exit 1
fi

# Run the authentication tests
echo "Running authentication tests..."
python test_auth.py 
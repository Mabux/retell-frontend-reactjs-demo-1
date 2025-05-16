#!/bin/bash

# Set default environment to development
ENV="dev"

# Check for --prod flag
if [ "$1" = "--prod" ]; then
    ENV="prod"
    echo "Starting in PRODUCTION mode..."
else
    echo "Starting in DEVELOPMENT mode..."
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing now..."
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo "Failed to install pnpm. Please install it manually and try again."
        exit 1
    fi
fi

echo "Starting Backend..."
cd backend

if [ "$ENV" = "prod" ]; then
    echo "Running production backend..."
    pnpm prod &
else
    echo "Running development backend..."
    pnpm dev &
fi
BACKEND_PID=$!
echo "Backend is running (PID: $BACKEND_PID)"

cd ../frontend
echo "Starting Frontend..."

if [ "$ENV" = "prod" ]; then
    echo "Running production frontend..."
    pnpm start:prod &
else
    echo "Running development frontend..."
    pnpm start &
fi
FRONTEND_PID=$!
echo "Frontend is running (PID: $FRONTEND_PID)"

echo ""
echo "Both processes are running in the background."
echo "To stop them, run: kill $BACKEND_PID $FRONTEND_PID"

# Keep the script running and handle Ctrl+C
trap "echo 'Stopping all processes...'; kill $BACKEND_PID $FRONTEND_PID 2> /dev/null; exit" INT

# Wait for all background processes to complete
wait
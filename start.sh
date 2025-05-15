#!/bin/zsh
# filepath: /Users/marcbusch/Documents/GitHub/retell-frontend-reactjs-demo-1/start.sh

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing now..."
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo "Failed to install pnpm. Please install it manually and try again."
        exit 1
    fi
fi

echo "Starte Backend..."
cd backend
pnpm node index.js &
BACKEND_PID=$!
echo "Backend läuft (PID: $BACKEND_PID)"

cd ../frontend
echo "Starte Frontend..."
pnpm start &
FRONTEND_PID=$!
echo "Frontend läuft (PID: $FRONTEND_PID)"

echo "Beide Prozesse laufen im Hintergrund."
echo "Zum Beenden: kill $BACKEND_PID $FRONTEND_PID"
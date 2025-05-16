# Retell Frontend Demo using our JS Web Client SDK (React/Node.js)

## Context

This demo illustrates a quick setup for integrating a frontend with a backend
using React and Node.js. It showcases using **our [JS Client SDK](https://github.com/adam-team/retell-client-js-sdk)**.

## Setup Tutorial

Check out our [doc](https://docs.retellai.com/make-calls/web-call) for a
step-by-step guide on setting up Web Call.

## Run this Demo

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or later)
- [pnpm](https://pnpm.io/) package manager

### Quick Start

1. **Set up environment variables**

   - **Backend**:
     - For development: Copy `.env.development` to `.env.development.local` and update the values
     - For production: Copy `.env.production` to `.env.production.local` and update the values
     ```bash
     # Example backend .env.development.local or .env.production.local
     RETELL_API_KEY=your_api_key_here
     ```

   - **Frontend**:
     - For development: Copy `.env.development` to `.env.development.local` and update the values
     - For production: Copy `.env.production` to `.env.production.local` and update the values
     ```bash
     # Example frontend .env.development.local or .env.production.local
     REACT_APP_AGENT_ID=your_agent_id_here
     ```
   
   > **Note**: The application uses environment-specific files (`.env.development` for development and `.env.production` for production) which are automatically selected based on the `NODE_ENV` environment variable.

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   pnpm install
   
   # Install frontend dependencies
   cd ../frontend
   pnpm install
   cd ..
   ```

3. **Start the application**

   - On **macOS/Linux**:
     ```bash
     # Development mode (default)
     ./start.sh
     
     # Production mode
     # ./start.sh --prod
     ```

   - On **Windows**:
     ```batch
     :: Development mode (default)
     start.bat
     
     :: Production mode
     :: start.bat --prod
     ```

### Start Scripts Options

Both `start.sh` (macOS/Linux) and `start.bat` (Windows) support the following options:

- **No arguments**: Starts both frontend and backend in development mode
  ```bash
  ./start.sh          # macOS/Linux
  start.bat           # Windows
  ```

- **`--prod`**: Starts both frontend and backend in production mode
  ```bash
  ./start.sh --prod   # macOS/Linux
  start.bat --prod    # Windows
  ```

### What the Scripts Do

1. **Development Mode** (`./start.sh` or `start.bat`):
   - Backend: Runs with `NODE_ENV=development`
   - Frontend: Uses development environment variables and hot-reload

2. **Production Mode** (`./start.sh --prod` or `start.bat --prod`):
   - Backend: Runs with `NODE_ENV=production`
   - Frontend: Uses production-optimized build with production environment variables

### Stopping the Application
- **macOS/Linux**: Press `Ctrl+C` in the terminal where the script is running
- **Windows**: Close the command prompt windows that were opened for the frontend and backend

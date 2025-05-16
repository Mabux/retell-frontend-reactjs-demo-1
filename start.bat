@echo off
setlocal enabledelayedexpansion

:: Set default environment to development
set ENV=dev

:: Check for --prod flag
if "%~1"=="--prod" (
    set ENV=prod
    echo Starting in PRODUCTION mode...
) else (
    echo Starting in DEVELOPMENT mode...
)

echo Checking for pnpm installation...
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo pnpm not found. Installing now...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo Failed to install pnpm. Please install it manually and try again.
        pause
        exit /b 1
    )
)

echo Starting Backend...
cd backend

if "%ENV%"=="prod" (
    echo Running production backend...
    start cmd /k "pnpm prod"
) else (
    echo Running development backend...
    start cmd /k "pnpm dev"
)
echo Backend is running in a new window
cd ..

echo Starting Frontend...
cd frontend

if "%ENV%"=="prod" (
    echo Running production frontend...
    start cmd /k "pnpm start:prod"
) else (
    echo Running development frontend...
    start cmd /k "pnpm start"
)
echo Frontend is running in a new window
echo.
echo Both processes are running in separate windows.
echo To stop them, close their respective windows or use Task Manager.
pause

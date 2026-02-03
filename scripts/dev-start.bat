@echo off
REM =============================================================================
REM Development Startup Script for Windows
REM Starts all services (Backend, Frontend, Admin) for local development
REM =============================================================================

setlocal enabledelayedexpansion

echo.
echo ==================================================
echo    PROJECT-NAME - Development Startup
echo ==================================================
echo.

REM Get project root directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    exit /b 1
)

for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    exit /b 1
)

for /f "tokens=1" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION%

REM Check for .env file
if not exist "%PROJECT_ROOT%\backend\.env" (
    echo [WARNING] No .env file found in backend\
    echo           Copy backend\.env.example to backend\.env and configure
)

echo.
echo Checking dependencies...

REM Install dependencies if needed
if not exist "%PROJECT_ROOT%\node_modules" (
    echo Installing root dependencies...
    cd /d "%PROJECT_ROOT%"
    call npm install
)

if not exist "%PROJECT_ROOT%\backend\node_modules" (
    echo Installing backend dependencies...
    cd /d "%PROJECT_ROOT%\backend"
    call npm install
)

if not exist "%PROJECT_ROOT%\frontend\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%PROJECT_ROOT%\frontend"
    call npm install
)

if not exist "%PROJECT_ROOT%\admin\node_modules" (
    echo Installing admin dependencies...
    cd /d "%PROJECT_ROOT%\admin"
    call npm install
)

echo [OK] All dependencies installed
echo.

echo ==================================================
echo Starting development servers...
echo ==================================================
echo.
echo   Backend API:    http://localhost:5000
echo   Frontend:       http://localhost:4200
echo   Admin Panel:    http://localhost:4300
echo.
echo Press Ctrl+C to stop all servers
echo.

cd /d "%PROJECT_ROOT%"
call npm run dev

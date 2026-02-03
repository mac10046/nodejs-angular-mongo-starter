#!/bin/bash

# =============================================================================
# Development Startup Script
# Starts all services (Backend, Frontend, Admin) for local development
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}   PROJECT-NAME - Development Startup${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i:"$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required (found v$NODE_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check if MongoDB is running (optional)
if command_exists mongod; then
    if pgrep -x "mongod" > /dev/null; then
        echo -e "${GREEN}✓ MongoDB is running${NC}"
    else
        echo -e "${YELLOW}⚠ MongoDB is not running locally (using Atlas?)${NC}"
    fi
fi

# Check for .env file
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo -e "${YELLOW}⚠ No .env file found in backend/${NC}"
    echo -e "${YELLOW}  Copy backend/.env.example to backend/.env and configure${NC}"
fi

echo ""

# Check ports
echo -e "${YELLOW}Checking ports...${NC}"

PORTS_OK=true

if port_in_use 5000; then
    echo -e "${RED}✗ Port 5000 is in use (Backend)${NC}"
    PORTS_OK=false
else
    echo -e "${GREEN}✓ Port 5000 available (Backend)${NC}"
fi

if port_in_use 4200; then
    echo -e "${RED}✗ Port 4200 is in use (Frontend)${NC}"
    PORTS_OK=false
else
    echo -e "${GREEN}✓ Port 4200 available (Frontend)${NC}"
fi

if port_in_use 4300; then
    echo -e "${RED}✗ Port 4300 is in use (Admin)${NC}"
    PORTS_OK=false
else
    echo -e "${GREEN}✓ Port 4300 available (Admin)${NC}"
fi

if [ "$PORTS_OK" = false ]; then
    echo ""
    echo -e "${RED}Some ports are in use. Stop existing processes or change ports.${NC}"
    exit 1
fi

echo ""

# Install dependencies if node_modules doesn't exist
echo -e "${YELLOW}Checking dependencies...${NC}"

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo -e "${BLUE}Installing root dependencies...${NC}"
    cd "$PROJECT_ROOT" && npm install
fi

if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd "$PROJECT_ROOT/backend" && npm install
fi

if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd "$PROJECT_ROOT/frontend" && npm install
fi

if [ ! -d "$PROJECT_ROOT/admin/node_modules" ]; then
    echo -e "${BLUE}Installing admin dependencies...${NC}"
    cd "$PROJECT_ROOT/admin" && npm install
fi

echo -e "${GREEN}✓ All dependencies installed${NC}"
echo ""

# Start services
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}Starting development servers...${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""
echo -e "  ${GREEN}Backend API:${NC}    http://localhost:5000"
echo -e "  ${GREEN}Frontend:${NC}       http://localhost:4200"
echo -e "  ${GREEN}Admin Panel:${NC}    http://localhost:4300"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

cd "$PROJECT_ROOT"
npm run dev

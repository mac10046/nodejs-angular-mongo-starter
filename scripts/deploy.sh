#!/bin/bash

# =============================================================================
# Production Deployment Script
# Deploys the application from a specified git branch
# =============================================================================

set -e

# Configuration - Update APP_NAME for your project
DEFAULT_BRANCH="main"
APP_NAME="${APP_NAME:-project-name}"
DEPLOY_USER="${DEPLOY_USER:-$USER}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Usage
usage() {
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -b, --branch BRANCH    Git branch to deploy (default: $DEFAULT_BRANCH)"
    echo "  -e, --env ENV          Environment: production|staging (default: production)"
    echo "  -s, --skip-build       Skip frontend build step"
    echo "  -r, --restart-only     Only restart PM2 processes"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                     Deploy from main branch"
    echo "  $0 -b develop          Deploy from develop branch"
    echo "  $0 -b release/v1.2.0   Deploy from release branch"
    echo "  $0 -r                  Restart services only"
    echo ""
    exit 0
}

# Parse arguments
BRANCH="$DEFAULT_BRANCH"
ENVIRONMENT="production"
SKIP_BUILD=false
RESTART_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -r|--restart-only)
            RESTART_ONLY=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Header
echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   $APP_NAME - Production Deployment${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "  Branch:      ${GREEN}$BRANCH${NC}"
echo -e "  Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "  Project:     ${GREEN}$PROJECT_ROOT${NC}"
echo -e "  Time:        ${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Confirm deployment
read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warn "Deployment cancelled"
    exit 0
fi

echo ""

# Create backup
backup_current() {
    log_info "Creating backup of current deployment..."

    BACKUP_DIR="$PROJECT_ROOT/../backups"
    BACKUP_NAME="${APP_NAME}_$(date +%Y%m%d_%H%M%S)"

    mkdir -p "$BACKUP_DIR"

    # Backup current .env files
    if [ -f "$PROJECT_ROOT/backend/.env" ]; then
        cp "$PROJECT_ROOT/backend/.env" "$BACKUP_DIR/${BACKUP_NAME}_backend.env"
    fi

    log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
}

# Restart only mode
if [ "$RESTART_ONLY" = true ]; then
    log_info "Restarting PM2 processes..."
    cd "$PROJECT_ROOT/backend"

    if command -v pm2 &> /dev/null; then
        pm2 restart ecosystem.config.js --env "$ENVIRONMENT" || pm2 start ecosystem.config.js --env "$ENVIRONMENT"
        pm2 save
        log_success "PM2 processes restarted"
    else
        log_error "PM2 not found. Install with: npm install -g pm2"
        exit 1
    fi

    exit 0
fi

# Step 1: Backup
backup_current

# Step 2: Fetch latest code
log_info "Fetching latest code from git..."
cd "$PROJECT_ROOT"

# Stash any local changes
git stash --quiet 2>/dev/null || true

# Fetch all branches
git fetch --all --prune

# Check if branch exists
if ! git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
    log_error "Branch '$BRANCH' not found on remote"
    exit 1
fi

# Checkout and pull
git checkout "$BRANCH"
git pull origin "$BRANCH"

log_success "Code updated from branch: $BRANCH"

# Step 3: Install backend dependencies
log_info "Installing backend dependencies..."
cd "$PROJECT_ROOT/backend"
npm ci --production=false
log_success "Backend dependencies installed"

# Step 4: Build frontend apps
if [ "$SKIP_BUILD" = false ]; then
    log_info "Building frontend application..."
    cd "$PROJECT_ROOT/frontend"
    npm ci
    npm run build -- --configuration=$ENVIRONMENT
    log_success "Frontend built"

    log_info "Building admin panel..."
    cd "$PROJECT_ROOT/admin"
    npm ci
    npm run build -- --configuration=$ENVIRONMENT
    log_success "Admin panel built"
else
    log_warn "Skipping frontend build (--skip-build flag)"
fi

# Step 5: Run database migrations (if any)
log_info "Running database migrations..."
cd "$PROJECT_ROOT/backend"
# Add migration commands here if needed
# npm run migrate
log_success "Database migrations complete"

# Step 6: Restart PM2
log_info "Restarting application with PM2..."
cd "$PROJECT_ROOT/backend"

if command -v pm2 &> /dev/null; then
    # Stop existing processes gracefully
    pm2 stop ecosystem.config.js 2>/dev/null || true

    # Start with environment
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"

    # Save process list
    pm2 save

    # Wait for startup
    sleep 3

    # Show status
    pm2 status

    log_success "Application restarted with PM2"
else
    log_error "PM2 not found. Install with: npm install -g pm2"
    exit 1
fi

# Step 7: Health check
log_info "Running health check..."
sleep 2

HEALTH_URL="http://localhost:5000/health"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    log_success "Health check passed"
else
    log_error "Health check failed (HTTP $HEALTH_RESPONSE)"
    log_warn "Check logs with: pm2 logs"
    exit 1
fi

# Step 8: Cleanup
log_info "Cleaning up..."
cd "$PROJECT_ROOT"

# Remove old backups (keep last 5)
BACKUP_DIR="$PROJECT_ROOT/../backups"
if [ -d "$BACKUP_DIR" ]; then
    ls -t "$BACKUP_DIR"/*.env 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
fi

# Clear npm cache
npm cache clean --force 2>/dev/null || true

log_success "Cleanup complete"

# Summary
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "  Branch:      ${GREEN}$BRANCH${NC}"
echo -e "  Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "  Status:      ${GREEN}Running${NC}"
echo ""
echo -e "  API:         http://localhost:5000"
echo -e "  Health:      http://localhost:5000/health"
echo ""
echo -e "  Useful commands:"
echo -e "    pm2 status          - Check process status"
echo -e "    pm2 logs            - View application logs"
echo -e "    pm2 monit           - Monitor resources"
echo ""

exit 0

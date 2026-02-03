#!/bin/bash

# =============================================================================
# Deployment Configuration
# Source this file to customize deployment settings
# Update these values for your project
# =============================================================================

# Git Configuration
export DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
export DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"

# Application Configuration - UPDATE THESE FOR YOUR PROJECT
export APP_NAME="${APP_NAME:-project-name}"
export APP_PORT=5000

# PM2 Configuration
export PM2_INSTANCES="${PM2_INSTANCES:-max}"
export PM2_MAX_MEMORY="${PM2_MAX_MEMORY:-512M}"

# Paths - UPDATE THESE FOR YOUR SERVER
export DEPLOY_PATH="${DEPLOY_PATH:-/var/www/$APP_NAME}"
export BACKUP_PATH="${BACKUP_PATH:-/var/backups/$APP_NAME}"
export LOG_PATH="${LOG_PATH:-/var/log/$APP_NAME}"

# Nginx Configuration (if using)
export NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
export DOMAIN_NAME="${DOMAIN_NAME:-example.com}"

# SSL Configuration
export SSL_CERT_PATH="/etc/letsencrypt/live/$DOMAIN_NAME"
export USE_SSL="${USE_SSL:-true}"

# Notification (optional)
export SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
export NOTIFY_ON_DEPLOY="${NOTIFY_ON_DEPLOY:-false}"

# Health Check
export HEALTH_CHECK_URL="http://localhost:$APP_PORT/health"
export HEALTH_CHECK_TIMEOUT=30

# Rollback Configuration
export KEEP_RELEASES=5
export AUTO_ROLLBACK_ON_FAIL="${AUTO_ROLLBACK_ON_FAIL:-true}"

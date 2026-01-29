#!/bin/bash
# ============================================
# TABLETOP MASTERING - SSL CERTIFICATE RENEWAL
# Executed automatically by cron (twice daily)
# ============================================

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

LOG_FILE="/var/log/certbot-renewal.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Checking certificate renewal..."

# Certbot internally handles whether renewal is needed (< 30 days)
# --deploy-hook only runs if actually renewed
if certbot renew --quiet --deploy-hook "docker exec tabletop-nginx nginx -s reload 2>/dev/null || true"; then
    log "Check completed"
else
    log "ERROR: certbot renew failed"
    exit 1
fi

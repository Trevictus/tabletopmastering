#!/bin/bash
# ============================================
# TABLETOP MASTERING - INITIAL SSL CONFIGURATION
# Run ONCE to configure Let's Encrypt
# Usage: sudo ./scripts/setup-ssl.sh
# ============================================

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log_info()    { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}"; }

# Verify root
[[ "$EUID" -ne 0 ]] && { log_error "Run with sudo: sudo $0"; exit 1; }

echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   TABLETOP MASTERING - SSL CONFIGURATION         ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"

# 1. Install certbot if not present
if ! command -v certbot &> /dev/null; then
    log_info "Installing Certbot..."
    apt update -qq && apt install -y certbot
fi
log_success "Certbot available"

# 2. Check existing certificates
if [ -d "${SSL_CERT_PATH}" ]; then
    log_warning "Certificates already exist for ${DOMAIN}"
    read -p "Recreate certificates? (y/N): " response
    [[ ! "$response" =~ ^[Yy]$ ]] && { log_info "Cancelled"; exit 0; }
    certbot delete --cert-name "$DOMAIN" --non-interactive 2>/dev/null || true
fi

# 3. Stop nginx if running
if docker ps --format '{{.Names}}' | grep -q "tabletop-nginx"; then
    log_info "Stopping nginx..."
    docker stop tabletop-nginx 2>/dev/null || true
fi

# 4. Obtain certificate
log_info "Obtaining certificate for ${DOMAIN}..."
certbot certonly --standalone -d "$DOMAIN" --email "$SSL_EMAIL" --agree-tos --non-interactive
log_success "Certificate obtained"

# 5. Generate DH parameters (if not present)
if [ ! -f "$SSL_DHPARAMS" ]; then
    log_info "Generating Diffie-Hellman parameters (1-2 min)..."
    openssl dhparam -out "$SSL_DHPARAMS" 2048
    log_success "DH parameters generated"
fi

# 6. Adjust permissions for Docker
chmod 755 /etc/letsencrypt/live/ /etc/letsencrypt/archive/

# 7. Configure cron for automatic renewal
cat > /etc/cron.d/certbot-tabletop << EOF
# Automatic SSL renewal - TabletopMastering
0 3,15 * * * root ${SCRIPT_DIR}/renew-ssl.sh >> /var/log/certbot-renewal.log 2>&1
EOF
chmod 644 /etc/cron.d/certbot-tabletop
log_success "Automatic renewal configured"

# 8. Summary
echo -e "\n${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ SSL CONFIGURED SUCCESSFULLY               ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "\n${CYAN}Next step:${NC} ./deploy.sh"
echo -e "${CYAN}View certificates:${NC} sudo certbot certificates"
echo ""

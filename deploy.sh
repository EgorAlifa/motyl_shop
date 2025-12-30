#!/usr/bin/env bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Магазин Мотыля - Deployment Script  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Configuration
read -p "Enter domain name (e.g., motyl-shop.ru): " DOMAIN
if [ -z "$DOMAIN" ]; then
  echo -e "${RED}Domain name is required!${NC}"
  exit 1
fi

echo
echo -e "${YELLOW}Configuring domain: $DOMAIN${NC}"

# Generate SSL certificates
echo
echo -e "${GREEN}Step 1: Generating SSL certificates...${NC}"
cd cert

COMMON_NAME=$(echo $DOMAIN | cut -d. -f2-)

# Generate CA
openssl genrsa -out rootCA.key 2048
openssl req -x509 -new -nodes -key rootCA.key -subj "/C=RU/ST=Moscow/L=Moscow/O=None/OU=CA/CN=$COMMON_NAME" -sha256 -days 1024 -out rootCA.pem

# Generate certificate
SUBJECT="/C=RU/ST=Moscow/L=Moscow/O=None/CN=$DOMAIN"
NUM_OF_DAYS=999
openssl req -new -newkey rsa:2048 -sha256 -nodes -keyout private.key -subj "$SUBJECT" -out device.csr

# Create v3 extension file
echo "authorityKeyIdentifier=keyid,issuer" > _v3.ext
echo "basicConstraints=CA:FALSE" >> _v3.ext
echo "keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment" >> _v3.ext
echo "subjectAltName = @alt_names" >> _v3.ext
echo "[alt_names]" >> _v3.ext
echo "DNS.1 = $DOMAIN" >> _v3.ext
echo "DNS.2 = *.$COMMON_NAME" >> _v3.ext

# Sign certificate
openssl x509 -req -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out endpoint.crt -days $NUM_OF_DAYS -sha256 -extfile ./_v3.ext

# Create fullchain
cat endpoint.crt >> fullchain.crt
cat rootCA.pem >> fullchain.crt

# Cleanup temp files
rm -f _v3.ext device.csr endpoint.crt rootCA.srl

echo -e "${GREEN}SSL certificates generated successfully!${NC}"
echo -e "${YELLOW}Note: These are self-signed certificates for testing.${NC}"
echo -e "${YELLOW}For production, replace with real certificates (Let's Encrypt, etc.)${NC}"
echo

cd ..

# Create .env file
echo -e "${GREEN}Step 2: Creating .env file...${NC}"

if [ -f .env ]; then
  echo -e "${YELLOW}.env file already exists. Backing up to .env.backup${NC}"
  cp .env .env.backup
fi

# Collect configuration
read -p "Enter SMTP host (default: smtp.gmail.com): " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}

read -p "Enter SMTP port (default: 587): " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}

read -p "Enter SMTP user (email): " SMTP_USER
read -sp "Enter SMTP password: " SMTP_PASSWORD
echo

read -p "Enter admin email for notifications: " ADMIN_EMAIL
read -sp "Enter admin panel password: " ADMIN_PASSWORD
echo

# Generate random secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL="postgresql://motyluser:motylpass@postgres:5432/motylshop"

# SMTP Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=$SMTP_USER
ADMIN_EMAIL=$ADMIN_EMAIL

# Admin Account
ADMIN_PASSWORD=$ADMIN_PASSWORD

# NextAuth
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://$DOMAIN

# Domain
DOMAIN=$DOMAIN
EOF

echo -e "${GREEN}.env file created successfully!${NC}"
echo

# Stop existing containers
echo -e "${GREEN}Step 3: Stopping existing containers (if any)...${NC}"
docker-compose down 2>/dev/null || true
echo

# Build and start containers
echo -e "${GREEN}Step 4: Building and starting Docker containers...${NC}"
docker-compose up -d --build

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${YELLOW}Important information:${NC}"
echo
echo -e "🌐 Store URL: ${GREEN}https://$DOMAIN${NC}"
echo -e "🔐 Admin Panel: ${GREEN}https://$DOMAIN/admin${NC}"
echo
echo -e "Admin credentials:"
echo -e "  Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "  Password: ${GREEN}$ADMIN_PASSWORD${NC}"
echo
echo -e "${YELLOW}Note about SSL certificates:${NC}"
echo -e "Your browser will show a security warning because the certificate is self-signed."
echo -e "This is normal for development/testing."
echo
echo -e "To trust the certificate:"
echo -e "1. Download ${GREEN}cert/rootCA.pem${NC}"
echo -e "2. Import it to your browser/system as a trusted root CA"
echo
echo -e "For production, replace self-signed certificates with real ones:"
echo -e "- Use Let's Encrypt (free)"
echo -e "- Or obtain certificates from a trusted CA"
echo -e "- Place them in ${GREEN}cert/fullchain.crt${NC} and ${GREEN}cert/private.key${NC}"
echo
echo -e "${YELLOW}Checking container status...${NC}"
echo
docker-compose ps
echo
echo -e "${GREEN}To view logs: ${NC}docker-compose logs -f"
echo -e "${GREEN}To stop: ${NC}docker-compose down"
echo -e "${GREEN}To restart: ${NC}docker-compose restart"
echo

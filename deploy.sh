#!/usr/bin/env bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Магазин Мотыля - Deployment Script  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if running as root for installation
if [ "$EUID" -ne 0 ] && ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker not found. Will need sudo privileges to install.${NC}"
fi

# Function to check if command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to install Docker on Ubuntu/Debian
install_docker() {
  echo -e "${BLUE}Installing Docker...${NC}"

  # Update package index
  sudo apt-get update

  # Install prerequisites
  sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

  # Add Docker's official GPG key
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

  # Set up repository
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  # Install Docker Engine
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  # Add current user to docker group
  sudo usermod -aG docker $USER

  echo -e "${GREEN}Docker installed successfully!${NC}"
  echo -e "${YELLOW}Note: You may need to log out and back in for group changes to take effect.${NC}"
}

# Function to install Docker Compose standalone (if needed)
install_docker_compose() {
  echo -e "${BLUE}Installing Docker Compose...${NC}"

  # Get latest version
  COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)

  # Download and install
  sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose

  echo -e "${GREEN}Docker Compose installed successfully!${NC}"
}

# Check and install dependencies
echo -e "${BLUE}Checking dependencies...${NC}"
echo

# Check for required tools
MISSING_DEPS=()

if ! command_exists git; then
  MISSING_DEPS+=("git")
fi

if ! command_exists curl; then
  MISSING_DEPS+=("curl")
fi

if ! command_exists openssl; then
  MISSING_DEPS+=("openssl")
fi

# Install missing basic dependencies
if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
  echo -e "${YELLOW}Installing missing dependencies: ${MISSING_DEPS[*]}${NC}"
  sudo apt-get update
  sudo apt-get install -y "${MISSING_DEPS[@]}"
  echo -e "${GREEN}Dependencies installed!${NC}"
  echo
fi

# Track if we need to use sudo for Docker
NEED_DOCKER_SUDO=false

# Check for Docker
if ! command_exists docker; then
  echo -e "${YELLOW}Docker is not installed.${NC}"
  read -p "Do you want to install Docker automatically? (y/n): " install_docker_answer
  # Trim whitespace and convert to lowercase
  install_docker_answer=$(echo "$install_docker_answer" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
  if [[ "$install_docker_answer" == "y" || "$install_docker_answer" == "yes" ]]; then
    install_docker
    NEED_DOCKER_SUDO=true
    # After installing Docker, we need to use newgrp or sg to activate the group
    # For now, we'll use sudo for the first run
    echo -e "${YELLOW}Using sudo for Docker commands in this session...${NC}"
    echo
  else
    echo -e "${RED}Docker is required to run this application.${NC}"
    echo -e "${YELLOW}Please install Docker manually: https://docs.docker.com/engine/install/ubuntu/${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Docker is installed${NC}"

  # Check if current user can use Docker without sudo
  if ! docker info &> /dev/null 2>&1; then
    echo -e "${YELLOW}Current user cannot access Docker without sudo.${NC}"
    echo -e "${YELLOW}Adding user to docker group...${NC}"
    sudo usermod -aG docker $USER
    NEED_DOCKER_SUDO=true
    echo -e "${YELLOW}Using sudo for Docker commands in this session...${NC}"
    echo
  fi
fi

# Check for Docker Compose
if ! command_exists docker-compose && ! docker compose version &> /dev/null 2>&1; then
  echo -e "${YELLOW}Docker Compose is not installed.${NC}"
  read -p "Do you want to install Docker Compose automatically? (y/n): " install_compose_answer
  # Trim whitespace and convert to lowercase
  install_compose_answer=$(echo "$install_compose_answer" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
  if [[ "$install_compose_answer" == "y" || "$install_compose_answer" == "yes" ]]; then
    install_docker_compose
    echo
  else
    echo -e "${RED}Docker Compose is required to run this application.${NC}"
    echo -e "${YELLOW}Please install Docker Compose manually: https://docs.docker.com/compose/install/${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Docker Compose is installed${NC}"
fi

# Check if Docker daemon is running
DOCKER_CMD="docker"
if [ "$NEED_DOCKER_SUDO" = true ]; then
  DOCKER_CMD="sudo docker"
fi

if ! $DOCKER_CMD info &> /dev/null; then
  echo -e "${YELLOW}Docker daemon is not running. Starting Docker...${NC}"
  sudo systemctl start docker
  sudo systemctl enable docker
  echo -e "${GREEN}Docker daemon started!${NC}"
else
  echo -e "${GREEN}✓ Docker daemon is running${NC}"
fi

echo
echo -e "${GREEN}All dependencies are satisfied!${NC}"
echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Starting Configuration  ${NC}"
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

read -p "Enter admin email: " ADMIN_EMAIL
read -sp "Enter admin password: " ADMIN_PASSWORD
echo

# Generate random secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
KEYCLOAK_CLIENT_SECRET=$(openssl rand -base64 32)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 24)

echo -e "${YELLOW}Generated secure secrets for JWT and Keycloak${NC}"

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

# Admin Account (legacy - для первоначальной настройки)
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Keycloak Configuration
KEYCLOAK_URL=http://keycloak:8080/auth
NEXT_PUBLIC_KEYCLOAK_URL=https://$DOMAIN/auth
KEYCLOAK_REALM=motyl-shop
KEYCLOAK_CLIENT_ID=motyl-admin
KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET
KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD

# NextAuth / JWT Security
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://$DOMAIN

# Domain
DOMAIN=$DOMAIN
EOF

echo -e "${GREEN}.env file created successfully!${NC}"
echo

# Determine docker-compose command
if command_exists docker-compose; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

# Add sudo prefix if needed
if [ "$NEED_DOCKER_SUDO" = true ]; then
  DOCKER_COMPOSE="sudo $DOCKER_COMPOSE"
fi

# Stop existing containers
echo -e "${GREEN}Step 3: Stopping existing containers (if any)...${NC}"
$DOCKER_COMPOSE down 2>/dev/null || true
echo

# Recreate Keycloak database so it creates admin user on first boot
echo -e "${GREEN}Step 3.5: Preparing Keycloak database...${NC}"
# Start only postgres to recreate keycloak database
$DOCKER_COMPOSE up -d postgres
echo -n "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if $DOCKER_CMD exec motyl_postgres pg_isready -U motyluser -d motylshop > /dev/null 2>&1; then
    break
  fi
  echo -n "."
  sleep 1
done
echo " Ready!"

# Drop and recreate keycloak database so Keycloak will create admin user
echo -e "${YELLOW}Recreating keycloak database for fresh admin user creation...${NC}"
$DOCKER_CMD exec motyl_postgres psql -U motyluser -d motylshop -c "DROP DATABASE IF EXISTS keycloak;" 2>/dev/null || true
$DOCKER_CMD exec motyl_postgres psql -U motyluser -d motylshop -c "CREATE DATABASE keycloak;" 2>/dev/null || true
$DOCKER_CMD exec motyl_postgres psql -U motyluser -d motylshop -c "GRANT ALL PRIVILEGES ON DATABASE keycloak TO motyluser;" 2>/dev/null || true
echo -e "${GREEN}✓ Keycloak database recreated${NC}"
echo

# Build and start containers
echo -e "${GREEN}Step 4: Building and starting Docker containers...${NC}"
echo -e "${YELLOW}This may take several minutes on first run...${NC}"
$DOCKER_COMPOSE up -d --build

echo
echo -e "${GREEN}Containers started! Waiting for services to be ready...${NC}"
echo

# Wait for Keycloak to be healthy
echo -e "${YELLOW}Step 5: Waiting for Keycloak to be ready (this may take 1-2 minutes)...${NC}"
KEYCLOAK_READY=0
for i in {1..60}; do
  if $DOCKER_CMD exec motyl_app curl -sf http://keycloak:8080/auth/ > /dev/null 2>&1; then
    KEYCLOAK_READY=1
    break
  fi
  echo -n "."
  sleep 2
done
echo

if [ $KEYCLOAK_READY -eq 1 ]; then
  echo -e "${GREEN}✓ Keycloak is ready!${NC}"
  echo

  # Read actual Keycloak admin password from the running container
  echo -e "${YELLOW}Reading Keycloak admin password from container...${NC}"
  ACTUAL_KC_PASSWORD=$($DOCKER_CMD exec motyl_keycloak env | grep KEYCLOAK_ADMIN_PASSWORD | cut -d'=' -f2)

  if [ -z "$ACTUAL_KC_PASSWORD" ]; then
    echo -e "${RED}Failed to read Keycloak admin password from container!${NC}"
    ACTUAL_KC_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD
    echo -e "${YELLOW}Using generated password from .env: ${ACTUAL_KC_PASSWORD}${NC}"
  else
    echo -e "${GREEN}Successfully read password from container: ${ACTUAL_KC_PASSWORD}${NC}"
  fi

  # Initialize Keycloak realm
  echo -e "${GREEN}Step 6: Initializing Keycloak realm and client...${NC}"
  INIT_OUTPUT=$($DOCKER_CMD exec -e KEYCLOAK_URL=http://keycloak:8080/auth \
    -e KEYCLOAK_ADMIN=admin \
    -e KEYCLOAK_ADMIN_PASSWORD="$ACTUAL_KC_PASSWORD" \
    -e KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET \
    -e DOMAIN=$DOMAIN \
    motyl_app bash /app/scripts/init-keycloak.sh 2>&1)

  INIT_EXIT_CODE=$?

  if [ $INIT_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}✗ Failed to initialize Keycloak realm!${NC}"
    echo -e "${YELLOW}Output:${NC}"
    echo "$INIT_OUTPUT"
    exit 1
  fi

  echo "$INIT_OUTPUT"
  echo
  echo -e "${GREEN}✓ Keycloak realm configured successfully!${NC}"

  # Create first super admin user automatically
  echo
  echo -e "${GREEN}Step 7: Creating first super admin user...${NC}"

  # Get admin token
  ADMIN_TOKEN=$($DOCKER_CMD exec motyl_app curl -s -X POST "http://keycloak:8080/auth/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "username=admin" \
    --data-urlencode "password=$ACTUAL_KC_PASSWORD" \
    --data-urlencode "grant_type=password" \
    --data-urlencode "client_id=admin-cli" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

  if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
    # Create user
    USER_ID=$($DOCKER_CMD exec motyl_app curl -s -X POST "http://keycloak:8080/auth/admin/realms/motyl-shop/users" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "'"$ADMIN_EMAIL"'",
        "email": "'"$ADMIN_EMAIL"'",
        "emailVerified": true,
        "enabled": true,
        "firstName": "Super",
        "lastName": "Admin"
      }' -w "%{http_code}" -o /dev/null 2>&1)

    if [ "$USER_ID" = "201" ] || [ "$USER_ID" = "409" ]; then
      # Get user ID
      USER_ID=$($DOCKER_CMD exec motyl_app curl -s -X GET "http://keycloak:8080/auth/admin/realms/motyl-shop/users?email=$ADMIN_EMAIL" \
        -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

      if [ -n "$USER_ID" ]; then
        # Set password
        $DOCKER_CMD exec motyl_app curl -s -X PUT "http://keycloak:8080/auth/admin/realms/motyl-shop/users/$USER_ID/reset-password" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{
            "type": "password",
            "value": "'"$ADMIN_PASSWORD"'",
            "temporary": false
          }' > /dev/null 2>&1

        # Get super-admin role ID
        ROLE_ID=$($DOCKER_CMD exec motyl_app curl -s -X GET "http://keycloak:8080/auth/admin/realms/motyl-shop/roles/super-admin" \
          -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

        if [ -n "$ROLE_ID" ]; then
          # Assign super-admin role
          $DOCKER_CMD exec motyl_app curl -s -X POST "http://keycloak:8080/auth/admin/realms/motyl-shop/users/$USER_ID/role-mappings/realm" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d '[{
              "id": "'"$ROLE_ID"'",
              "name": "super-admin"
            }]' > /dev/null 2>&1

          echo -e "${GREEN}✓ Super admin user created successfully!${NC}"
          echo
          echo -e "${GREEN}Вы можете сразу войти в админку:${NC}"
          echo -e "  URL: ${GREEN}https://$DOMAIN/admin${NC}"
          echo -e "  Email: ${GREEN}$ADMIN_EMAIL${NC}"
          echo -e "  Пароль: ${GREEN}$ADMIN_PASSWORD${NC}"
        else
          echo -e "${YELLOW}⚠ Не удалось назначить роль super-admin.${NC}"
        fi
      else
        echo -e "${YELLOW}⚠ Не удалось получить ID пользователя.${NC}"
      fi
    else
      echo -e "${YELLOW}⚠ Не удалось создать пользователя (HTTP: $USER_ID).${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ Не удалось получить токен администратора Keycloak.${NC}"
    echo -e "${YELLOW}Создайте первого пользователя вручную (см. инструкцию ниже).${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Keycloak is taking longer than expected to start.${NC}"
  echo -e "${YELLOW}You can initialize it manually later with:${NC}"
  echo -e "${GREEN}$DOCKER_CMD exec motyl_app bash /app/scripts/init-keycloak.sh${NC}"
fi

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${YELLOW}Important information:${NC}"
echo
echo -e "🌐 Store URL: ${GREEN}https://$DOMAIN${NC}"
echo -e "🔐 Admin Panel: ${GREEN}https://$DOMAIN/admin${NC}"
echo -e "🔑 Keycloak Admin Console: ${GREEN}https://$DOMAIN/auth/admin${NC}"
echo
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  🚨 NEXT STEP: Create First User  🚨${NC}"
echo -e "${YELLOW}========================================${NC}"
echo
echo -e "${RED}ВАЖНО: Авторизация теперь через Keycloak!${NC}"
echo -e "Вам нужно создать первого пользователя в Keycloak."
echo
echo -e "${GREEN}Вариант 1: Через Keycloak Admin Console${NC}"
echo -e "1. Откройте: ${GREEN}https://$DOMAIN/auth/admin${NC}"
echo -e "2. Логин: ${GREEN}admin${NC}"
echo -e "3. Пароль: ${GREEN}$KEYCLOAK_ADMIN_PASSWORD${NC}"
echo -e "   ${YELLOW}(сохраните этот пароль!)${NC}"
echo -e "4. В левом верхнем углу выберите realm: ${GREEN}motyl-shop${NC}"
echo -e "5. Перейдите: Users → Add user"
echo -e "6. Заполните:"
echo -e "   - Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "   - Email verified: ${GREEN}ON${NC}"
echo -e "   - Enabled: ${GREEN}ON${NC}"
echo -e "7. Нажмите Create"
echo -e "8. Перейдите на вкладку Credentials"
echo -e "9. Set password: ${GREEN}$ADMIN_PASSWORD${NC}"
echo -e "   - Temporary: ${GREEN}OFF${NC}"
echo -e "10. Перейдите на вкладку Role mappings"
echo -e "11. Assign role: ${GREEN}super-admin${NC}"
echo
echo -e "${GREEN}Вариант 2: Через команду (после входа в админку первый раз)${NC}"
echo -e "Перейдите: ${GREEN}https://$DOMAIN/admin/keycloak-users${NC}"
echo
echo -e "${YELLOW}Сохраните эти учетные данные:${NC}"
echo
echo -e "  ${BLUE}Keycloak Admin:${NC}"
echo -e "    Логин: ${GREEN}admin${NC}"
echo -e "    Пароль: ${GREEN}${ACTUAL_KC_PASSWORD:-$KEYCLOAK_ADMIN_PASSWORD}${NC}"
echo
echo -e "  ${BLUE}Ваш Super Admin:${NC}"
echo -e "    Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "    Пароль: ${GREEN}$ADMIN_PASSWORD${NC}"
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
$DOCKER_COMPOSE ps
echo
echo -e "${GREEN}To view logs: ${NC}$DOCKER_COMPOSE logs -f"
echo -e "${GREEN}To stop: ${NC}$DOCKER_COMPOSE down"
echo -e "${GREEN}To restart: ${NC}$DOCKER_COMPOSE restart"
echo -e "${GREEN}Management menu: ${NC}./manage.sh"

if [ "$NEED_DOCKER_SUDO" = true ]; then
  echo
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Important: Docker group membership${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo -e "Your user has been added to the 'docker' group."
  echo -e "To use Docker without sudo in future sessions:"
  echo -e "1. Log out and log back in, OR"
  echo -e "2. Run: ${GREEN}newgrp docker${NC}"
  echo -e ""
  echo -e "For this session, Docker commands use sudo automatically."
fi

echo

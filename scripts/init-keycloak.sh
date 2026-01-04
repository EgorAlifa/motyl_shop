#!/bin/bash
set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://keycloak:8080/auth}"
ADMIN_USER="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin123}"
REALM_NAME="motyl-shop"
CLIENT_ID="motyl-admin"
CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-your-client-secret}"
DOMAIN="${DOMAIN:-localhost}"

echo "Waiting for Keycloak to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until curl -sf "${KEYCLOAK_URL}/" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Keycloak did not become ready in time"
    exit 1
  fi
  echo "Waiting for Keycloak... (${RETRY_COUNT}/${MAX_RETRIES})"
  sleep 5
done

echo "Keycloak is ready!"

# Get admin token
echo "Getting admin access token..."
echo "Using username: ${ADMIN_USER}"
echo "Using password: ${ADMIN_PASSWORD}"
TOKEN_RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=${ADMIN_USER}" \
  --data-urlencode "password=${ADMIN_PASSWORD}" \
  --data-urlencode "grant_type=password" \
  --data-urlencode "client_id=admin-cli")

echo "Token response: $TOKEN_RESPONSE"

ADMIN_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to get admin token. Check Keycloak admin credentials."
  exit 1
fi

echo "Admin token obtained successfully"

# Create realm
echo "Creating realm: ${REALM_NAME}..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'"${REALM_NAME}"'",
    "enabled": true,
    "sslRequired": "none",
    "registrationAllowed": false,
    "loginWithEmailAllowed": true,
    "duplicateEmailsAllowed": false,
    "resetPasswordAllowed": true,
    "editUsernameAllowed": false,
    "bruteForceProtected": true
  }' || echo "Realm may already exist"

echo "Realm created/updated"

# Create or update client
echo "Creating/updating client: ${CLIENT_ID}..."

# Check if client exists and get its ID
CLIENT_UUID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.[0].id // empty')

CLIENT_CONFIG='{
  "clientId": "'"${CLIENT_ID}"'",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "'"${CLIENT_SECRET}"'",
  "rootUrl": "https://'"${DOMAIN}"'",
  "baseUrl": "/admin",
  "redirectUris": ["https://'"${DOMAIN}"'/*"],
  "webOrigins": ["https://'"${DOMAIN}"'"],
  "protocol": "openid-connect",
  "publicClient": false,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": true,
  "authorizationServicesEnabled": true,
  "fullScopeAllowed": true,
  "attributes": {
    "post.logout.redirect.uris": "https://'"${DOMAIN}"'/*"
  }
}'

if [ -n "$CLIENT_UUID" ]; then
  echo "Client exists (UUID: ${CLIENT_UUID}), updating..."
  curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$CLIENT_CONFIG"
  echo "Client updated with redirectUris: [https://${DOMAIN}/*]"
else
  echo "Creating new client..."
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$CLIENT_CONFIG"
  echo "Client created with redirectUris: [https://${DOMAIN}/*]"
fi

# Configure Service Account with realm-management roles
echo ""
echo "Configuring Service Account for Admin API access..."

# Get client UUID if not already set
if [ -z "$CLIENT_UUID" ]; then
  CLIENT_UUID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.[0].id // empty')
fi

if [ -n "$CLIENT_UUID" ]; then
  echo "Client UUID: ${CLIENT_UUID}"

  # Get service account user ID
  echo "Getting service account user..."
  SERVICE_ACCOUNT_USER=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/service-account-user" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json")

  SERVICE_ACCOUNT_ID=$(echo "$SERVICE_ACCOUNT_USER" | jq -r '.id // empty')

  if [ -n "$SERVICE_ACCOUNT_ID" ]; then
    echo "Service account user ID: ${SERVICE_ACCOUNT_ID}"

    # Get realm-management client UUID
    REALM_MGMT_CLIENT_UUID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=realm-management" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[0].id // empty')

    if [ -n "$REALM_MGMT_CLIENT_UUID" ]; then
      echo "Realm-management client UUID: ${REALM_MGMT_CLIENT_UUID}"

      # Get available roles from realm-management client
      echo "Fetching available realm-management roles..."
      AVAILABLE_ROLES=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${SERVICE_ACCOUNT_ID}/role-mappings/clients/${REALM_MGMT_CLIENT_UUID}/available" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json")

      # Extract roles we need: view-users, manage-users, query-users, view-realm, manage-realm
      ROLES_TO_ASSIGN=$(echo "$AVAILABLE_ROLES" | jq '[.[] | select(.name == "view-users" or .name == "manage-users" or .name == "query-users" or .name == "view-realm" or .name == "manage-realm")]')

      ROLES_COUNT=$(echo "$ROLES_TO_ASSIGN" | jq 'length')

      if [ "$ROLES_COUNT" -gt 0 ]; then
        echo "Assigning ${ROLES_COUNT} realm-management roles to service account..."
        echo "Roles: $(echo "$ROLES_TO_ASSIGN" | jq -r '.[].name' | tr '\n' ', ' | sed 's/,$//')"

        # Assign roles to service account
        ASSIGN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${SERVICE_ACCOUNT_ID}/role-mappings/clients/${REALM_MGMT_CLIENT_UUID}" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "$ROLES_TO_ASSIGN")

        HTTP_CODE=$(echo "$ASSIGN_RESPONSE" | tail -n 1)

        if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
          echo "✓ Service Account configured successfully!"
          echo "✓ Granted roles: view-users, manage-users, query-users, view-realm, manage-realm"
        else
          echo "⚠ Warning: Failed to assign roles (HTTP ${HTTP_CODE})"
          echo "Response: $(echo "$ASSIGN_RESPONSE" | head -n -1)"
        fi
      else
        echo "⚠ Warning: No realm-management roles available to assign"
        echo "Roles may already be assigned or unavailable"
      fi
    else
      echo "⚠ Warning: realm-management client not found"
    fi
  else
    echo "⚠ Warning: Service account user not found"
    echo "Make sure serviceAccountsEnabled is true for the client"
  fi
else
  echo "⚠ Warning: Client UUID not found, skipping service account configuration"
fi

echo ""

# Create roles
echo "Creating roles..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "super-admin",
    "description": "Super Administrator with full access"
  }' || echo "Role super-admin may already exist"

curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin",
    "description": "Administrator with limited access"
  }' || echo "Role admin may already exist"

echo "Roles created/updated"

# Create first super-admin user if ADMIN_EMAIL and ADMIN_PASSWORD are provided
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Creating first super-admin user: ${ADMIN_EMAIL}..."

  # Check if user already exists
  EXISTING_USER=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?email=${ADMIN_EMAIL}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.[0].id // empty')

  if [ -n "$EXISTING_USER" ]; then
    echo "User ${ADMIN_EMAIL} already exists (ID: ${EXISTING_USER}), skipping creation"
  else
    # Create user
    USER_RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "'"${ADMIN_EMAIL}"'",
        "email": "'"${ADMIN_EMAIL}"'",
        "enabled": true,
        "emailVerified": true
      }')

    # Get created user ID
    USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?email=${ADMIN_EMAIL}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[0].id')

    if [ -n "$USER_ID" ]; then
      # Set password
      curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/reset-password" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
          "type": "password",
          "value": "'"${ADMIN_PASSWORD}"'",
          "temporary": false
        }'

      # Get super-admin role ID
      SUPER_ADMIN_ROLE=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/super-admin" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json")

      ROLE_ID=$(echo "$SUPER_ADMIN_ROLE" | jq -r '.id')
      ROLE_NAME=$(echo "$SUPER_ADMIN_ROLE" | jq -r '.name')

      # Assign super-admin role
      curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '[{
          "id": "'"${ROLE_ID}"'",
          "name": "'"${ROLE_NAME}"'"
        }]'

      echo "Super-admin user created successfully!"
      echo "  Email: ${ADMIN_EMAIL}"
      echo "  Password: (as provided)"
    else
      echo "Failed to create user"
    fi
  fi
else
  echo "ADMIN_EMAIL or ADMIN_PASSWORD not provided, skipping user creation"
fi

echo ""
echo "Keycloak initialization completed successfully!"
echo ""
echo "Keycloak admin console: ${KEYCLOAK_URL}/admin"
echo "Username: ${ADMIN_USER}"
echo "Realm: ${REALM_NAME}"
echo "Client ID: ${CLIENT_ID}"
echo ""
if [ -n "$ADMIN_EMAIL" ]; then
  echo "Ваш Super Admin:"
  echo "  Email: ${ADMIN_EMAIL}"
  echo "  Пароль: (as entered during setup)"
fi

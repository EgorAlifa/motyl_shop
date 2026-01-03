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
echo "Checking: ${KEYCLOAK_URL}/realms/master"
until curl -sf "${KEYCLOAK_URL}/realms/master" > /dev/null 2>&1; do
  echo "Waiting for Keycloak..."
  sleep 5
done

echo "Keycloak is ready!"

# Get admin token
echo "Getting admin access token..."
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

# Create client
echo "Creating client: ${CLIENT_ID}..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'"${CLIENT_ID}"'",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "secret": "'"${CLIENT_SECRET}"'",
    "rootUrl": "https://'"${DOMAIN}"'",
    "baseUrl": "/admin",
    "redirectUris": [
      "https://'"${DOMAIN}"'/admin/callback",
      "http://localhost:3000/admin/callback",
      "http://127.0.0.1:3000/admin/callback"
    ],
    "webOrigins": [
      "https://'"${DOMAIN}"'",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "protocol": "openid-connect",
    "publicClient": false,
    "standardFlowEnabled": true,
    "implicitFlowEnabled": false,
    "directAccessGrantsEnabled": false,
    "serviceAccountsEnabled": true,
    "authorizationServicesEnabled": false,
    "fullScopeAllowed": true,
    "attributes": {
      "post.logout.redirect.uris": "https://'"${DOMAIN}"'/+##http://localhost:3000/+"
    }
  }' || echo "Client may already exist"

echo "Client created/updated"

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

echo "Keycloak initialization completed successfully!"
echo ""
echo "Keycloak admin console: ${KEYCLOAK_URL}/admin"
echo "Username: ${ADMIN_USER}"
echo "Realm: ${REALM_NAME}"
echo "Client ID: ${CLIENT_ID}"

#!/bin/bash
set -e

# Grant CREATEDB privilege to motyluser so Keycloak can create its own database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER $POSTGRES_USER CREATEDB;
EOSQL

echo "Granted CREATEDB privilege to $POSTGRES_USER"

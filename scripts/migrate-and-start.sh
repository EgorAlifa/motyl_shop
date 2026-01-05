#!/bin/sh
set -e

echo "Starting migration process..."

# Check if _prisma_migrations table exists
MIGRATIONS_TABLE_EXISTS=$(psql $DATABASE_URL -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations');")

if [ "$MIGRATIONS_TABLE_EXISTS" = "f" ]; then
    echo "No migration history found. Database was created with 'prisma db push'."
    echo "Creating migrations table and applying schema transformation..."

    # Create the migrations tracking table manually
    psql $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS _prisma_migrations (
        id VARCHAR(36) PRIMARY KEY NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMPTZ,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
    );"

    echo "Migrations table created. Now applying schema migration..."

    # Try to deploy migrations
    if ! prisma migrate deploy; then
        echo "Migrate deploy failed. Applying SQL migration manually..."

        # Apply the migration SQL directly
        psql $DATABASE_URL -f /app/prisma/migrations/20260105_category_to_relation/migration.sql

        # Mark migration as applied
        MIGRATION_ID=$(cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 36 | head -n 1)
        psql $DATABASE_URL -c "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count) VALUES ('$MIGRATION_ID', '$(sha256sum /app/prisma/migrations/20260105_category_to_relation/migration.sql | cut -d\" \" -f1)', now(), '20260105_category_to_relation', 1);"

        echo "Migration applied successfully!"
    fi
else
    echo "Migration history exists. Deploying pending migrations..."
    prisma migrate deploy
fi

echo "Running database seed..."
prisma db seed

echo "Starting application..."
exec node server.js

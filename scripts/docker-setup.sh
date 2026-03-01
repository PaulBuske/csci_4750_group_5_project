#!/bin/sh
# Runs inside the nextjs container on first boot.
# Applies all pending Prisma migrations then seeds the database.
# Called by the 'migrate' service in docker-compose.yaml.

set -e

echo "==> Running Prisma migrations..."
npx prisma migrate deploy

echo "==> Seeding database..."
npx tsx prisma/seed.ts

echo "==> Setup complete."


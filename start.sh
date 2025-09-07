#!/bin/sh
set -e

echo "Starting application deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "DATABASE_URL is configured"

# Generate Prisma client (in case it's needed)
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Starting server..."
exec node dist/server.js

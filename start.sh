#!/bin/sh
set -e

echo "Starting application deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "DATABASE_URL is configured"

# Since we can't write to node_modules/prisma, we'll skip db push in production
# The database should be set up separately on Railway
echo "Skipping database migrations (handled separately on Railway)"

echo "Starting server..."
exec node dist/server.js

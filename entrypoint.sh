#!/bin/sh
set -e

echo ">>> Syncing database schema (prisma db push)..."
npx prisma db push --skip-generate

echo ">>> Starting finsight-backend..."
exec node src/server.js

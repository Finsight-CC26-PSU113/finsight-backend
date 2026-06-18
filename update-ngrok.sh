#!/bin/bash
# ============================================================
# update-ngrok.sh — Update AI_SERVICE_URL dan restart backend
#
# Usage:
#   ./update-ngrok.sh https://xxxx-xxx.ngrok-free.app
#
# Jalankan dari direktori yang sama dengan file .env
# ============================================================

set -e

NEW_URL="${1}"

if [ -z "$NEW_URL" ]; then
  echo "Usage: ./update-ngrok.sh <new-ngrok-url>"
  echo "Contoh: ./update-ngrok.sh https://abcd-1234.ngrok-free.app"
  exit 1
fi

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: File .env tidak ditemukan di direktori ini."
  exit 1
fi

# Backup .env sebelum diubah
cp "$ENV_FILE" "$ENV_FILE.bak"

# Ganti AI_SERVICE_URL (buat entry baru jika belum ada)
if grep -q "^AI_SERVICE_URL=" "$ENV_FILE"; then
  sed -i "s|^AI_SERVICE_URL=.*|AI_SERVICE_URL=${NEW_URL}|" "$ENV_FILE"
else
  echo "AI_SERVICE_URL=${NEW_URL}" >> "$ENV_FILE"
fi

echo "✓ AI_SERVICE_URL diperbarui ke: ${NEW_URL}"

# Restart container jika Docker digunakan
CONTAINER_NAME="${CONTAINER_NAME:-finsight-backend}"

if command -v docker &> /dev/null && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker restart "$CONTAINER_NAME"
  echo "✓ Container '${CONTAINER_NAME}' berhasil di-restart."
elif command -v docker &> /dev/null; then
  echo "⚠ Container '${CONTAINER_NAME}' tidak ditemukan atau tidak berjalan."
  echo "  Jalankan manual: docker restart <nama-container>"
fi

echo ""
echo "Selesai. AI_SERVICE_URL sekarang: ${NEW_URL}"

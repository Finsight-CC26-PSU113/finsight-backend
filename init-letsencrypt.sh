#!/bin/bash
# ============================================================
# init-letsencrypt.sh
# Jalankan SEKALI di server untuk mendapatkan SSL certificate
# dari Let's Encrypt sebelum menjalankan stack secara penuh.
#
# Cara pakai:
#   chmod +x init-letsencrypt.sh
#   ./init-letsencrypt.sh
# ============================================================

set -e

DOMAIN="minionbarbershop.com"
EMAIL="your-email@example.com"   # Ganti dengan email kamu
STAGING=0                         # Ganti ke 1 untuk testing dulu

echo "======================================================"
echo " Inisialisasi Let's Encrypt SSL untuk $DOMAIN"
echo "======================================================"

# 1. Buat direktori yang dibutuhkan
mkdir -p ./certbot/conf/live/$DOMAIN
mkdir -p ./certbot/www

# 2. Buat dummy certificate supaya nginx bisa start
echo ""
echo ">>> [1/4] Membuat dummy certificate sementara..."
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out    /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj   '/CN=localhost'" certbot
echo "    Done."

# 3. Start nginx dengan dummy cert
echo ""
echo ">>> [2/4] Starting nginx..."
docker compose up -d nginx
sleep 3

# 4. Hapus dummy cert
echo ""
echo ">>> [3/4] Menghapus dummy certificate..."
docker compose run --rm --entrypoint "rm -rf /etc/letsencrypt/live/$DOMAIN" certbot

# 5. Request certificate asli dari Let's Encrypt
echo ""
echo ">>> [4/4] Meminta certificate dari Let's Encrypt..."

STAGING_FLAG=""
if [ "$STAGING" == "1" ]; then
  STAGING_FLAG="--staging"
  echo "    (Mode staging — certificate tidak valid di browser)"
fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot \
    -w /var/www/certbot \
    $STAGING_FLAG \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN" certbot

# 6. Reload nginx supaya load cert baru
echo ""
echo ">>> Reload nginx..."
docker compose exec nginx nginx -s reload

echo ""
echo "======================================================"
echo " Selesai! SSL aktif untuk https://$DOMAIN"
echo " Jalankan 'docker compose up -d' untuk start semua service."
echo "======================================================"

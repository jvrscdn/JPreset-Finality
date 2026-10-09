#!/data/data/com.termux/files/usr/bin/bash
# Jalankan JPreset + link publik (Cloudflare Tunnel) sekali perintah.
# Pakai: bash start.sh   (hentikan: tekan CTRL lalu C)

cd "$(dirname "$0")" || exit 1

termux-wake-lock 2>/dev/null

# matikan server lama kalau masih jalan
pkill -f "node server.js" 2>/dev/null
sleep 1

node server.js > server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null; termux-wake-unlock 2>/dev/null; exit' INT TERM EXIT

sleep 2
echo "Server jalan (log: server.log). Menyiapkan link publik..."
echo "Cari baris https://xxxx.trycloudflare.com di bawah ini:"
echo
cloudflared tunnel --url http://localhost:3000

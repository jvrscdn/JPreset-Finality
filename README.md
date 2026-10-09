# JPreset

Website pencari preset Alight Motion dari link postingan TikTok.

Developer: **JavraSX**
Scraper by Zx (https://whatsapp.com/channel/0029VbDLqe7EquiSF4STU13o) · Data: https://amfinder.web.id

## Jalankan lokal

Butuh Node.js 18+ (tanpa dependency, tidak perlu `npm install`).

```
node server.js
```

Buka http://localhost:3000

## Jalankan di Termux + link publik (Cloudflare Tunnel)

```
pkg install nodejs cloudflared
bash start.sh
```

Cari baris `https://xxxx.trycloudflare.com` di layar. Link berubah tiap kali dijalankan ulang.

## Jalankan di VPS (pm2)

```
npm i -g pm2
pm2 start server.js --name jpreset
pm2 save
```

Untuk link publik tetap, pakai Cloudflare Tunnel:

```
pm2 start "cloudflared tunnel run --token TOKEN_KAMU" --name tunnel
pm2 save
```

## Deploy ke Render

1. Upload semua file ini ke repo GitHub (semua di root, tanpa folder).
2. Render → New → Web Service → pilih repo.
3. Build Command: `npm install` | Start Command: `npm start` | Instance: Free.
4. Deploy. (Atau pakai New → Blueprint, `render.yaml` sudah disediakan.)

Endpoint `/health` bisa dipakai UptimeRobot agar server free tier tidak tidur.

## Catatan

Pencarian preset memakai API https://amfinder.web.id. Kalau situs itu mati atau berubah, fitur cari ikut tidak jalan.

Lisensi: MIT

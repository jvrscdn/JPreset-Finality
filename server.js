// Server web sederhana (tanpa dependency) untuk AM Preset Finder.
// Jalankan: node server.js  ->  buka http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const { get_preset_links } = require('./scraper');

const PORT = process.env.PORT || process.env.SERVER_PORT || 3000; // SERVER_PORT = port dari panel Pterodactyl
// index.html boleh di folder yang sama dengan server.js, atau di public/
const INDEX_FILE = fs.existsSync(path.join(__dirname, 'index.html'))
  ? path.join(__dirname, 'index.html')
  : path.join(__dirname, 'public', 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Rate limit sederhana: 10 request / menit per IP
const hits = new Map();
// Bersihkan data rate limit lama tiap menit supaya memori tidak membengkak
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) {
    if (!arr.some((t) => now - t < 60_000)) hits.delete(ip);
  }
}, 60_000).unref();

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 10;
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/find') {
    // Di belakang Cloudflare Tunnel, IP asli ada di cf-connecting-ip
    const ip =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress;
    if (limited(ip)) return sendJson(res, 429, { ok: false, error: 'Terlalu banyak request, coba lagi sebentar.' });

    try {
      const data = await get_preset_links(url.searchParams.get('url'));
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Health check (untuk Render / UptimeRobot)
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  // Halaman utama (hanya index.html yang disajikan)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return fs.readFile(INDEX_FILE, (err, buf) => {
      if (err) {
        res.writeHead(500);
        return res.end('index.html tidak ditemukan');
      }
      res.writeHead(200, {
        'Content-Type': MIME['.html'],
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(buf);
    });
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => console.log(`JPreset (by JavraSX) jalan di http://localhost:${PORT}`));

/**
 * AM Preset Finder Scraper
 * Source: https://amfinder.web.id
 *
 * Scans TikTok video description, bio, comments, and bio-link
 * to extract Alight Motion preset links.
 */

/**
 * Credit By Zx
 * Sumber Kode: https://whatsapp.com/channel/0029VbDLqe7EquiSF4STU13o
 * Note: Kalau Mau Di sher Lagi Minimal Credit atau sumber jangan di hapus dong
 * Website React WhatsApp Gratis:
 * https://react.v1.zfile.web.id/
 */

const BASE_URL = 'https://amfinder.web.id';

function isValidTikTokUrl(url) {
  const trimmed = (url || '').trim();
  return /tiktok\.com/i.test(trimmed) || /^\d{15,}$/.test(trimmed);
}

async function parseSSEStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // simpan baris terakhir yang belum lengkap

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const data = line.slice(5).trim();

        if (currentEvent === 'result') {
          try {
            return JSON.parse(data);
          } catch {
            throw new Error('Unreadable response from server');
          }
        }

        if (currentEvent === 'error') {
          try {
            const err = JSON.parse(data);
            throw new Error(err.message || 'Something went wrong');
          } catch (e) {
            if (e instanceof SyntaxError) {
              throw new Error('Something went wrong, try again');
            }
            throw e;
          }
        }
      }
    }
  }

  throw new Error('Connection closed before it finished, try again');
}

/**
 * Cari preset Alight Motion dari link video TikTok
 * @param {string} link_tiktok - URL video TikTok (mis. https://vt.tiktok.com/xxx)
 * @returns {Promise<object>} Hasil berisi preset links, info video, dan author
 */
async function get_preset_links(link_tiktok) {
  const url = (link_tiktok || '').trim();

  if (!url) {
    throw new Error('TikTok video link is required');
  }
  if (!isValidTikTokUrl(url)) {
    throw new Error('That link is not from TikTok. Paste a TikTok video link first.');
  }

  const apiUrl = `${BASE_URL}/api/find?url=${encodeURIComponent(url)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000); // timeout 60 detik

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'User-Agent': 'Mozilla/5.0 (compatible; AMFinderScraper/1.0)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      throw new Error('Unexpected response format from server');
    }

    const result = await parseSSEStream(response);

    if (result.ok === false) {
      throw new Error(result.error || 'The scraper could not process this link');
    }

    return {
      ok: true,
      author: result.author || null,
      avatar: result.authorDetail?.avatar || null,
      video: {
        description: result.video?.description?.trim() || '',
        cover: result.video?.cover || null,
        playUrl: result.video?.playUrlNoWm || result.video?.playUrl || null,
        width: result.video?.width || null,
        height: result.video?.height || null,
        stats: {
          views: result.video?.stats?.views ?? null,
          likes: result.video?.stats?.likes ?? null,
          comments: result.video?.stats?.comments ?? null,
        },
      },
      presetLinks: (result.presetLinks || []).map((p) => ({
        title: p.title || (p.type === '5mb' ? '5MB preset' : 'XML file'),
        url: p.url,
        type: p.type, // "5mb" | "xml"
        size: p.size || null,
        ratio: p.ratio || null,
        thumb: p.thumb || null,
        pinned: !!p.pinned,
        byAuthor: !!p.byAuthor,
        detail: p.detail || null,
      })),
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { get_preset_links };

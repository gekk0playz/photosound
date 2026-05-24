import axios from 'axios';

export const API_VERSION = '2024-06-20';

// In-memory rate limit: 5 requests/IP/5 minutes
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxRequests = 5;
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= maxRequests;
}

function getDemoSong(prompt, title) {
  // Use self-hosted demo-audio endpoint — no external CDN dependency
  const titles = ['Golden Hour', 'Midnight Dreams', 'Ocean Waves'];
  const t = titles[Math.floor(Math.random() * titles.length)];
  return {
    songId: 'demo_' + Date.now(),
    title: title || t,
    songUrl: '/api/demo-audio',
    audioPreviewUrl: '/api/demo-audio',
    previewSeconds: 30,
    coverUrl: null,
    duration: 30,
    demo: true,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many generation requests. Please wait 5 minutes.',
      retryAfter: 300,
    });
  }

  const { prompt, tags, title } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  const isDemo = !process.env.SUNO_API_KEY || process.env.SUNO_API_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY';
  if (isDemo) {
    // Randomize delay between 2-4s to simulate real generation
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
    return res.status(200).json(getDemoSong(prompt, title));
  }

  try {
    const sunoBase = process.env.SUNO_API_BASE_URL || 'https://api.sunoaiapi.com';
    const headers = {
      'api-key': process.env.SUNO_API_KEY,
      'Content-Type': 'application/json',
    };

    // Submit generation request
    const genRes = await axios.post(`${sunoBase}/api/generate`, {
      prompt: prompt.substring(0, 500),
      tags: (tags || '').substring(0, 100),
      title: (title || 'PhotoSound').substring(0, 100),
      make_instrumental: false,
      model: 'chirp-v3-5',
    }, { headers, timeout: 30000 });

    const data = genRes.data;
    if (!data || (!data.id && !data[0]?.id)) {
      throw new Error('Suno API returned no job ID');
    }

    const jobId = data.id || data[0]?.id;

    // Poll for completion (max 3 minutes)
    const maxRetries = 36;
    const pollInterval = 5000;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(r => setTimeout(r, pollInterval));

      try {
        const statusRes = await axios.get(`${sunoBase}/api/get?ids=${jobId}`, { headers, timeout: 15000 });
        const songs = statusRes.data;
        const song = Array.isArray(songs) ? songs[0] : songs;

        if (song?.status === 'complete' || song?.audio_url) {
          return res.status(200).json({
            songId: jobId,
            title: song.title || title || 'PhotoSound',
            songUrl: song.audio_url,
            audioPreviewUrl: song.audio_url,
            previewSeconds: parseInt(process.env.NEXT_PUBLIC_FREE_PREVIEW_SECONDS || '30', 10),
            coverUrl: song.image_url || null,
            duration: song.duration || 180,
          });
        }

        if (song?.status === 'error') {
          throw new Error('Suno generation failed: ' + (song.error || 'unknown error'));
        }
      } catch (pollErr) {
        if (i === maxRetries - 1) throw pollErr;
        // Continue polling on transient network errors
      }
    }

    throw new Error('Song generation timed out after 3 minutes — please try again');

  } catch (err) {
    console.error('Generate error:', err);

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ error: 'Suno AI is temporarily unavailable — please try again in a moment' });
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      return res.status(500).json({ error: 'Suno AI API key is invalid or missing' });
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return res.status(504).json({ error: 'Suno AI request timed out — please try again' });
    }

    return res.status(500).json({ error: err.message || 'Song generation failed — please try again' });
  }
}

import axios from 'axios';

// Rate limiter: 5 generate requests per IP per 5 minutes (expensive endpoint)
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxRequests = 5;
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= maxRequests;
}

// Demo mode: returns a real publicly accessible sample track
function getDemoSong(prompt, title) {
  return {
    songId: 'demo_' + Date.now(),
    title: title || 'Golden Hour',
    songUrl: 'https://cdn.pixabay.com/audio/2024/03/11/audio_24e4afa7ba.mp3',
    audioPreviewUrl: 'https://cdn.pixabay.com/audio/2024/03/11/audio_24e4afa7ba.mp3',
    previewSeconds: 30,
    coverUrl: null,
    duration: 180,
    demo: true,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Too many generation requests. Please wait 5 minutes.' });

  const { prompt, tags, title } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  // Demo mode fallback
  if (!process.env.SUNO_API_KEY || process.env.SUNO_API_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY') {
    await new Promise(r => setTimeout(r, 3000)); // Simulate generation delay
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
      prompt: prompt,
      tags: tags || '',
      title: title || 'PhotoSound',
      make_instrumental: true,
      model: 'chirp-v3-5',
    }, { headers, timeout: 30000 });

    const data = genRes.data;
    if (!data || (!data.id && !data[0]?.id)) {
      throw new Error('Suno API returned no job ID');
    }

    const jobId = data.id || data[0]?.id;

    // Poll for completion
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
            previewSeconds: 30,
            coverUrl: song.image_url || null,
            duration: song.duration || 180,
          });
        }

        if (song?.status === 'error') {
          throw new Error('Suno generation failed: ' + (song.error || 'unknown error'));
        }
      } catch (pollErr) {
        if (i === maxRetries - 1) throw pollErr;
        // Continue polling on network errors
      }
    }

    throw new Error('Song generation timed out after 3 minutes');
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message || 'Song generation failed' });
  }
}

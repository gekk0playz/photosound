/**
 * POST /api/generate
 * Body: { sunoPrompt, title, tier }
 * Returns: { songUrl, audioPreviewUrl, coverUrl, duration, songId }
 *
 * Suno's unofficial API is consumed via https://api.sunoaiapi.com
 * (open-source wrapper: https://github.com/gcui-art/suno-api)
 * In production, replace with official Suno API when available.
 */

import axios from 'axios';

const SUNO_BASE = process.env.SUNO_API_BASE_URL || 'https://api.sunoaiapi.com';
const SUNO_KEY  = process.env.SUNO_API_KEY;

// Poll until song is ready (max ~3 minutes)
async function pollUntilReady(songId, maxRetries = 36, intervalMs = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    const resp = await axios.get(`${SUNO_BASE}/api/get?ids=${songId}`, {
      headers: { 'api-key': SUNO_KEY },
      timeout: 10000,
    });
    const song = Array.isArray(resp.data) ? resp.data[0] : resp.data;
    if (song?.status === 'complete' || song?.audio_url) {
      return song;
    }
    if (song?.status === 'error') throw new Error('Suno generation failed');
  }
  throw new Error('Song generation timed out');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sunoPrompt, title, tier = 'free' } = req.body || {};
  if (!sunoPrompt) return res.status(400).json({ error: 'sunoPrompt is required' });

  if (!SUNO_KEY) {
    return res.status(503).json({ error: 'Suno API not configured. Set SUNO_API_KEY.' });
  }

  // Generate with Suno
  let songId;
  try {
    const payload = {
      prompt: sunoPrompt,
      title: title || 'PhotoSound',
      tags: 'ai generated photosound',
      make_instrumental: false,
      wait_audio: false, // async — we'll poll
    };
    const resp = await axios.post(`${SUNO_BASE}/api/generate`, payload, {
      headers: {
        'api-key': SUNO_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    const data = Array.isArray(resp.data) ? resp.data[0] : resp.data;
    songId = data?.id || data?.song_id;
    if (!songId) throw new Error('No song ID returned from Suno');
  } catch (err) {
    console.error('Suno generate error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Suno generation request failed: ' + err.message });
  }

  // Poll
  let song;
  try {
    song = await pollUntilReady(songId);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const audioUrl = song.audio_url;
  const coverUrl = song.image_url || song.cover_image_url || null;
  const duration  = song.duration || 120; // seconds

  // For free tier: return a trimmed preview URL signal
  // Actual trimming is done client-side using Web Audio API
  const previewSeconds = parseInt(process.env.NEXT_PUBLIC_FREE_PREVIEW_SECONDS || '30');

  return res.status(200).json({
    songId,
    songUrl: tier === 'paid' ? audioUrl : null,    // full URL only for paid
    audioPreviewUrl: audioUrl,                      // always return for in-browser preview
    previewSeconds: tier === 'free' ? previewSeconds : duration,
    coverUrl,
    duration,
    title: song.title || title,
  });
}

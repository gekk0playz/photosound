/**
 * GET /api/verify-payment?session_id=...&song_id=...
 * Verifies a completed Stripe session → returns full song URL for download
 */

import Stripe from 'stripe';
import axios from 'axios';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

const SUNO_BASE = process.env.SUNO_API_BASE_URL || 'https://api.sunoaiapi.com';
const SUNO_KEY  = process.env.SUNO_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id, song_id } = req.query;
  if (!session_id || !song_id) return res.status(400).json({ error: 'Missing params' });

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  if (session.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Payment not completed' });
  }

  if (session.metadata?.songId !== song_id) {
    return res.status(403).json({ error: 'Song ID mismatch' });
  }

  // Fetch song from Suno to get full audio URL
  let audioUrl;
  try {
    const resp = await axios.get(`${SUNO_BASE}/api/get?ids=${song_id}`, {
      headers: { 'api-key': SUNO_KEY },
      timeout: 10000,
    });
    const song = Array.isArray(resp.data) ? resp.data[0] : resp.data;
    audioUrl = song?.audio_url;
  } catch (err) {
    return res.status(500).json({ error: 'Could not retrieve song from Suno' });
  }

  if (!audioUrl) return res.status(404).json({ error: 'Song not found' });

  return res.status(200).json({
    success: true,
    audioUrl,
    songId: song_id,
  });
}

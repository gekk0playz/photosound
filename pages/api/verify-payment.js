import Stripe from 'stripe';

export const API_VERSION = '2024-06-20';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, songId } = req.body;
  if (!sessionId || !songId) {
    return res.status(400).json({ error: 'Missing sessionId or songId' });
  }

  const isDemo = sessionId.startsWith('demo_session_') ||
    !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY';

  if (isDemo) {
    return res.status(200).json({
      verified: true,
      downloadUrl: 'https://cdn.pixabay.com/audio/2024/03/11/audio_24e4afa7ba.mp3',
      title: 'Demo Song',
      demo: true,
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: API_VERSION });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ verified: false, error: 'Payment not completed' });
    }

    const paidSongId = session.metadata?.songId;
    if (paidSongId && paidSongId !== songId) {
      return res.status(403).json({ verified: false, error: 'Song ID mismatch — this song was not purchased' });
    }

    const rawUrl = session.metadata?.songUrl || '';
    const title = session.metadata?.title || 'Your Song';

    // Serve downloads through the proxy so Suno CDN expiry doesn't break links
    const downloadUrl = rawUrl
      ? `/api/download?url=${encodeURIComponent(rawUrl)}&title=${encodeURIComponent(title)}`
      : '';

    return res.status(200).json({
      verified: true,
      downloadUrl,
      title,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('Verify payment error:', err);

    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ verified: false, error: 'Invalid session ID' });
    }
    if (err.type === 'StripeAuthenticationError') {
      return res.status(500).json({ verified: false, error: 'Payment system misconfigured' });
    }

    return res.status(500).json({ verified: false, error: err.message || 'Verification failed' });
  }
}
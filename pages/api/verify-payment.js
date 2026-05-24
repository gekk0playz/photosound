import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, songId } = req.body;
  if (!sessionId || !songId) return res.status(400).json({ error: 'Missing sessionId or songId' });

  // Demo mode: auto-verify demo sessions
  if (sessionId.startsWith('demo_session_') || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY') {
    return res.status(200).json({
      verified: true,
      downloadUrl: 'https://cdn.pixabay.com/audio/2024/03/11/audio_24e4afa7ba.mp3',
      title: 'Demo Song',
      demo: true,
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ verified: false, error: 'Payment not completed' });
    }

    const paidSongId = session.metadata?.songId;
    if (paidSongId && paidSongId !== songId) {
      return res.status(403).json({ verified: false, error: 'Song ID mismatch' });
    }

    // For real implementation: fetch the full audio URL from Suno
    // For now return the songUrl stored in metadata
    const downloadUrl = session.metadata?.songUrl || '';

    return res.status(200).json({
      verified: true,
      downloadUrl,
      title: session.metadata?.title || 'Your Song',
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ verified: false, error: err.message || 'Verification failed' });
  }
}

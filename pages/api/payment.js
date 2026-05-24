import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { songId, songUrl, title } = req.body;
  if (!songId) return res.status(400).json({ error: 'No song ID provided' });

  // Demo mode: return a fake checkout URL
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY') {
    return res.status(200).json({
      url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/success?session_id=demo_session_${Date.now()}&song_id=${songId}`,
      demo: true,
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://photosound-git-main-druxio.vercel.app';
    const priceId = process.env.STRIPE_PRICE_ID || 'price_1TaIUzE5HNy3YrTbw16HzvY5';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}&song_id=${encodeURIComponent(songId)}`,
      cancel_url: `${appUrl}/#generate`,
      metadata: { songId, songUrl: songUrl || '', title: title || 'PhotoSound' },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Payment error:', err);
    return res.status(500).json({ error: err.message || 'Payment session creation failed' });
  }
}

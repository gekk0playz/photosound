import Stripe from 'stripe';

export const API_VERSION = '2024-06-20';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { songId, songUrl, title } = req.body;
  if (!songId) {
    return res.status(400).json({ error: 'No song ID provided' });
  }

  const isDemo = !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY';

  if (isDemo) {
    return res.status(200).json({
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id=demo_session_${Date.now()}&song_id=${encodeURIComponent(songId)}`,
      demo: true,
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: API_VERSION });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://photosound.vercel.app';
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: 'STRIPE_PRICE_ID is not configured' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}&song_id=${encodeURIComponent(songId)}`,
      cancel_url: `${appUrl}/#generate`,
      metadata: {
        songId: songId,
        songUrl: songUrl || '',
        title: title || 'PhotoSound',
      },
      customer_email: undefined,
      billing_address_collection: 'auto',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Payment error:', err);

    if (err.type === 'StripeAuthenticationError') {
      return res.status(500).json({ error: 'Stripe API key is invalid or missing' });
    }
    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message || 'Payment session creation failed' });
  }
}
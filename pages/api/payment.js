/**
 * POST /api/payment
 * Body: { songId, email }
 * Creates a Stripe Checkout Session → returns { url }
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

// Pre-created live price: $1.99 one-time — prod_UZRNMCIPKn5Xf0 / price_1TaIUzE5HNy3YrTbw16HzvY5
const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1TaIUzE5HNy3YrTbw16HzvY5';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { songId, email } = req.body || {};
  if (!songId) return res.status(400).json({ error: 'songId is required' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      mode: 'payment',
      metadata: { songId },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}&song_id=${songId}`,
      cancel_url: `${appUrl}/?cancelled=1&song_id=${songId}`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session: ' + err.message });
  }
}

import Stripe from 'stripe';

export const API_VERSION = '2024-06-20';
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set, skipping signature verification');
    return res.status(200).json({ received: true, warning: 'No secret configured' });
  }

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY') {
    return res.status(200).json({ received: true, warning: 'Stripe not configured' });
  }

  let stripe;
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: API_VERSION });
  } catch (err) {
    console.error('Stripe init error:', err);
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Invalid signature: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const songId = session.metadata?.songId;
      const email = session.customer_details?.email;
      const amount = session.amount_total;
      console.log('[PhotoSound] Payment complete:', {
        sessionId: session.id,
        songId,
        email,
        amount: amount ? `$${(amount / 100).toFixed(2)}` : 'N/A',
        purchasedAt: new Date().toISOString(),
      });
      break;
    }
    case 'payment_intent.succeeded':
      console.log('[PhotoSound] PaymentIntent succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.warn('[PhotoSound] PaymentIntent failed:', event.data.object.id);
      break;
    default:
      break;
  }

  return res.status(200).json({ received: true });
}
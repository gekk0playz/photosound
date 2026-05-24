import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

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
    // No webhook secret configured — skip verification in dev
    console.warn('STRIPE_WEBHOOK_SECRET not set, skipping signature verification');
    return res.status(200).json({ received: true, warning: 'No secret configured' });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const songId = session.metadata?.songId;
      const email = session.customer_details?.email;
      console.log('Payment complete:', { sessionId: session.id, songId, email, amount: session.amount_total });
      // Future: send download email, log to DB, etc.
      break;
    }

    case 'payment_intent.succeeded':
      console.log('PaymentIntent succeeded:', event.data.object.id);
      break;

    case 'payment_intent.payment_failed':
      console.warn('PaymentIntent failed:', event.data.object.id);
      break;

    default:
      // Ignore other event types
      break;
  }

  return res.status(200).json({ received: true });
}

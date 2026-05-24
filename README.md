# PhotoSound

**Turn any photo into an AI-generated song.**

PhotoSound uses GPT-4 Vision to analyze the mood, color, and emotion of any photo, then generates a unique original song that matches it using Suno AI. The first 30 seconds are free to preview; the full MP3 is available for $1.99.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **AI**: OpenAI GPT-4o (image analysis), Suno AI (music generation)
- **Payments**: Stripe Checkout
- **Deployment**: Vercel

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/gekk0playz/photosound.git
cd photosound
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then fill in your keys in `.env.local`:

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o vision analysis |
| `SUNO_API_KEY` | Suno AI API key for music generation |
| `SUNO_API_BASE_URL` | Suno API base URL (default: `https://api.sunoaiapi.com`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe Price ID for $1.99 song |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_FREE_PREVIEW_SECONDS` | Free preview duration (default: 30) |

**Without API keys**, the app runs in **demo mode** with fake/hardcoded responses — great for UI testing.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Stripe webhooks (local development)

Use the Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the webhook signing secret output into `STRIPE_WEBHOOK_SECRET`.

## Project Structure

```
photosound/
├── pages/
│   ├── index.js          # Main landing page + generate widget
│   ├── success.js        # Post-payment download page
│   └── api/
│       ├── analyze.js    # POST — GPT-4o image analysis
│       ├── generate.js   # POST — Suno AI music generation
│       ├── payment.js    # POST — Create Stripe checkout session
│       ├── verify-payment.js  # POST — Verify payment & get download URL
│       └── webhook.js    # POST — Stripe webhook handler
├── components/
│   ├── PhotoUpload.jsx  # Drag-and-drop file uploader
│   ├── SongPlayer.jsx    # Audio player with waveform visualization
│   └── PricingCard.jsx   # Stripe checkout trigger
├── styles/
│   └── globals.css       # Global styles, glass/card classes
├── public/
│   ├── favicon.svg       # Brand logo SVG
│   └── og-image.svg      # Social sharing image
└── next.config.js        # Next.js config (image domains)
```

## User Flow

1. User uploads a photo
2. `/api/analyze` sends it to GPT-4o Vision → returns mood, genre, tempo, instruments, Suno prompt
3. `/api/generate` sends the prompt to Suno AI → polls until song is ready
4. User sees the `SongPlayer` with a 30-second preview
5. User clicks "Buy full song" → redirected to Stripe Checkout
6. After payment, redirected to `/success` → download link served

## Deployment

Deploy to Vercel with zero-config:

```bash
npm install -g vercel
vercel
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

## Environment Variables Reference

| Variable | Required | Default | Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | For real analysis | — | Demo mode without |
| `SUNO_API_KEY` | For real generation | — | Demo mode without |
| `SUNO_API_BASE_URL` | No | `https://api.sunoaiapi.com` | Suno API endpoint |
| `STRIPE_SECRET_KEY` | For real payments | — | Demo mode without |
| `STRIPE_WEBHOOK_SECRET` | No | — | Skip verification in dev without |
| `STRIPE_PRICE_ID` | For real payments | — | Create in Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | — | Used for client-side Stripe |
| `NEXT_PUBLIC_APP_URL` | Yes | — | Public URL of your deployment |
| `NEXT_PUBLIC_FREE_PREVIEW_SECONDS` | No | `30` | Preview duration in seconds |
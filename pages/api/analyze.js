import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

export const config = { api: { bodyParser: false } };

// In-memory rate limit: 10 requests/IP/minute
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= maxRequests;
}

function getDemoAnalysis() {
  const variations = [
    {
      description: 'A warm golden scene with soft natural light and a peaceful atmosphere.',
      mood: 'Peaceful & warm',
      genre: 'Dreamy ambient',
      tempo: 'Slow (70 BPM)',
      instruments: ['Acoustic guitar', 'Soft piano', 'Ambient pads'],
      suno_prompt: 'peaceful dreamy ambient, acoustic guitar, soft piano pads, warm golden light, serene, instrumental',
      tags: 'ambient dreamy peaceful acoustic instrumental',
      title_suggestion: 'Golden Hour',
    },
    {
      description: 'Vibrant city lights reflecting on wet pavement at night, a bustling energy.',
      mood: 'Energetic & urban',
      genre: 'Lo-fi hip hop',
      tempo: 'Medium (95 BPM)',
      instruments: ['Piano', 'Drums', 'Bass', 'Vinyl crackle'],
      suno_prompt: 'chill lo-fi hip hop, jazz piano sample, laid-back drums, city night vibe, relaxing',
      tags: 'lofi chill urban night jazz',
      title_suggestion: 'Midnight in the City',
    },
    {
      description: 'Ocean waves crashing against rocky shores under a clear blue sky.',
      mood: 'Refreshing & free',
      genre: 'Chill electronic',
      tempo: 'Medium (110 BPM)',
      instruments: ['Synth pads', 'Electronic drums', 'Wave samples'],
      suno_prompt: 'chill electronic, synth pads, ocean wave ambience, fresh summer vibe, relaxing beat',
      tags: 'electronic ocean chill summer beach',
      title_suggestion: 'Coastal Breeze',
    },
  ];
  return variations[Math.floor(Math.random() * variations.length)];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a minute.',
      retryAfter: 60,
    });
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY') {
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    return res.status(200).json({ ...getDemoAnalysis(), demo: true });
  }

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024, filter: ({ mimetype }) => mimetype && mimetype.startsWith('image/') });
    const [, files] = await form.parse(req);
    const imageFile = files.image?.[0];

    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.' });
    }

    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${imageFile.mimetype};base64,${base64Image}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Analyse this image and return a JSON object with these exact fields:
- description: one sentence about what you see
- mood: 2-3 word mood description
- genre: one music genre that fits the image vibe
- tempo: tempo description with BPM
- instruments: array of 3-4 instruments that fit the vibe
- suno_prompt: Suno AI music prompt (max 200 chars, should generate a great song)
- tags: space-separated style tags (max 10)
- title_suggestion: a creative song title

Return ONLY valid JSON, no markdown code fences or extra text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
        { type: 'text', text: prompt },
      ]}],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return res.status(500).json({ error: 'No response from AI — please try again' });
    }

    const cleanJson = content.replace(/^```json\n?|```$/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Analyze error:', err);

    if (err.code === 'invalid_api_key') {
      return res.status(500).json({ error: 'OpenAI API key is invalid or missing' });
    }
    if (err.code === 'rate_limit_exceeded') {
      return res.status(429).json({ error: 'OpenAI rate limit reached — please try again shortly' });
    }
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'AI returned invalid response — please try again with a clearer photo' });
    }
    if (err.code === 'RequestEntityTooLarge') {
      return res.status(400).json({ error: 'Image is too large. Please use a file under 10MB.' });
    }

    return res.status(500).json({ error: err.message || 'Analysis failed — please try again' });
  }
}
import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

export const config = { api: { bodyParser: false } };

const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= maxRequests;
}

function getDemoAnalysis() {
  return {
    description: 'A warm golden scene with soft natural light and a peaceful atmosphere.',
    mood: 'Peaceful & warm',
    genre: 'Dreamy ambient',
    tempo: 'Slow (70 BPM)',
    instruments: ['Acoustic guitar', 'Soft piano', 'Ambient pads'],
    suno_prompt: 'peaceful dreamy ambient, acoustic guitar, soft piano pads, warm golden light, serene, instrumental',
    tags: 'ambient dreamy peaceful acoustic instrumental',
    title_suggestion: 'Golden Hour',
    demo: true,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'PLACEHOLDER_NEEDS_REAL_KEY') {
    await new Promise(r => setTimeout(r, 1500));
    return res.status(200).json(getDemoAnalysis());
  }

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    const [, files] = await form.parse(req);
    const imageFile = files.image?.[0];
    if (!imageFile) return res.status(400).json({ error: 'No image provided' });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) return res.status(400).json({ error: 'Invalid file type.' });

    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${imageFile.mimetype};base64,${base64Image}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Analyse this image and return a JSON object with these exact fields:
- description: one sentence about what you see
- mood: 2-3 word mood description
- genre: one music genre that fits the image vibe
- tempo: tempo description with BPM
- instruments: array of 3-4 instruments
- suno_prompt: Suno AI music prompt (max 200 chars)
- tags: space-separated style tags (max 10)
- title_suggestion: a creative song title

Return ONLY valid JSON, no markdown.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
        { type: 'text', text: prompt },
      ]}],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return res.status(500).json({ error: 'No response from AI' });
    const cleanJson = content.replace(/^```json\n?|```$/g, '').trim();
    return res.status(200).json(JSON.parse(cleanJson));
  } catch (err) {
    console.error('Analyze error:', err);
    if (err.code === 'invalid_api_key') return res.status(500).json({ error: 'OpenAI API key invalid' });
    if (err instanceof SyntaxError) return res.status(500).json({ error: 'AI returned invalid JSON — try again' });
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
}

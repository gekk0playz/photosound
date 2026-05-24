/**
 * POST /api/analyze
 * Accepts a multipart upload with an image file.
 * Returns: { description, mood, genre, tempo, tags[] }
 */

import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

export const config = { api: { bodyParser: false } };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    keepExtensions: true,
  });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to parse upload: ' + err.message });
  }

  const file = Array.isArray(files.image) ? files.image[0] : files.image;
  if (!file) return res.status(400).json({ error: 'No image provided' });

  const ext = path.extname(file.originalFilename || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (!allowedExts.includes(ext)) {
    return res.status(400).json({ error: 'Unsupported image format. Use JPG, PNG, GIF, or WebP.' });
  }

  // Read image and encode as base64
  const imageBuffer = fs.readFileSync(file.filepath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = ext === '.png' ? 'image/png'
    : ext === '.gif' ? 'image/gif'
    : ext === '.webp' ? 'image/webp'
    : 'image/jpeg';

  const prompt = `Analyze this image and extract musical DNA from it.
Return a JSON object with these exact keys:
{
  "description": "2-3 sentence vivid description of the image's atmosphere and emotion",
  "mood": "one or two words (e.g. 'melancholic', 'euphoric', 'dreamy calm')",
  "genre": "best music genre for this image (e.g. 'lo-fi hip hop', 'ambient electronic', 'cinematic orchestral', 'indie folk')",
  "tempo": "one word: slow / medium / fast / driving",
  "instruments": ["list", "of", "3-5", "instruments"],
  "suno_prompt": "A ready-to-use Suno AI music generation prompt of 50-80 words that will produce a song matching this image's vibe. Include genre, mood, instruments, BPM hint, and key sonic descriptors.",
  "tags": ["5", "relevant", "hashtag", "words"],
  "title_suggestion": "A creative song title for this photo (max 5 words)"
}
Only return valid JSON, no markdown.`;

  let analysis;
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'low', // low detail = cheaper, still good for mood/vibe
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const text = response.choices[0].message.content.trim();
    // Strip markdown code blocks if model adds them anyway
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    analysis = JSON.parse(clean);
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return res.status(500).json({ error: 'Image analysis failed: ' + err.message });
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(file.filepath); } catch {}
  }

  return res.status(200).json(analysis);
}

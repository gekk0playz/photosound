/**
 * Download proxy — fetches the song URL server-side and streams it back
 * as a proper MP3 attachment. This prevents broken download links when
 * Suno CDN URLs expire after payment.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, title } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  // Demo URLs are publicly accessible — allow them through
  if (url.includes('cdn.pixabay.com')) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      const buffer = await response.arrayBuffer();
      const filename = `${(title || 'photosound-song').replace(/[^a-z0-9]/gi, '_')}.mp3`;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.byteLength);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.status(200).send(Buffer.from(buffer));
    } catch (err) {
      console.error('Demo download proxy error:', err);
      return res.status(502).json({ error: 'Could not fetch the audio file' });
    }
  }

  // For real Suno CDN URLs, attempt proxy fetch
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PhotoSound/1.0)',
      },
    });

    if (!response.ok) {
      console.error('Download proxy: Suno URL returned', response.status);
      return res.status(502).json({ error: 'Could not fetch the audio file from the CDN' });
    }

    const buffer = await response.arrayBuffer();
    const filename = `${(title || 'photosound-song').replace(/[^a-z0-9]/gi, '_')}.mp3`;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).send(Buffer.from(buffer));

  } catch (err) {
    console.error('Download proxy error:', err);
    return res.status(502).json({ error: 'Download failed — please contact support' });
  }
}
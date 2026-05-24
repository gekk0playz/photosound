// pages/api/demo-audio.js
// Generates an ambient chord as a WAV file — no external dependencies

export default function handler(req, res) {
  const sampleRate = 22050;
  const duration = 30;
  const numSamples = sampleRate * duration;
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buf = Buffer.alloc(fileSize);
  let off = 0;

  buf.write('RIFF', off); off += 4;
  buf.writeUInt32LE(fileSize - 8, off); off += 4;
  buf.write('WAVE', off); off += 4;
  buf.write('fmt ', off); off += 4;
  buf.writeUInt32LE(16, off); off += 4;
  buf.writeUInt16LE(1, off); off += 2;
  buf.writeUInt16LE(numChannels, off); off += 2;
  buf.writeUInt32LE(sampleRate, off); off += 4;
  buf.writeUInt32LE(sampleRate * numChannels * bytesPerSample, off); off += 4;
  buf.writeUInt16LE(numChannels * bytesPerSample, off); off += 2;
  buf.writeUInt16LE(bitsPerSample, off); off += 2;
  buf.write('data', off); off += 4;
  buf.writeUInt32LE(dataSize, off); off += 4;

  const freqs = [261.63, 329.63, 392.0, 523.25];
  const amplitude = 0x5fff;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let env = 1.0;
    if (t < 2) env = t / 2;
    else if (t > duration - 3) env = (duration - t) / 3;
    const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t);
    let sample = 0;
    for (const f of freqs) {
      sample += Math.sin(2 * Math.PI * f * vibrato * t);
      sample += 0.15 * Math.sin(2 * Math.PI * f * 2 * vibrato * t);
    }
    const value = Math.round((sample / (freqs.length * 1.15)) * amplitude * env);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, value)), off);
    off += 2;
  }

  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Content-Length', fileSize);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).end(buf);
}

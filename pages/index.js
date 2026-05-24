import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { Music, Zap, Share2, ChevronRight, Star, ImageIcon, Headphones } from 'lucide-react';
import PhotoUpload from '../components/PhotoUpload';
import PricingCard from '../components/PricingCard';
import { useRouter } from 'next/router';

const STEPS = [
  { icon: ImageIcon, label: 'Upload any photo', desc: 'Selfie, sunset, your dog — anything works' },
  { icon: Zap, label: 'AI reads the vibe', desc: 'GPT-4 Vision extracts mood, colours, emotion' },
  { icon: Music, label: 'Suno writes the song', desc: 'A full AI song generated just for your image' },
  { icon: Share2, label: 'Share with everyone', desc: '"This is what my photo sounds like 🎵"' },
];

const EXAMPLES = [
  { emoji: '🌅', label: 'Golden hour sunset', genre: 'Dreamy ambient', colour: '#f97316' },
  { emoji: '🏙️', label: 'NYC at night', genre: 'Lo-fi hip hop', colour: '#818cf8' },
  { emoji: '🌊', label: 'Ocean waves', genre: 'Chill electronic', colour: '#38bdf8' },
  { emoji: '🐕', label: 'Puppy portrait', genre: 'Playful indie pop', colour: '#4ade80' },
  { emoji: '🌲', label: 'Forest trail', genre: 'Folk acoustic', colour: '#84cc16' },
  { emoji: '💃', label: 'Dance night out', genre: 'Vibrant house', colour: '#f472b6' },
];

export default function Home() {
  const router = useRouter();
  const appRef = useRef(null);

  const scrollToApp = () => {
    appRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>PhotoSound — Turn any photo into a song</title>
        <meta name="description" content="Upload any photo and get an AI-generated song that matches its vibe. Powered by Suno AI." />
        <meta property="og:title" content="PhotoSound — Turn any photo into a song" />
        <meta property="og:description" content="What does your favourite photo sound like?" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,78,241,0.15) 0%, transparent 60%), #0a0a0f' }}>

        {/* Nav */}
        <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #b84ef1, #7c3aed)' }}>
                <Music size={16} className="text-white" />
              </div>
              <span className="font-black text-lg tracking-tight">PhotoSound</span>
            </div>
            <button onClick={scrollToApp} className="btn-primary text-sm py-2 px-5">
              Try it free →
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-5 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-sm text-brand-300 font-medium border border-brand-500/20">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            AI-powered · Instant generation
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            What does your
            <br />
            <span className="gradient-text">favourite photo</span>
            <br />
            sound like?
          </h1>

          <p className="text-xl text-white/55 max-w-xl mx-auto leading-relaxed mb-10">
            Upload any image. AI analyses its vibe, mood, and emotion — then generates a
            full original song that matches it. Every photo has a sound.
          </p>

          <button onClick={scrollToApp} className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2 rounded-2xl">
            Turn your photo into a song
            <ChevronRight size={18} />
          </button>

          <p className="mt-4 text-white/30 text-sm">Free preview · $1.99 for full download</p>

          {/* Floating example genres */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {EXAMPLES.map(ex => (
              <div key={ex.label} className="glass px-4 py-2 rounded-full flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
                <span className="text-lg">{ex.emoji}</span>
                <div className="text-left">
                  <p className="text-white/70 text-xs font-semibold leading-tight">{ex.label}</p>
                  <p className="text-xs font-medium" style={{ color: ex.colour }}>{ex.genre}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-5 py-16">
          <h2 className="text-3xl font-black text-center mb-12">How it works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <div key={step.label} className="glass rounded-2xl p-5 text-center hover:bg-white/[0.05] transition-all group">
                <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center relative"
                  style={{ background: `rgba(184,78,241,${0.1 + i * 0.05})`, border: '1px solid rgba(184,78,241,0.2)' }}>
                  <step.icon size={22} className="text-brand-400 group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                </div>
                <p className="text-white/80 font-semibold text-sm mb-1">{step.label}</p>
                <p className="text-white/40 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upload section */}
        <section ref={appRef} className="max-w-2xl mx-auto px-5 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black mb-3">Try it now</h2>
            <p className="text-white/50">Drop any photo and hear your song in ~60 seconds</p>
          </div>
          <div className="glass-bright rounded-3xl p-6 glow-purple">
            <GenerateWidget />
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-4xl mx-auto px-5 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Simple pricing</h2>
            <p className="text-white/50">Start free. Pay only for what you love.</p>
          </div>
          <PricingCard onSelect={(tier) => {
            if (tier === 'free') appRef.current?.scrollIntoView({ behavior: 'smooth' });
          }} />
        </section>

        {/* Social proof placeholder */}
        <section className="max-w-4xl mx-auto px-5 py-12 text-center">
          <div className="flex justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} className="fill-brand-400 text-brand-400" />)}
          </div>
          <p className="text-white/60 max-w-md mx-auto italic text-lg leading-relaxed">
            "Uploaded my sunset photo — got the most vibe-accurate lo-fi track. Sent it to all my friends instantly."
          </p>
          <p className="text-white/30 text-sm mt-3 font-medium">— Early tester</p>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-10">
          <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Music size={16} className="text-brand-500" />
              <span className="text-white/40 text-sm font-semibold">PhotoSound</span>
            </div>
            <p className="text-white/25 text-xs">© 2026 PhotoSound. Built with Suno AI & OpenAI.</p>
            <div className="flex gap-5 text-white/35 text-xs">
              <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
              <a href="mailto:hello@photosound.app" className="hover:text-white/60 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Inline mini generator widget for landing page
function GenerateWidget() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | analyzing | generating | done | error
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const generate = async () => {
    if (!file) return;
    setStatus('analyzing');
    setErrorMsg('');

    try {
      // Step 1: Analyze image
      const fd = new FormData();
      fd.append('image', file);
      const analyzeRes = await fetch('/api/analyze', { method: 'POST', body: fd });
      if (!analyzeRes.ok) throw new Error(.(await analyzeRes.json()).error);
      const analysisData = await analyzeRes.json();
      setAnalysis(analysisData);

      // Step 2: Generate song
      setStatus('generating');
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sunoPrompt: analysisData.suno_prompt,
          title: analysisData.title_suggestion,
          tier: 'free',
        }),
      });
      if (!genRes.ok) throw new Error((await genRes.json()).error);
      const genData = await genRes.json();
      setResult(genData);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong');
      setStatus('error');
    }
  };

  const buy = async () => {
    if (!result?.songId) return;
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId: result.songId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (status === 'done' && result) {
    const { default: SongPlayer } = require('../components/SongPlayer');
    return (
      <div className="space-y-4">
        {analysis && (
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/20 text-brand-300 text-xs font-medium">
              {analysis.genre}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.05] text-white/50 text-xs">
              {analysis.mood}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.05] text-white/50 text-xs">
              {analysis.tempo} tempo
            </span>
          </div>
        )}
        <SongPlayer
          audioUrl={result.audioPreviewUrl}
          previewSeconds={result.previewSeconds}
          title={result.title}
          coverUrl={result.coverUrl}
          songId={result.songId}
          tier="free"
          onBuyClick={buy}
        />
        <button
          onClick={() => { setStatus('idle'); setResult(null); setFile(null); setAnalysis(null); }}
          className="w-full py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-all"
        >
          ↚ Try another photo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PhotoUpload onFileSelect={setFile} disabled={status === 'analyzing' || status === 'generating'} />

      {status === 'analyzing' && (
        <StatusBanner icon="🔍" label="Analysing your photo…" sub="GPT-4 Vision is reading the vibe" />
      )}
      {status === 'generating' && (
        <StatusBanner icon="🎵" label="Composing your song…" sub="Suno AI is generating — takes ~45s" spinner />
      )}
      {status === 'error' && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        onClick={generate}
        disabled={!file || status === 'analyzing' || status === 'generating'}
        className="btn-primary w-full py-4 text-base rounded-xl flex items-center justify-center gap-2"
      >
        {status === 'analyzing' || status === 'generating'
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Working on it...</>
          : <><Music size={18} /> Turn this photo into a song</>}
      </button>
    </div>
  );
}

function StatusBanner({ icon, label, sub, spinner }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl glass">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className="text-white/80 font-medium text-sm">{label}</p>
        <p className="text-white/40 text-xs">{sub}</p>
      </div>
      {spinner && (
        <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
      )}
    </div>
  );
}

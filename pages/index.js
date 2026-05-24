import Head from 'next/head';
import { useState, useRef } from 'react';
import PhotoUpload from '../components/PhotoUpload';
import SongPlayer from '../components/SongPlayer';
import PricingCard from '../components/PricingCard';

const STEPS = [
  { n: '01', title: 'Upload any photo', desc: 'Selfie, landscape, pet, artwork — anything.' },
  { n: '02', title: 'AI reads the vibe', desc: 'GPT-4 Vision analyses mood, colour, and emotion.' },
  { n: '03', title: 'Song is composed', desc: 'Suno AI composes a unique track that matches the image.' },
  { n: '04', title: 'Listen and download', desc: 'Preview free. Download the full MP3 for $1.99.' },
];

const EXAMPLES = [
  { label: 'Golden hour sunset', genre: 'Dreamy ambient' },
  { label: 'NYC at night', genre: 'Lo-fi hip hop' },
  { label: 'Ocean waves', genre: 'Chill electronic' },
  { label: 'Puppy portrait', genre: 'Playful indie pop' },
  { label: 'Forest trail', genre: 'Folk acoustic' },
  { label: 'Dance night out', genre: 'Vibrant house' },
];

export default function Home() {
  const [step, setStep] = useState('idle'); // idle | analyzing | generating | done
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [songData, setSongData] = useState(null);
  const [error, setError] = useState('');
  const widgetRef = useRef(null);

  const scrollToWidget = () => {
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setError('');
    setStep('analyzing');
    scrollToWidget();

    try {
      // Analyze image
      const fd = new FormData();
      fd.append('image', selectedFile);
      const analyzeRes = await fetch('/api/analyze', { method: 'POST', body: fd });
      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json();
        throw new Error(errData.error || 'Analysis failed');
      }
      const analysisData = await analyzeRes.json();
      setAnalysis(analysisData);
      setStep('generating');

      // Generate song
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: analysisData.suno_prompt, tags: analysisData.tags, title: analysisData.title_suggestion }),
      });
      if (!generateRes.ok) {
        const errData = await generateRes.json();
        throw new Error(errData.error || 'Generation failed');
      }
      const song = await generateRes.json();
      setSongData(song);
      setStep('done');
    } catch (err) {
      setError(err.message);
      setStep('idle');
    }
  };

  const handleReset = () => {
    setStep('idle');
    setFile(null);
    setAnalysis(null);
    setSongData(null);
    setError('');
  };

  return (
    <>
      <Head>
        <title>PhotoSound — Turn any photo into a song</title>
        <meta name="description" content="Upload any photo. AI analyses its vibe and generates a unique original song that matches it. Free preview, $1.99 for the full download." />
        <meta property="og:title" content="PhotoSound — Turn any photo into a song" />
        <meta property="og:description" content="Every photo has a sound. Upload yours and hear it." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://photosound-git-main-druxio.vercel.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PhotoSound — Turn any photo into a song" />
        <meta name="twitter:description" content="Upload any photo. AI generates a song that sounds like it." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">PS</div>
          <span className="font-semibold text-white">PhotoSound</span>
        </div>
        <button onClick={scrollToWidget} className="btn-primary text-sm px-4 py-2">
          Try it free
        </button>
      </nav>

      <main className="min-h-screen bg-black text-white pt-16">

        {/* Hero */}
        <section className="relative pt-24 pb-16 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,78,241,0.25) 0%, transparent 70%)'}} />
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-white/60 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              AI-powered · Instant generation
            </div>
            <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6">
              What does your<br />
              <span className="gradient-text">favourite photo</span><br />
              sound like?
            </h1>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Upload any image. AI analyses its vibe, mood, and emotion
              then generates a full original song that matches it. Every photo has a sound.
            </p>
            <button onClick={scrollToWidget} className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              Turn your photo into a song
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <p className="mt-3 text-sm text-white/40">Free preview · $1.99 for full download</p>

            {/* Example tags */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {EXAMPLES.map(e => (
                <div key={e.label} className="glass flex items-center gap-2 px-3 py-2 rounded-full text-sm">
                  <div className="flex gap-0.5">
                    {[1,2,3,4].map(i => <div key={i} className="waveform-bar w-1 rounded-full bg-brand/60" style={{height: (8 + i*4) + 'px', animationDelay: i*0.1 + 's'}} />)}
                  </div>
                  <span className="text-white/80">{e.label}</span>
                  <span className="text-brand/80 text-xs">{e.genre}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map(s => (
                <div key={s.n} className="glass rounded-2xl p-5">
                  <div className="text-3xl font-black text-brand/30 mb-3">{s.n}</div>
                  <div className="font-semibold mb-1">{s.title}</div>
                  <div className="text-sm text-white/50">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Generate widget */}
        <section ref={widgetRef} className="py-16 px-6" id="generate">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Try it now</h2>
            <p className="text-center text-white/50 text-sm mb-8">Upload any photo and hear what it sounds like</p>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {step === 'idle' && (
              <PhotoUpload onFile={handleFile} />
            )}

            {step === 'analyzing' && (
              <div className="glass rounded-2xl p-10 text-center">
                <div className="w-12 h-12 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/70 font-medium">Analysing your photo...</p>
                <p className="text-white/40 text-sm mt-1">GPT-4 Vision is reading the mood and emotion</p>
              </div>
            )}

            {step === 'generating' && analysis && (
              <div className="glass rounded-2xl p-10 text-center">
                <div className="w-12 h-12 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/70 font-medium">Composing your song...</p>
                <p className="text-white/40 text-sm mt-1 mb-4">Suno AI is generating a {analysis.genre} track</p>
                {analysis && (
                  <div className="glass-bright rounded-xl p-4 text-left text-sm">
                    <div className="text-white/40 text-xs mb-2 uppercase tracking-wider">AI detected</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-white/40">Mood:</span> <span className="text-white/80">{analysis.mood}</span></div>
                      <div><span className="text-white/40">Genre:</span> <span className="text-white/80">{analysis.genre}</span></div>
                      <div><span className="text-white/40">Tempo:</span> <span className="text-white/80">{analysis.tempo}</span></div>
                      <div><span className="text-white/40">Instruments:</span> <span className="text-white/80">{analysis.instruments?.slice(0,2).join(', ')}</span></div>
                    </div>
                  </div>
                )}
                <p className="text-white/30 text-xs mt-4">This takes 1-3 minutes...</p>
              </div>
            )}

            {step === 'done' && songData && (
              <div className="space-y-4">
                <SongPlayer songData={songData} analysis={analysis} />
                <PricingCard songData={songData} />
                <button onClick={handleReset} className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors">
                  Try another photo
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Social proof */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">What will your photo sound like?</h2>
            <p className="text-white/50 mb-10">Every image tells a story. Now it tells a song.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { stat: '87%', label: 'Gross margin per song' },
                { stat: '~2 min', label: 'Average generation time' },
                { stat: '$1.99', label: 'Flat price, no subscription' },
              ].map(s => (
                <div key={s.stat} className="glass rounded-2xl p-6">
                  <div className="text-3xl font-black gradient-text mb-1">{s.stat}</div>
                  <div className="text-white/50 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Simple pricing</h2>
            <p className="text-center text-white/50 text-sm mb-10">No subscription. Pay only for what you love.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="text-lg font-bold mb-1">Free Preview</div>
                <div className="text-3xl font-black mb-4">$0</div>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Unlimited uploads</li>
                  <li className="flex gap-2"><span className="text-green-400">✓</span> AI photo analysis</li>
                  <li className="flex gap-2"><span className="text-green-400">✓</span> 30-second song preview</li>
                  <li className="flex gap-2"><span className="text-white/30">✗</span> Full song download</li>
                </ul>
              </div>
              <div className="glass-bright rounded-2xl p-6 border border-brand/30 relative">
                <div className="absolute top-4 right-4 bg-brand text-white text-xs px-2 py-0.5 rounded-full">Popular</div>
                <div className="text-lg font-bold mb-1">Full Download</div>
                <div className="text-3xl font-black mb-4">$1.99</div>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Full-length MP3 (2-3 min)</li>
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Commercial use rights</li>
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Instant download</li>
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Unique — never repeated</li>
                </ul>
                <button onClick={scrollToWidget} className="btn-primary w-full mt-6 py-3 text-sm">
                  Create your song
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-white/30 text-sm">
        <p>PhotoSound &mdash; Every photo has a sound.</p>
        <p className="mt-1">Powered by GPT-4 Vision + Suno AI</p>
      </footer>
    </>
  );
}

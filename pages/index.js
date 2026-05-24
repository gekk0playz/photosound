import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';
import PhotoUpload from '../components/PhotoUpload';
import SongPlayer from '../components/SongPlayer';
import PricingCard from '../components/PricingCard';
import ToastContainer, { useToast } from '../components/Toast';
import ShareButton from '../components/ShareButton';
import SongHistory, { useSongHistory } from '../components/SongHistory';
import ThemeToggle from '../components/ThemeToggle';

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

const META_DESCRIPTION = 'Upload any photo. AI analyses its vibe and generates a unique original song that matches it. Free 30-second preview, full MP3 download for $1.99.';
const META_TITLE = 'PhotoSound — Turn any photo into a song';
const APP_URL = 'https://photosound.vercel.app';

function SkipLink() {
  return (
    <a href="#generate" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-xl focus:text-sm focus:font-medium">
      Skip to main content
    </a>
  );
}

export default function Home() {
  const [step, setStep] = useState('idle');
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [songData, setSongData] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const widgetRef = useRef(null);
  const { toasts, addToast, removeToast } = useToast();
  const { history, addSong, removeSong, clearHistory } = useSongHistory();

  const scrollToWidget = useCallback(() => {
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  useEffect(() => {
    // Show history if there are saved songs and user is idle
    if (step === 'idle' && history.length > 0) {
      setHistoryOpen(true);
    }
  }, [step, history.length]);

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setStep('analyzing');
    scrollToWidget();

    try {
      const fd = new FormData();
      fd.append('image', selectedFile);
      const analyzeRes = await fetch('/api/analyze', { method: 'POST', body: fd });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.error || `Analysis failed (${analyzeRes.status})`);
      }

      const analysisData = await analyzeRes.json();
      setAnalysis(analysisData);
      setStep('generating');

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: analysisData.suno_prompt,
          tags: analysisData.tags,
          title: analysisData.title_suggestion,
        }),
      });

      if (!generateRes.ok) {
        const errData = await generateRes.json().catch(() => ({}));
        throw new Error(errData.error || `Generation failed (${generateRes.status})`);
      }

      const song = await generateRes.json();
      setSongData(song);
      setStep('done');
      addSong(song, analysisData);
    } catch (err) {
      addToast(err.message || 'Something went wrong. Please try again.', 'error');
      setStep('idle');
    }
  };

  const handleReset = () => {
    setStep('idle');
    setFile(null);
    setAnalysis(null);
    setSongData(null);
  };

  return (
    <>
      <Head>
        <title>{META_TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content="Every photo has a sound. Upload yours and hear it." />
        <meta property="og:image" content="/og-image.svg" />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={META_TITLE} />
        <meta name="twitter:description" content={META_DESCRIPTION} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SkipLink />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-black/70 backdrop-blur-md border-b border-white/5"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm"
            aria-hidden="true"
          >
            PS
          </div>
          <span className="font-semibold text-white">PhotoSound</span>
        </div>

        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className={`
                hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all mr-1
                ${historyOpen ? 'bg-white/5 text-white' : ''}
              `}
              aria-label={`Song history (${history.length} songs)`}
              aria-expanded={historyOpen}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden md:inline">History</span>
              <span className="text-xs bg-brand/30 px-1.5 py-0.5 rounded-full">{history.length}</span>
            </button>
          )}
          <ThemeToggle />
          <button
            onClick={scrollToWidget}
            className="btn-primary text-sm px-4 py-2"
          >
            Try it free
          </button>
        </div>
      </nav>

      <main className="min-h-screen bg-black text-white pt-16" id="main-content">

        {/* Hero */}
        <section
          className="relative pt-20 sm:pt-28 pb-14 sm:pb-16 px-4 sm:px-6 text-center overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,78,241,0.25) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-white/60 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
              AI-powered &middot; Instant generation
            </div>

            <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
              What does your{' '}
              <span className="gradient-text">favourite photo</span>
              <br className="hidden sm:inline" /> sound like?
            </h1>

            <p className="text-base sm:text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Upload any image. AI analyses its vibe, mood, and emotion
              then generates a full original song that matches it. Every photo has a sound.
            </p>

            <button
              onClick={scrollToWidget}
              className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center gap-2"
            >
              Turn your photo into a song
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <p className="mt-3 text-sm text-white/40">Free preview &middot; $1.99 for full download</p>

            {/* Example tags */}
            <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3" role="list" aria-label="Example photo styles">
              {EXAMPLES.map(e => (
                <div
                  key={e.label}
                  role="listitem"
                  className="glass flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm"
                >
                  <div className="flex gap-0.5 items-end" aria-hidden="true">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="waveform-bar w-1 rounded-full bg-brand/60"
                        style={{ height: (8 + i * 4) + 'px', animationDelay: i * 0.1 + 's' }}
                      />
                    ))}
                  </div>
                  <span className="text-white/80 whitespace-nowrap">{e.label}</span>
                  <span className="text-brand/80 text-xs hidden sm:inline">{e.genre}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          className="py-14 sm:py-16 px-4 sm:px-6 border-t border-white/5"
          aria-labelledby="how-it-works-heading"
        >
          <div className="max-w-4xl mx-auto">
            <h2 id="how-it-works-heading" className="text-2xl font-bold text-center mb-10">
              How it works
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" role="list">
              {STEPS.map(s => (
                <li key={s.n} className="glass rounded-2xl p-5">
                  <div className="text-3xl font-black text-brand/30 mb-3" aria-hidden="true">{s.n}</div>
                  <div className="font-semibold mb-1">{s.title}</div>
                  <div className="text-sm text-white/50">{s.desc}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Generate widget */}
        <section
          ref={widgetRef}
          id="generate"
          className="py-14 sm:py-16 px-4 sm:px-6"
          aria-labelledby="generate-heading"
        >
          <div className="max-w-2xl mx-auto">
            <h2 id="generate-heading" className="text-2xl font-bold text-center mb-2">
              Try it now
            </h2>
            <p className="text-center text-white/50 text-sm mb-6 sm:mb-8">
              Upload any photo and hear what it sounds like
            </p>

            {/* History sidebar (desktop) */}
            {history.length > 0 && (
              <div className="hidden sm:block mb-6">
                <SongHistory
                  history={history}
                  onRemove={removeSong}
                  onClear={clearHistory}
                />
              </div>
            )}

            {/* Mobile history */}
            {history.length > 0 && (
              <div className="sm:hidden mb-4">
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                  aria-expanded={historyOpen}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent songs ({history.length})
                  <svg className={`w-4 h-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {historyOpen && (
                  <div className="mt-2 space-y-2">
                    {history.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <div className="text-sm font-medium truncate flex-1">{entry.title}</div>
                        <div className="text-xs text-white/40 flex-shrink-0">{entry.genre}</div>
                        <button
                          onClick={() => removeSong(entry.id)}
                          className="text-white/30 hover:text-red-400 transition-colors p-1"
                          aria-label={`Remove ${entry.title} from history`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 'idle' && <PhotoUpload onFile={handleFile} />}

            {step === 'analyzing' && (
              <div className="glass rounded-2xl p-8 sm:p-10 text-center" role="status" aria-live="polite">
                <div className="w-12 h-12 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
                <p className="text-white/70 font-medium">Analysing your photo&hellip;</p>
                <p className="text-white/40 text-sm mt-1">GPT-4 Vision is reading the mood and emotion</p>
              </div>
            )}

            {step === 'generating' && analysis && (
              <div className="glass rounded-2xl p-8 sm:p-10 text-center" role="status" aria-live="polite">
                <div className="w-12 h-12 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
                <p className="text-white/70 font-medium">Composing your song&hellip;</p>
                <p className="text-white/40 text-sm mt-1 mb-4">
                  Suno AI is generating a {analysis.genre} track
                </p>
                <div className="glass-bright rounded-xl p-4 text-left text-sm text-left" role="region" aria-label="AI analysis results">
                  <div className="text-white/40 text-xs mb-2 uppercase tracking-wider font-medium">AI detected</div>
                  <dl className="grid grid-cols-2 gap-2">
                    <div><dt className="text-white/40 inline">Mood:</dt> <dd className="text-white/80 inline ml-1">{analysis.mood}</dd></div>
                    <div><dt className="text-white/40 inline">Genre:</dt> <dd className="text-white/80 inline ml-1">{analysis.genre}</dd></div>
                    <div><dt className="text-white/40 inline">Tempo:</dt> <dd className="text-white/80 inline ml-1">{analysis.tempo}</dd></div>
                    <div><dt className="text-white/40 inline">Instruments:</dt> <dd className="text-white/80 inline ml-1">{analysis.instruments?.slice(0, 2).join(', ')}</dd></div>
                  </dl>
                </div>
                <p className="text-white/30 text-xs mt-4">This takes 1–3 minutes&hellip;</p>
              </div>
            )}

            {step === 'done' && songData && (
              <div className="space-y-4" role="region" aria-label="Generated song">
                <SongPlayer songData={songData} analysis={analysis} />
                <div className="flex items-center justify-between gap-3">
                  <PricingCard songData={songData} />
                  <ShareButton songData={songData} analysis={analysis} />
                </div>
                <button
                  onClick={handleReset}
                  className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Try another photo
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Social proof */}
        <section
          className="py-14 sm:py-16 px-4 sm:px-6 border-t border-white/5"
          aria-labelledby="stats-heading"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 id="stats-heading" className="text-2xl font-bold mb-3">
              What will your photo sound like?
            </h2>
            <p className="text-white/50 mb-8 sm:mb-10">Every image tells a story. Now it tells a song.</p>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { stat: '87%', label: 'Gross margin per song' },
                { stat: '~2 min', label: 'Average generation time' },
                { stat: '$1.99', label: 'Flat price, no subscription' },
              ].map(s => (
                <div key={s.stat} className="glass rounded-2xl p-6">
                  <dt className="text-3xl font-black gradient-text mb-1">{s.stat}</dt>
                  <dd className="text-white/50 text-sm">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Pricing */}
        <section
          className="py-14 sm:py-16 px-4 sm:px-6 border-t border-white/5"
          aria-labelledby="pricing-heading"
        >
          <div className="max-w-3xl mx-auto">
            <h2 id="pricing-heading" className="text-2xl font-bold text-center mb-2">
              Simple pricing
            </h2>
            <p className="text-center text-white/50 text-sm mb-8 sm:mb-10">
              No subscription. Pay only for what you love.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="text-lg font-bold mb-1">Free Preview</div>
                <div className="text-3xl font-black mb-4">$0</div>
                <ul className="space-y-2 text-sm text-white/60" role="list">
                  {[
                    'Unlimited uploads',
                    'AI photo analysis',
                    '30-second song preview',
                    { text: 'Full song download', disabled: true },
                  ].map((item, i) => (
                    <li key={i} className={`flex gap-2 ${item.disabled ? 'text-white/30' : ''}`}>
                      <span className={item.disabled ? 'text-white/30' : 'text-green-400'}>
                        {item.disabled ? '✗' : '✓'}
                      </span>
                      {typeof item === 'string' ? item : item.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-bright rounded-2xl p-6 border border-brand/30 relative">
                <div className="absolute top-4 right-4 bg-brand text-white text-xs px-2 py-0.5 rounded-full" aria-label="Most popular option">
                  Popular
                </div>
                <div className="text-lg font-bold mb-1">Full Download</div>
                <div className="text-3xl font-black mb-4">$1.99</div>
                <ul className="space-y-2 text-sm text-white/60" role="list">
                  {[
                    'Full-length MP3 (2–3 min)',
                    'Commercial use rights',
                    'Instant download',
                    'Unique — never repeated',
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToWidget}
                  className="btn-primary w-full mt-6 py-3 text-sm"
                >
                  Create your song
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-white/30 text-sm" role="contentinfo">
        <p>PhotoSound &mdash; Every photo has a sound.</p>
        <p className="mt-1">Powered by GPT-4 Vision + Suno AI</p>
      </footer>
    </>
  );
}
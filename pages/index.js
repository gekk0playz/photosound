import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';

const STEPS = [
  { n: '01', title: 'Upload any photo', desc: 'Selfie, landscape, pet, artwork â anything.' },
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
  const [step, setStep] = useState('idle');
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [songData, setSongData] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [mainPlaying, setMainPlaying] = useState(false);
  const [mainTime, setMainTime] = useState(0);
  const widgetRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRefs = useRef({});
  const mainAudioRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ps_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const saveToHistory = (song, ana) => {
    const entry = {
      id: song.songId || `local_${Date.now()}`,
      title: song.title,
      genre: ana?.genre,
      mood: ana?.mood,
      audioPreviewUrl: song.audioPreviewUrl,
      coverUrl: song.coverUrl,
      createdAt: new Date().toISOString(),
      demo: song.demo,
    };
    setHistory(prev => {
      const next = [entry, ...prev.filter(s => s.id !== entry.id)].slice(0, 10);
      try { localStorage.setItem('ps_history', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const scrollTo = () => {
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
    setError('');
    setStep('analyzing');
    scrollTo();
    processFile(selectedFile);
  };

  const processFile = async (selectedFile) => {
    try {
      const fd = new FormData();
      fd.append('image', selectedFile);
      const r1 = await fetch('/api/analyze', { method: 'POST', body: fd });
      if (!r1.ok) {
        const d = await r1.json().catch(() => ({}));
        throw new Error(d.error || 'Analysis failed');
      }
      const data = await r1.json();
      setAnalysis(data);
      setStep('generating');
      const r2 = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: data.suno_prompt, tags: data.tags, title: data.title_suggestion }),
      });
      if (!r2.ok) {
        const d = await r2.json().catch(() => ({}));
        throw new Error(d.error || 'Generation failed');
      }
      const song = await r2.json();
      setSongData(song);
      setStep('done');
      saveToHistory(song, data);
    } catch (err) {
      showToast(err.message || 'Something went wrong. Please try again.');
      setStep('idle');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      showToast('Please upload an image file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      showToast('File too large. Maximum size is 10MB.');
      return;
    }
    handleFileSelected(f);
  };

  const handleReset = () => {
    if (mainAudioRef.current) {
      mainAudioRef.current.pause();
      mainAudioRef.current = null;
      setMainPlaying(false);
      setMainTime(0);
    }
    setStep('idle');
    setFile(null);
    setAnalysis(null);
    setSongData(null);
    setError('');
  };

  const handleMainPlay = () => {
    if (!songData?.audioPreviewUrl) return;
    if (mainAudioRef.current && mainPlaying) {
      mainAudioRef.current.pause();
      setMainPlaying(false);
      return;
    }
    if (!mainAudioRef.current) {
      const audio = new Audio(songData.audioPreviewUrl);
      const previewSec = songData.previewSeconds || 30;
      audio.addEventListener('timeupdate', () => {
        setMainTime(Math.floor(audio.currentTime));
        if (audio.currentTime >= previewSec) {
          audio.pause();
          audio.currentTime = 0;
          setMainPlaying(false);
          setMainTime(0);
        }
      });
      audio.addEventListener('ended', () => { setMainPlaying(false); setMainTime(0); });
      mainAudioRef.current = audio;
    }
    mainAudioRef.current.play().then(() => setMainPlaying(true)).catch(() => {
      showToast('Could not play audio preview.');
      setMainPlaying(false);
    });
  };

  const handleShare = async () => {
    const text = `Check out my PhotoSound song "${songData?.title}" â AI-generated from a photo!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: songData?.title, text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {}
  };

  const playHistory = (entry) => {
    if (playingId === entry.id) {
      const a = audioRefs.current[entry.id];
      if (a) { a.pause(); a.currentTime = 0; }
      setPlayingId(null);
      return;
    }
    if (audioRefs.current[playingId]) {
      audioRefs.current[playingId].pause();
      audioRefs.current[playingId].currentTime = 0;
    }
    const a = audioRefs.current[entry.id] || new Audio(entry.audioPreviewUrl);
    audioRefs.current[entry.id] = a;
    a.currentTime = 0;
    a.play().then(() => setPlayingId(entry.id)).catch(() => {
      showToast('Could not play this audio.');
      setPlayingId(null);
    });
    a.onended = () => setPlayingId(null);
  };

  const removeHistory = (id) => {
    setHistory(prev => {
      const next = prev.filter(s => s.id !== id);
      try { localStorage.setItem('ps_history', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('ps_history'); } catch {}
  };

  const bg = darkMode ? 'bg-[#0a0a0f]' : 'bg-[#f8f7ff]';
  const text = darkMode ? 'text-white' : 'text-[#1a1625]';
  const textMuted = darkMode ? 'text-white/50' : 'text-[#1a1625]/50';
  const glass = darkMode
    ? 'bg-white/[0.04] border-white/[0.08]'
    : 'bg-white/80 border-[rgba(184,78,241,0.15)]';
  const glassBright = darkMode
    ? 'bg-white/[0.07] border-white/[0.12]'
    : 'bg-white/95 border-[rgba(184,78,241,0.2)]';

  return (
    <>
      <Head>
        <title>PhotoSound â Turn any photo into a song</title>
        <meta name="description" content="Upload any photo. AI analyses its vibe and generates a unique original song that matches it. Free 30-second preview, $1.99 for the full download." />
        <meta property="og:title" content="PhotoSound â Turn any photo into a song" />
        <meta property="og:description" content="Every photo has a sound. Upload yours and hear it." />
        <meta property="og:image" content="/og-image.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style>{`
        :root { ${darkMode ? '' : ''} }
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .waveform-bar { animation: waveform 1.2s ease-in-out infinite; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-md text-sm transition-all duration-300 ${
            darkMode ? 'bg-black/90' : 'bg-white/95'
          } ${toast.type === 'error' ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400'}`}
          role="alert"
          aria-live="polite"
        >
           {toast.type === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          )}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">â</button>
        </div>
      )}

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 ${darkMode ? 'bg-black/70 border-b border-white/5' : 'bg-white/80 border-b border-[rgba(184,78,241,0.1)]'} backdrop-blur-md`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b84ef1] to-[#7c3aed] flex items-center justify-center text-white font-bold text-sm">PS</div>
          <span className="font-semibold">PhotoSound</span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all ${
                showHistory
                  ? `${darkMode ? 'bg-white/10 text-white' : 'bg-[rgba(184,78,241,0.1)] text-[#1a1625]'}`
                  : `${textMuted} hover:${darkMode ? 'bg-white/5 text-white' : 'bg-[rgba(184,78,241,0.08)] text-[#1a1625]'}`
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="hidden md:inline">History</span>
              <span className="text-xs bg-[#b84ef1]/30 px-1.5 py-0.5 rounded-full">{history.length}</span>
            </button>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl ${darkMode ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-[#1a1625]/40 hover:text-[#1a1625] hover:bg-[rgba(184,78,241,0.08)]'} transition-all`}
            aria-label="Toggle dark/light mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <button onClick={scrollTo} className="btn-primary text-sm px-4 py-2">Try it free</button>
        </div>
      </nav>

      <main className={`min-h-screen ${bg} ${text} pt-16`}>

        {/* Hero */}
        <section className="relative pt-20 sm:pt-28 pb-14 px-4 sm:px-6 text-center overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,78,241,0.25) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-white/60 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              AI-powered &middot; Instant generation
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
              What does your{' '}
              <span className="gradient-text">favourite photo</span>
              <br className="hidden sm:inline" /> sound like?
            </h1>
            <p className="text-base sm:text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Upload any image. AI analyses its vibe, mood, and emotion
              then generates a full original song that matches it.
            </p>
            <button onClick={scrollTo} className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center gap-2">
              Turn your photo into a song
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <p className="mt-3 text-sm text-white/40">Free preview &middot; $1.99 for full download</p>

            {/* Examples */}
            <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
              {EXAMPLES.map(e => (
                <div key={e.label} className={`${glass} flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm`}>
                  <div className="flex gap-0.5 items-end" aria-hidden="true">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="waveform-bar w-1 rounded-full bg-[#b84ef1]/60" style={{ height: (8 + i * 4) + 'px', animationDelay: i * 0.1 + 's' }} />
                    ))}
                  </div>
                  <span className={darkMode ? 'text-white/80' : 'text-[#1a1625]/80'}>{e.label}</span>
                  <span className="text-[#b84ef1]/80 text-xs hidden sm:inline">{e.genre}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className={`py-14 sm:py-16 px-4 sm:px-6 border-t ${darkMode ? 'border-white/5' : 'border-[rgba(184,78,241,0.08)]'}`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {STEPS.map(s => (
                <li key={s.n} className={`${glass} rounded-2xl p-5`}>
                  <div className="text-3xl font-black text-[#b84ef1]/30 mb-3" aria-hidden="true">{s.n}</div>
                  <div className="font-semibold mb-1">{s.title}</div>
                  <div className="text-sm text-white/50">{s.desc}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Generate */}
        <section ref={widgetRef} id="generate" className="py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Try it now</h2>
            <p className="text-center text-white/50 text-sm mb-6 sm:mb-8">Upload any photo and hear what it sounds like</p>

            {/* History */}
            {history.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-2 text-sm ${textMuted} hover:${text} transition-colors mb-2`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Recent songs ({history.length})
                  <svg className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showHistory && (
                  <div className="space-y-2">
                    {history.map(entry => (
                      <div key={entry.id} className={`${glass} flex items-center gap-3 p-3 rounded-xl group`}>
                        <button
                          onClick={() => playHistory(entry)}
                          className="w-9 h-9 rounded-full bg-[#b84ef1]/20 flex items-center justify-center flex-shrink-0 hover:bg-[#b84ef1]/30 transition-colors"
                        >
                          {playingId === entry.id ? (
                            <svg className="w-4 h-4 text-[#b84ef1]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-[#b84ef1] ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{entry.title}</div>
                          <div className="text-xs text-white/40 truncate">{entry.genre || 'Unknown'} &bull; {new Date(entry.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button
                          onClick={() => removeHistory(entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-2"
                          aria-label="Remove from history"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                    <button onClick={clearHistory} className="text-xs text-white/30 hover:text-red-400 transition-colors">Clear history</button>
                  </div>
                )}
              </div>
            )}

            {/* Idle â Upload */}
            {step === 'idle' && (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`${glass} rounded-2xl p-10 sm:p-12 text-center cursor-pointer border-2 border-dashed transition-all duration-200 ${
                  dragOver
                    ? 'border-[#b84ef1] bg-[#b84ef1]/10 scale-[1.01]'
                    : `border-white/10 hover:border-[#b84ef1]/50 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-[rgba(184,78,241,0.05)]'}`
                }`}
              >
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#b84ef1]/20 border border-[#b84ef1]/30 flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#b84ef1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="font-semibold mb-1">{dragOver ? 'Drop your photo here' : 'Upload any photo'}</p>
                <p className="text-sm text-white/50 mb-3">Drag and drop, or click to browse</p>
                <p className="text-xs text-white/30">JPG, PNG, GIF, WebP &bull; Max 10MB</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={e => handleFileSelected(e.target.files?.[0])} />
              </div>
            )}

            {/* Analyzing */}
            {step === 'analyzing' && (
              <div className={`${glass} rounded-2xl p-10 text-center`} role="status" aria-live="polite">
                <div className="w-12 h-12 border-2 border-[#b84ef1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-medium">Analysing your photo&hellip;</p>
                <p className="text-sm text-white/40 mt-1">GPT-4 Vision is reading the mood and emotion</p>
              </div>
            )}

            {/* Generating */}
            {step === 'generating' && analysis && (
              <div className={`${glass} rounded-2xl p-8 sm:p-10 text-center`} role="status" aria-live="polite">
                <div className="w-12 h-12 border-2 border-[#b84ef1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-medium">Composing your song&hellip;</p>
                <p className="text-sm text-white/40 mt-1 mb-4">Suno AI is generating a {analysis.genre} track</p>
                <div className={`${glassBright} rounded-xl p-4 text-left text-sm`}>
                  <div className="text-white/40 text-xs mb-2 uppercase tracking-wider font-medium">AI detected</div>
                  <dl className="grid grid-cols-2 gap-2">
                    <div><dt className="text-white/40 inline">Mood:</dt> <dd className="text-white/80 inline ml-1">{analysis.mood}</dd></div>
                    <div><dt className="text-white/40 inline">Genre:</dt> <dd className="text-white/80 inline ml-1">{analysis.genre}</dd></div>
                    <div><dt className="text-white/40 inline">Tempo:</dt> <dd className="text-white/80 inline ml-1">{analysis.tempo}</dd></div>
                    <div><dt className="text-white/40 inline">Instruments:</dt> <dd className="text-white/80 inline ml-1">{analysis.instruments?.slice(0, 2).join(', ')}</dd></div>
                  </dl>
                </div>
                <p className="text-white/30 text-xs mt-4">This takes 1â3 minutes&hellip;</p>
              </div>
            )}

            {/* Done */}
            {step === 'done' && songData && (
              <div className="space-y-4" role="region" aria-label="Generated song">
                {/* Song Player */}
                <div className={`${glass} rounded-2xl p-6`}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-xl bg-[#b84ef1]/20 border border-[#b84ef1]/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {songData.coverUrl ? (
                        <img src={songData.coverUrl} alt="cover" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="flex gap-0.5 items-end pb-1">
                          {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
                            <div key={i} className={`w-1 rounded-sm bg-[#b84ef1] ${mainPlaying ? 'waveform-bar' : ''}`} style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{songData.title}</div>
                      {analysis && <div className="text-sm text-white/50 truncate">{analysis.genre} &bull; {analysis.mood}</div>}
                      {songData.demo && <div className="text-xs text-[#b84ef1]/70 mt-0.5">Demo mode</div>}
                    </div>
                  </div>

                  {/* Waveform progress */}
                  <div className="mb-3 h-8 flex items-center gap-px">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const heights = [4, 6, 8, 5, 9, 7, 10, 6, 8, 5, 7, 9, 6, 10, 8, 5, 7, 6, 9, 8, 5, 7, 10, 6, 8, 7, 5, 9, 6, 8, 10, 7, 5, 8, 6, 9, 7, 10, 5, 8, 6, 7, 9, 5, 8, 10, 6, 7, 8, 5, 9, 6, 8, 7, 10, 5, 8, 6, 9, 7];
                      const h = heights[i] || 6;
                      const previewSec = songData.previewSeconds || 30;
                      const filled = mainTime / previewSec > i / 60;
                      return <div key={i} className="flex-1 rounded-full transition-colors" style={{ height: `${h * 2.5}px`, backgroundColor: filled ? 'rgb(184,78,241)' : 'rgba(184,78,241,0.25)' }} />;
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleMainPlay}
                      className="w-10 h-10 rounded-full bg-[#b84ef1] hover:bg-[#b84ef1]/80 flex items-center justify-center transition-colors"
                      aria-label={mainPlaying ? 'Pause preview' : 'Play preview'}
                    >
                      {mainPlaying ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      )}
                    </button>
                    <div className="text-xs text-white/40 font-mono">
                      {String(Math.floor(mainTime / 60)).padStart(1, '0')}:{String(mainTime % 60).padStart(2, '0')} / 0:{String(songData.previewSeconds || 30).padStart(2, '0')}
                    </div>
                    <div className="ml-auto text-xs text-white/40 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      {songData.previewSeconds || 30}s preview
                    </div>
                  </div>
                </div>

                {/* Buy + Share */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={scrollTo}
                    className="btn-primary flex-1 py-4 text-base font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Buy full song &mdash; $1.99
                  </button>
                  <button
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-4 py-4 rounded-xl text-sm ${glass} ${textMuted} hover:${text} transition-all`}
                    aria-label="Share your song"
                  >
                    {copied ? (
                      <><svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-green-400">Copied!</span></>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 13.003 9 12.632 9 12.25c0-.382-.114-.753-.326-1.053M15.684 13.342c.102.339.102.71 0 1.053M15.684 17.158C15.886 16.819 16 16.447 16 16.065c0-.382-.114-.753-.326-1.053M8.684 17.158c-.102.339-.102.71 0 1.053M12 10.75c0 1.035-.403 1.954-1.045 2.604L12 14l1.045-.646A2.5 2.5 0 0012 10.75zM12 21.75c0-.382-.114-.753-.326-1.053M12 24c.551 0 1-.449 1-1s-.449-1-1-1-1 .449-1 1 .449 1 1 1z" /></svg>Share</>
                    )}
                  </button>
                </div>

                <button onClick={handleReset} className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors">
                  Try another photo
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Social proof */}
        <section className={`py-14 sm:py-16 px-4 sm:px-6 border-t ${darkMode ? 'border-white/5' : 'border-[rgba(184,78,241,0.08)]'}`}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">What will your photo sound like?</h2>
            <p className="text-white/50 mb-8 sm:mb-10">Every image tells a story. Now it tells a song.</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { stat: '~2 min', label: 'Average generation time' },
                { stat: '$1.99', label: 'Flat price, no subscription' },
              ].map(s => (
                <div key={s.stat} className={`${glass} rounded-2xl p-6`}>
                  <dt className="text-3xl font-black gradient-text mb-1">{s.stat}</dt>
                  <dd className="text-white/50 text-sm">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Pricing */}
        <section className={`py-14 sm:py-16 px-4 sm:px-6 border-t ${darkMode ? 'border-white/5' : 'border-[rgba(184,78,241,0.08)]'}`}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Simple pricing</h2>
            <p className="text-center text-white/50 text-sm mb-8 sm:mb-10">No subscription. Pay only for what you love.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className={`${glass} rounded-2xl p-6`}>
                <div className="text-lg font-bold mb-1">Free Preview</div>
                <div className="text-3xl font-black mb-4">$0</div>
                <ul className="space-y-2 text-sm text-white/60" role="list">
                  {['Unlimited uploads', 'AI photo analysis', '30-second song preview', { text: 'Full song download', disabled: true }].map((item, i) => (
                    <li key={i} className={`flex gap-2 ${item.disabled ? 'text-white/30' : ''}`}>
                      <span className={item.disabled ? 'text-white/30' : 'text-green-400'}>{item.disabled ? 'â' : 'â'}</span>
                      {typeof item === 'string' ? item : item.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${glassBright} rounded-2xl p-6 border border-[#b84ef1]/30 relative`}>
                <div className="absolute top-4 right-4 bg-[#b84ef1] text-white text-xs px-2 py-0.5 rounded-full">Popular</div>
                <div className="text-lg font-bold mb-1">Full Download</div>
                <div className="text-3xl font-black mb-4">$1.99</div>
                <ul className="space-y-2 text-sm text-white/60" role="list">
                  {['Full-length MP3 (2â3 min)', 'Commercial use rights', 'Instant download', 'Unique â never repeated'].map((item, i) => (
                    <li key={i} className="flex gap-2"><span className="text-green-400">â</span>{item}</li>
                  ))}
                </ul>
                <button onClick={scrollTo} className="btn-primary w-full mt-6 py-3 text-sm">Create your song</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={`py-8 px-6 border-t ${darkMode ? 'border-white/5 text-white/30' : 'border-[rgba(184,78,241,0.08)] text-[#1a1625]/30'} text-center text-sm`}>
        <p>PhotoSound &mdash; Every photo has a sound.</p>
        <p className="mt-1">Powered by GPT-4 Vision + Suno AI</p>
      </footer>

      <style jsx global>{`
        .btn-primary {
          background: linear-gradient(135deg, #b84ef1, #7c3aed);
          box-shadow: 0 4px 20px rgba(184, 78, 241, 0.4);
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(184, 78, 241, 0.55); }
        .btn-primary:active { transform: translateY(0); }
        .gradient-text {
          background: linear-gradient(135deg, #d07bf8 0%, #818cf8 50%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </>
  );
}

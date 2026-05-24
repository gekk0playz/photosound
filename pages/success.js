import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Download, Music, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Success() {
  const router = useRouter();
  const { session_id, song_id } = router.query;
  const [status, setStatus] = useState('verifying');
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session_id || !song_id) return;
    (async () => {
      try {
        const res = await fetch(`/api/verify-payment?session_id=${session_id}&song_id=${song_id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAudioUrl(data.audioUrl);
        setStatus('ready');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    })();
  }, [session_id, song_id]);

  return (
    <>
      <Head>
        <title>Your song is ready — PhotoSound</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-5"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(74,222,128,0.08) 0%, transparent 60%), #0a0a0f' }}>
        <div className="w-full max-w-md glass-bright rounded-3xl p-8 text-center">
          {status === 'verifying' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-500/15 flex items-center justify-center">
                <span className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin block" />
              </div>
              <p className="text-white/60">Verifying your payment…</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle size={36} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white mb-2">Your song is ready!</h1>
                <p className="text-white/50 text-sm">High quality MP3 · Commercial rights included</p>
              </div>
              <a
                href={audioUrl}
                download="photosound.mp3"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                <Download size={20} />
                Download Full Song
              </a>
              <Link href="/" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-all">
                <ArrowLeft size={14} />
                Generate another
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-white/70 font-semibold">Something went wrong</p>
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-white/40 text-xs">
                If you were charged, email <a href="mailto:hello@photosound.app" className="text-brand-400">hello@photosound.app</a> with your receipt and we'll sort it out.
              </p>
              <Link href="/" className="block w-full py-3 rounded-xl text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-all text-center">
                ← Back home
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

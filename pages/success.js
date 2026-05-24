import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const router = useRouter();
  const { session_id, song_id } = router.query;
  const [state, setState] = useState('loading'); // loading | verified | error
  const [downloadUrl, setDownloadUrl] = useState('');
  const [songTitle, setSongTitle] = useState('Your Song');

  useEffect(() => {
    if (!session_id || !song_id) return;
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session_id, songId: song_id }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.verified && d.downloadUrl) {
          setDownloadUrl(d.downloadUrl);
          setSongTitle(d.title || 'Your Song');
          setState('verified');
        } else {
          setState('error');
        }
      })
      .catch(() => setState('error'));
  }, [session_id, song_id]);

  return (
    <>
      <Head>
        <title>Download ready — PhotoSound</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full glass rounded-3xl p-8 text-center">

          {/* Nav back */}
          <div className="mb-8">
            <a href="/" className="text-white/40 text-sm hover:text-white/60 transition-colors flex items-center gap-1 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to PhotoSound
            </a>
          </div>

          {state === 'loading' && (
            <>
              <div className="w-14 h-14 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-xl font-bold mb-2">Verifying payment...</h1>
              <p className="text-white/50 text-sm">Preparing your download</p>
            </>
          )}

          {state === 'verified' && (
            <>
              <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Payment confirmed!</h1>
              <p className="text-white/60 mb-2">{songTitle}</p>
              <p className="text-white/40 text-sm mb-8">Your full song is ready to download</p>

              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-4 text-base inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download MP3
              </a>

              <p className="mt-4 text-white/30 text-xs">
                Link expires in 24 hours. Save it now.
              </p>

              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-white/40 text-sm mb-4">Create another song?</p>
                <a href="/" className="text-brand hover:text-brand/80 text-sm font-medium transition-colors">
                  Upload a new photo
                </a>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="w-14 h-14 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-2">Could not verify payment</h1>
              <p className="text-white/50 text-sm mb-8">
                If you were charged, please contact support with your session ID:
                <br />
                <code className="mt-2 block text-xs text-white/30 break-all">{session_id}</code>
              </p>
              <a href="/" className="btn-primary w-full py-3 inline-block">
                Back to home
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}

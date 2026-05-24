import { useState } from 'react';

export default function PricingCard({ songData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuy = async () => {
    if (!songData?.songId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: songData.songId,
          songUrl: songData.songUrl,
          title: songData.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      if (data.url) {
        window.location.href = data.url;
      } else if (data.demo) {
        // Demo mode: redirect directly
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 glass-bright rounded-2xl p-5 border border-brand/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-sm">Full Song Download</div>
          <div className="text-white/50 text-xs">MP3 &bull; 2-3 min &bull; Commercial use</div>
        </div>
        <div className="text-2xl font-black gradient-text">$1.99</div>
      </div>

      <ul className="space-y-1.5 mb-4 text-xs text-white/60">
        {[
          'Full-length MP3 (not just 30 seconds)',
          'Unique — generated only for your photo',
          'Commercial use rights included',
          'Instant download via secure link',
        ].map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      {error && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <button
        onClick={handleBuy}
        disabled={loading}
        className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        aria-label="Buy full song for $1.99"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            Redirecting to checkout&hellip;
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Buy full song &mdash; $1.99
          </>
        )}
      </button>

      <p className="mt-2 text-center text-white/30 text-xs">
        Secure payment via Stripe
      </p>
    </div>
  );
}
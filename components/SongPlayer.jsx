import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Download, Lock, SkipBack } from 'lucide-react';

const WaveformBars = ({ isPlaying, count = 28 }) => (
  <div className="flex items-center gap-[3px] h-10">
    {Array.from({ length: count }).map((_, i) => {
      const height = isPlaying
        ? `${20 + Math.sin(i * 0.6) * 14}%`
        : `${8 + Math.sin(i * 0.5) * 6}%`;
      const delay = `${(i * 0.05).toFixed(2)}s`;
      return (
        <div
          key={i}
          className="waveform-bar flex-1"
          style={{
            height: isPlaying ? undefined : height,
            minHeight: '4px',
            animationDelay: delay,
            animationPlayState: isPlaying ? 'running' : 'paused',
            opacity: isPlaying ? 1 : 0.35,
            transition: 'height 0.3s ease',
          }}
        />
      );
    })}
  </div>
);

export default function SongPlayer({ audioUrl, previewSeconds, title, coverUrl, songId, tier, onBuyClick }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const effectiveMax = tier === 'paid' ? duration : Math.min(previewSeconds || 30, duration || 30);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (tier !== 'paid' && audio.currentTime >= effectiveMax) {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
        setLocked(true);
      }
    };
    const onEnd = () => { setPlaying(false); setCurrentTime(0); };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [effectiveMax, tier]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setLocked(false);
      setLoading(true);
      try {
        await audio.play();
        setPlaying(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  }, [playing]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    setLocked(false);
  }, []);

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / effectiveMax) * 100 : 0;

  return (
    <div className="glass-bright rounded-2xl overflow-hidden glow-purple-sm">
      {/* Album art / cover */}
      <div className="relative aspect-square max-h-64 bg-gradient-to-br from-brand-800/60 via-brand-900/40 to-indigo-900/60">
        {coverUrl ? (
          <img src={coverUrl} alt="Album art" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-brand-500/20 flex items-center justify-center animate-pulse-slow">
              <div className="w-16 h-16 rounded-full bg-brand-500/30 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-brand-400/50" />
              </div>
            </div>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent" />
        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white font-bold text-lg leading-tight drop-shadow-lg">{title || 'Your PhotoSound'}</p>
          <p className="text-brand-300 text-xs mt-0.5 font-medium">AI-generated · PhotoSound</p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-5 space-y-4">
        {/* Waveform */}
        <WaveformBars isPlaying={playing} />

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, progress)}%`,
                background: 'linear-gradient(90deg, #b84ef1, #7c3aed)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40 font-mono">
            <span>{fmt(currentTime)}</span>
            <span>{tier === 'free' ? `${fmt(effectiveMax)} preview` : fmt(duration)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={restart}
            className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition-colors"
          >
            <SkipBack size={16} className="text-white/60" />
          </button>

          <button
            onClick={togglePlay}
            disabled={loading}
            className="flex-1 h-12 rounded-xl btn-primary flex items-center justify-center gap-2 text-sm font-semibold"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : playing ? (
              <><Pause size={18} /> Pause</>
            ) : (
              <><Play size={18} /> {locked ? 'Replay Preview' : 'Play'}</>
            )}
          </button>
        </div>

        {/* Lock / Download CTA */}
        {tier === 'free' ? (
          <div className={`rounded-xl overflow-hidden transition-all duration-500 ${locked ? 'opacity-100 scale-100' : 'opacity-80 scale-[0.99]'}`}>
            <div className="glass px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                <Lock size={16} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm font-medium leading-tight">
                  {locked ? 'Preview ended. Love it?' : `Full song · ${fmt(duration || 120)}`}
                </p>
                <p className="text-white/40 text-xs">High-quality MP3 · no watermark</p>
              </div>
              <button
                onClick={onBuyClick}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white flex-shrink-0 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #b84ef1, #7c3aed)' }}
              >
                $1.99
              </button>
            </div>
          </div>
        ) : (
          <a
            href={audioUrl}
            download={`${title || 'photosound'}.mp3`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 text-sm font-semibold transition-all hover:scale-[1.02]"
          >
            <Download size={16} /> Download Full Song
          </a>
        )}
      </div>

      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" />
    </div>
  );
}

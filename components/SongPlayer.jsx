import { useState, useRef, useEffect } from 'react';

export default function SongPlayer({ songData, analysis }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [locked, setLocked] = useState(false);
  const previewLimit = songData?.previewSeconds || 30;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= previewLimit) {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
        setLocked(true);
      }
    };

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [previewLimit]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (locked) return;
    if (playing) {
      audio.pause();
    } else {
      setLocked(false);
      audio.currentTime = Math.min(currentTime, previewLimit - 0.1);
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = Math.min(ratio * (duration || previewLimit), previewLimit - 0.1);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setLocked(false);
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration ? currentTime / duration : currentTime / previewLimit;
  const previewProgress = previewLimit / (duration || previewLimit);

  return (
    <div className="glass rounded-2xl p-6">
      {/* Song info */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {songData?.coverUrl ? (
            <img src={songData.coverUrl} alt="cover" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <div className="flex gap-0.5 items-end pb-1">
              {[3,5,4,6,3,5,4].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-sm bg-brand"
                  style={{
                    height: playing ? `${h * 3}px` : '8px',
                    transition: 'height 0.3s ease',
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{songData?.title || 'Your Song'}</div>
          {analysis && (
            <div className="text-sm text-white/50 truncate">
              {analysis.genre} &bull; {analysis.mood}
            </div>
          )}
          {songData?.demo && (
            <div className="text-xs text-brand/70 mt-0.5">Demo mode — add API keys for real generation</div>
          )}
        </div>
      </div>

      {/* Waveform / progress bar */}
      <div className="mb-3 cursor-pointer" onClick={handleSeek}>
        <div className="relative h-8 flex items-center gap-px">
          {/* Fake waveform bars */}
          {Array.from({length: 60}).map((_, i) => {
            const barProgress = i / 60;
            const heights = [4,6,8,5,9,7,10,6,8,5,7,9,6,10,8,5,7,6,9,8,5,7,10,6,8,7,5,9,6,8,10,7,5,8,6,9,7,10,5,8,6,7,9,5,8,10,6,7,8,5,9,6,8,7,10,5,8,6,9,7];
            const h = heights[i] || 6;
            const isPlayed = barProgress <= progress;
            const isPreview = barProgress <= previewProgress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors duration-100"
                style={{
                  height: `${h * 2.5}px`,
                  backgroundColor: isPlayed
                    ? '#b84ef1'
                    : isPreview
                    ? 'rgba(184,78,241,0.3)'
                    : 'rgba(255,255,255,0.1)',
                }}
              />
            );
          })}
          {/* Locked overlay */}
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-sm">
              <span className="text-xs text-white/70 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Preview ended
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={locked}
          className="w-10 h-10 rounded-full bg-brand hover:bg-brand/80 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {playing ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex items-center gap-1 text-xs text-white/40 font-mono">
          <span>{fmt(currentTime)}</span>
          <span>/</span>
          <span>{fmt(previewLimit)}</span>
        </div>

        <div className="ml-auto text-xs text-white/40 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          {fmt(previewLimit)} preview
        </div>
      </div>

      <audio ref={audioRef} src={songData?.audioPreviewUrl} preload="metadata" />
    </div>
  );
}

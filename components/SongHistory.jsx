import { useState, useEffect } from 'react';

const STORAGE_KEY = 'photosound_history';

export function useSongHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const addSong = (songData, analysis) => {
    const entry = {
      id: songData.songId || `local_${Date.now()}`,
      title: songData.title,
      genre: analysis?.genre,
      mood: analysis?.mood,
      audioPreviewUrl: songData.audioPreviewUrl,
      coverUrl: songData.coverUrl,
      createdAt: new Date().toISOString(),
      demo: songData.demo,
    };

    setHistory(prev => {
      const updated = [entry, ...prev.filter(s => s.id !== entry.id)].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage full or unavailable
      }
      return updated;
    });
  };

  const removeSong = (id) => {
    setHistory(prev => {
      const updated = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage unavailable
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
  };

  return { history, addSong, removeSong, clearHistory };
}

function HistoryItem({ entry, onPlay, onRemove }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = { current: null };
  const audioEl = typeof Audio !== 'undefined' ? new Audio(entry.audioPreviewUrl) : null;

  const handlePlay = () => {
    if (!audioEl) return;
    if (playing) {
      audioEl.pause();
      setPlaying(false);
    } else {
      audioEl.currentTime = 0;
      audioEl.play().then(() => setPlaying(true)).catch(() => {});
      audioEl.onended = () => setPlaying(false);
    }
  };

  const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors group">
      <button
        onClick={handlePlay}
        className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0 hover:bg-brand/30 transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg className="w-4 h-4 text-brand" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-brand ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{entry.title}</div>
        <div className="text-xs text-white/40 truncate">
          {entry.genre || 'Unknown'} &bull; {dateStr}
          {entry.demo && <span className="text-brand/50 ml-1">(demo)</span>}
        </div>
      </div>
      <button
        onClick={() => onRemove(entry.id)}
        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-2"
        aria-label="Remove from history"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

export default function SongHistory({ history, onPlay, onRemove, onClear }) {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left px-2 py-1 mb-2 text-xs text-white/40 hover:text-white/60 transition-colors"
        aria-expanded={expanded}
      >
        <span>Recent songs ({history.length})</span>
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-2">
          {history.map(entry => (
            <HistoryItem key={entry.id} entry={entry} onPlay={onPlay} onRemove={onRemove} />
          ))}
          <button
            onClick={onClear}
            className="text-xs text-white/30 hover:text-red-400 transition-colors"
          >
            Clear history
          </button>
        </div>
      )}
    </div>
  );
}
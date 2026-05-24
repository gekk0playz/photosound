import { useRef, useState } from 'react';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_MB = 10;

export default function PhotoUpload({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const validate = (file) => {
    if (!ACCEPTED.includes(file.type)) {
      setError('Please upload a JPG, PNG, GIF, or WebP image.');
      return false;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleFile = (file) => {
    if (!file) return;
    setError('');
    if (!validate(file)) return;
    onFile(file);
  };

  const onInputChange = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          glass rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          border-2 border-dashed
          ${dragging
            ? 'border-brand bg-brand/10 scale-[1.01]'
            : 'border-white/10 hover:border-brand/50 hover:bg-white/5'
          }
        `}
      >
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <p className="text-white font-semibold mb-1">
          {dragging ? 'Drop your photo here' : 'Upload any photo'}
        </p>
        <p className="text-white/50 text-sm mb-3">
          Drag and drop, or click to browse
        </p>
        <p className="text-white/30 text-xs">
          JPG, PNG, GIF, WebP &bull; Max {MAX_MB}MB
        </p>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={onInputChange}
        className="hidden"
      />
    </div>
  );
}

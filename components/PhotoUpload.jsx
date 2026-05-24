import { useRef, useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

export default function PhotoUpload({ onFileSelect, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e) => {
    handleFile(e.target.files[0]);
  }, [handleFile]);

  const clearPhoto = useCallback((e) => {
    e.stopPropagation();
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onFileSelect]);

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
        ${dragOver
          ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
          : preview
            ? 'border-brand-600/40 bg-transparent'
            : 'border-white/15 bg-white/[0.02] hover:border-brand-500/50 hover:bg-brand-500/5'}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
      style={{ minHeight: '280px' }}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {preview ? (
        <>
          <img
            src={preview}
            alt="Your photo"
            className="w-full h-full object-cover"
            style={{ maxHeight: '420px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button
            onClick={clearPhoto}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-500/80 transition-colors"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-4 left-4 text-sm text-white/70 font-medium">
            Click to change photo
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full py-16 gap-5 select-none">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
            ${dragOver ? 'bg-brand-500/30 scale-110' : 'bg-white/[0.06]'}`}>
            {dragOver
              ? <ImageIcon size={36} className="text-brand-400" />
              : <Upload size={36} className="text-white/40" />}
          </div>
          <div className="text-center">
            <p className="text-white/80 font-semibold text-lg">
              {dragOver ? 'Drop it here' : 'Drop your photo here'}
            </p>
            <p className="text-white/40 text-sm mt-1">
              or click to browse · JPG, PNG, GIF, WebP · max 10 MB
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            {['🌅 Sunset', '🏙️ City', '🌲 Nature', '🐾 Pets', '💃 Portraits'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/[0.05] text-white/40 text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

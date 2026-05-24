import { useEffect, useState } from 'react';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'error', duration = 5000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  const handleRemove = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const icons = {
    error: (
      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const borderColors = {
    error: 'border-red-500/30',
    success: 'border-green-500/30',
    info: 'border-blue-500/30',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md
        bg-black/80 ${borderColors[toast.type] || borderColors.error}
        transition-all duration-300
        ${exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        shadow-lg
      `}
    >
      {icons[toast.type] || icons.error}
      <p className="text-sm text-white/90 flex-1 min-w-0">{toast.message}</p>
      <button
        onClick={handleRemove}
        className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0 p-1"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
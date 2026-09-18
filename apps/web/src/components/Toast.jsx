import { useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import './Toast.css';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, dismiss };
}

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

export default function ToastContainer({ toasts, dismiss }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => {
        const Icon = ICONS[toast.type] || ICONS.info;
        return (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => dismiss(toast.id)}
          role="alert"
        >
          <span className="toast-icon" aria-hidden="true"><Icon size={16} /></span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
        );
      })}
    </div>
  );
}

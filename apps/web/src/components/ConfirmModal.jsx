import { AlertTriangle } from 'lucide-react';
import './ConfirmModal.css';

export default function ConfirmModal({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-header">
          <div className="confirm-icon" aria-hidden="true"><AlertTriangle size={20} /></div>
          <h3 className="confirm-title">{title || 'Confirm'}</h3>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={onCancel}>
            {cancelLabel || 'Cancel'}
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle, X } from 'lucide-react';
import GlassCard from './GlassCard';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => !isLoading && onClose()} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md animate-modal-in">
        <GlassCard padding="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-500/10 text-status-danger' : 'bg-accent-yellow/10 text-accent-yellow'}`}>
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-text-dim hover:text-text-primary transition-colors disabled:opacity-50 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-text-secondary mb-6">{message}</p>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button onClick={onClose} disabled={isLoading} className="btn-glass text-sm min-h-[44px]">
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`${isDestructive ? 'btn-danger' : 'btn-yellow'} text-sm min-w-[100px] min-h-[44px] flex justify-center items-center`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

import { Inbox } from 'lucide-react';

// Empty state placeholder — icon + message + optional CTA, for any list with zero results
export default function EmptyState({ icon: Icon = Inbox, title = 'No data found', message = '', actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full glass-surface flex items-center justify-center">
        <Icon size={28} className="text-text-dim" />
      </div>
      <div className="text-center">
        <p className="text-text-secondary font-medium">{title}</p>
        {message && <p className="text-text-dim text-sm mt-1 max-w-xs">{message}</p>}
      </div>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-yellow text-sm mt-2">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

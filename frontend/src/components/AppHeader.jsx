import { ArrowLeft } from 'lucide-react';
import IconButton from './IconButton';

// Page-level header bar — back button + title + optional right action icon
export default function AppHeader({ title, onBack, rightAction, rightIcon: RightIcon }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <IconButton icon={ArrowLeft} onClick={onBack} size={40} title="Go back" />
        )}
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
      </div>
      {rightAction && RightIcon && (
        <IconButton icon={RightIcon} onClick={rightAction} size={40} />
      )}
    </div>
  );
}

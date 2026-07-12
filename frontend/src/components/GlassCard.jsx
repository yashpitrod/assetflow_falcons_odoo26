// Base glass card — blur, border, radius, padding. Foundation of every panel.
export default function GlassCard({ children, className = '', padding = 'p-6', noBorder = false, onClick }) {
  return (
    <div
      className={`glass-surface rounded-card-lg ${padding} ${noBorder ? 'border-0' : ''} ${onClick ? 'cursor-pointer glass-surface-hover' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

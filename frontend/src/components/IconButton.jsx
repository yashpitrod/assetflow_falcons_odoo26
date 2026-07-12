// Circular glass button with a lucide icon — 44-48px, used for actions
export default function IconButton({ icon: Icon, onClick, size = 44, variant = 'default', className = '', title = '' }) {
  const variantStyles = {
    default: 'glass-surface glass-surface-hover text-text-secondary hover:text-text-primary',
    danger: 'glass-surface text-status-danger hover:bg-red-500/10',
    accent: 'bg-accent-yellow text-bg-base hover:bg-yellow-400',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 ${variantStyles[variant] || variantStyles.default} ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {Icon && <Icon size={size * 0.4} />}
    </button>
  );
}

// Dot-matrix LED-style big number readout — solid fallback ensures 0 always renders
export default function DotMatrixValue({ value, suffix = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  };

  const display = value != null && value !== '' ? String(value) : '0';
  const useDotMatrix = size !== 'sm';

  return (
    <span className="inline-flex items-baseline gap-1">
      <span
        className={`${useDotMatrix ? 'dot-matrix-text' : ''} ${sizeClasses[size] || sizeClasses.md} font-semibold text-accent-yellow tabular-nums`}
        style={useDotMatrix ? undefined : { WebkitTextFillColor: 'currentColor' }}
      >
        {display}
      </span>
      {suffix && (
        <span className="text-text-secondary text-sm font-medium">{suffix}</span>
      )}
    </span>
  );
}

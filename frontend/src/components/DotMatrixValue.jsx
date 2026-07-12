// Dot-matrix LED-style big number readout — uses CSS radial-gradient clipped to text
export default function DotMatrixValue({ value, suffix = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  };

  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={`dot-matrix-text ${sizeClasses[size] || sizeClasses.md} font-semibold text-accent-yellow`}>
        {value}
      </span>
      {suffix && (
        <span className="text-text-secondary text-sm font-medium">{suffix}</span>
      )}
    </span>
  );
}

// Accent-gradient card — purple or indigo variant for highlight tiles
export default function GradientTile({ variant = 'purple', children, className = '' }) {
  const gradientClass = variant === 'purple' ? 'gradient-purple' : 'gradient-indigo';
  return (
    <div className={`${gradientClass} rounded-card-lg p-5 ${className}`}>
      {children}
    </div>
  );
}

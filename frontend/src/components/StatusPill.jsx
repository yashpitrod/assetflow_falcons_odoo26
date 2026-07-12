import { getStatusColor } from '../utils/statusColors';

// Colored badge pill for entity status — auto-maps color via statusColors.js
export default function StatusPill({ status, className = '' }) {
  const colors = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-pill text-xs font-semibold tracking-wide ${className}`}
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Human-readable: insert space before uppercase letters in PascalCase statuses */}
      {status?.replace(/([A-Z])/g, ' $1').trim()}
    </span>
  );
}

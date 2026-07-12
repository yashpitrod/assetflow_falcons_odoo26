import DotMatrixValue from './DotMatrixValue';
import GlassCard from './GlassCard';

// Small pill-shaped stat card — label + big number + optional trend indicator.
// Used for secondary KPIs in bento grids.
export default function StatCard({ label, value, suffix = '', trend, icon: Icon, className = '' }) {
  return (
    <GlassCard className={`flex flex-col gap-3 ${className}`} padding="p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-full glass-surface flex items-center justify-center">
            <Icon size={16} className="text-text-secondary" />
          </div>
        )}
      </div>
      <DotMatrixValue value={value} suffix={suffix} size="sm" />
      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-text-dim text-xs">vs last month</span>
        </div>
      )}
    </GlassCard>
  );
}

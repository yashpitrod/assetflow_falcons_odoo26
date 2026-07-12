// Glass shimmer loading skeleton — matches card shapes for consistent loading states.
// Used by useFetch's loading state across all async views.
export default function LoadingSkeleton({ variant = 'card', count = 1, className = '' }) {
  const variants = {
    // Full card skeleton
    card: 'h-40 rounded-card-lg',
    // Table row skeleton
    row: 'h-14 rounded-2xl',
    // Small stat card skeleton
    stat: 'h-28 rounded-card-lg',
    // Text line skeleton
    line: 'h-4 rounded-lg',
    // Circle skeleton (for avatar/icon)
    circle: 'h-10 w-10 rounded-full',
    // Gauge skeleton
    gauge: 'h-52 w-52 rounded-full',
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer ${variants[variant] || variants.card} w-full`}
        />
      ))}
    </div>
  );
}

// Composite skeleton for common page layouts
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <LoadingSkeleton variant="gauge" />
        </div>
        <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton variant="stat" count={6} />
        </div>
      </div>
      <LoadingSkeleton variant="card" count={2} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      <LoadingSkeleton variant="line" className="w-48" />
      <LoadingSkeleton variant="row" count={rows} />
    </div>
  );
}

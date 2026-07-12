import { memo } from 'react';
import { Package, ArrowLeftRight, CalendarClock, Wrench, AlertTriangle, Clock, Activity } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { getDashboardKpis, getRecentActivity, getOverdueReturns } from '../api/dashboard';
import GlassCard from '../components/GlassCard';
import RadialGauge from '../components/RadialGauge';
import StatCard from '../components/StatCard';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { formatDate, timeAgo } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

// Memoised: formats action log strings once, not on every re-render
const formatAction = (action) =>
  action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Isolated overdue row — memo prevents re-render unless data changes
const OverdueRow = memo(function OverdueRow({ al }) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-2xl"
      style={{
        background: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderLeft: '3px solid #EF4444',
      }}
    >
      <div>
        <p className="text-text-primary text-sm font-medium">{al.asset?.name}</p>
        <p className="text-text-secondary text-xs">{al.employeeName}</p>
      </div>
      <div className="text-right">
        <p className="text-status-danger text-xs font-semibold">{al.daysOverdue}d overdue</p>
        <p className="text-text-dim text-xs">Due {formatDate(al.expectedReturnDate)}</p>
      </div>
    </div>
  );
});

export default function DashboardPage() {
  const { user } = useAuth();
  // Pass null as params since these endpoints need no arguments
  const { data: kpis, loading: kpisLoading } = useFetch(getDashboardKpis, null, []);
  const { data: activityRes, loading: activityLoading } = useFetch(getRecentActivity, null, []);
  const { data: overdueRes, loading: overdueLoading } = useFetch(getOverdueReturns, null, []);

  if (kpisLoading) return <DashboardSkeleton />;

  const kpi = kpis?.data || {};
  const activity = activityRes?.data || [];
  const overdue = overdueRes?.data || [];

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      {/* Page title */}
      <div>
        <p className="eyebrow mb-1">Overview</p>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-text-secondary text-sm mt-1">Here's what's happening with your assets today.</p>
      </div>

      {/* Hero row — Radial gauge + stat grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <GlassCard className="flex flex-col items-center justify-center col-span-1 animate-stagger-1 animate-fade-in-up" padding="p-6">
          <p className="eyebrow mb-4">Asset Utilization</p>
          <RadialGauge
            value={kpi.utilizationPercent || 0}
            max={100}
            label="Fleet Utilization"
            subtitle="Allocated + Reserved / Total"
            size={190}
          />
        </GlassCard>

        <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Assets', value: kpi.totalAssets || 0, icon: Package, delay: 1 },
            { label: 'Available', value: kpi.availableAssets || 0, icon: Package, delay: 2 },
            { label: 'Allocated', value: kpi.allocatedAssets || 0, icon: ArrowLeftRight, delay: 3 },
            { label: 'Active Bookings', value: kpi.activeBookingsToday || 0, icon: CalendarClock, delay: 4 },
            { label: 'Pending Transfers', value: kpi.pendingTransfers || 0, icon: ArrowLeftRight, delay: 5 },
            { label: 'In Maintenance', value: kpi.underMaintenance || 0, icon: Wrench, delay: 5 },
          ].map(({ label, value, icon, delay }) => (
            <div key={label} className={`animate-stagger-${delay} animate-fade-in-up`}>
              <StatCard label={label} value={value} icon={icon} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row — Overdue returns + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Overdue returns */}
        <GlassCard padding="p-5" className="animate-stagger-2 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-status-danger" aria-hidden="true" />
              <h2 className="text-text-primary font-semibold text-sm">Overdue Returns</h2>
            </div>
            {overdue.length > 0 && (
              <span className="text-xs font-semibold text-status-danger bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-pill">
                {overdue.length} overdue
              </span>
            )}
          </div>

          {overdueLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-16 rounded-2xl skeleton-shimmer" />)}
            </div>
          ) : overdue.length === 0 ? (
            <EmptyState icon={Clock} title="No overdue returns" message="All assets returned on time" />
          ) : (
            <div className="space-y-2">
              {overdue.map(al => <OverdueRow key={al.id} al={al} />)}
            </div>
          )}
        </GlassCard>

        {/* Recent activity */}
        <GlassCard padding="p-5" className="animate-stagger-3 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-text-secondary" aria-hidden="true" />
            <h2 className="text-text-primary font-semibold text-sm">Recent Activity</h2>
          </div>

          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-2xl skeleton-shimmer" />)}
            </div>
          ) : activity.length === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
            <div className="space-y-1">
              {activity.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow mt-2 shrink-0 shadow-[0_0_6px_rgba(250,204,21,0.4)]" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm">
                      <span className="text-text-primary font-medium">{log.actorName}</span>{' '}
                      {formatAction(log.action)}
                    </p>
                    {log.details && (
                      <p className="text-text-dim text-xs mt-0.5 truncate">
                        {Object.values(log.details).filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-text-dim text-xs shrink-0">{timeAgo(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Maintenance', value: kpi.pendingMaintenance || 0, color: 'text-status-warning', delay: 1 },
          { label: 'Open Audits', value: kpi.openAuditCycles || 0, color: 'text-accent-yellow', delay: 2 },
          { label: 'Overdue Returns', value: kpi.overdueReturns || 0, color: 'text-status-danger', delay: 3 },
          { label: 'Pending Transfers', value: kpi.pendingTransfers || 0, color: 'text-[#818CF8]', delay: 4 },
        ].map(({ label, value, color, delay }) => (
          <GlassCard key={label} padding="p-4" className={`text-center animate-stagger-${delay} animate-fade-in-up`}>
            <p className="eyebrow mb-1">{label}</p>
            <p className={`text-3xl font-semibold ${color}`}>{value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

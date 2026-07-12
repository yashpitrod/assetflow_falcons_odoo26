import { useState, useMemo } from 'react';
import { Bell, Activity, CheckCircle2, AlertTriangle, ArrowLeftRight, CalendarClock, Wrench, ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { getNotifications, getActivityLogs, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { timeAgo, formatDateTime } from '../utils/formatters';
import { NotificationType } from '../utils/constants';

// Maps notification type to icon and color — avoids conditional chains in render
const NOTIF_META = {
  [NotificationType.AssetAssigned]: { Icon: ArrowLeftRight, color: '#818CF8' },
  [NotificationType.MaintenanceApproved]: { Icon: Wrench, color: '#22C55E' },
  [NotificationType.MaintenanceRejected]: { Icon: Wrench, color: '#EF4444' },
  [NotificationType.BookingConfirmed]: { Icon: CalendarClock, color: '#22C55E' },
  [NotificationType.BookingCancelled]: { Icon: CalendarClock, color: '#EF4444' },
  [NotificationType.BookingReminder]: { Icon: CalendarClock, color: '#FACC15' },
  [NotificationType.TransferApproved]: { Icon: ArrowLeftRight, color: '#22C55E' },
  [NotificationType.OverdueReturn]: { Icon: AlertTriangle, color: '#EF4444' },
  [NotificationType.AuditDiscrepancy]: { Icon: ClipboardCheck, color: '#F59E0B' },
};

// Category filter tabs
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'bookings', label: 'Bookings' },
];

function NotificationItem({ n, onMarkRead }) {
  const meta = NOTIF_META[n.type] || { Icon: Bell, color: '#9CA3AF' };
  const { Icon } = meta;

  return (
    <div
      className={`flex gap-4 p-4 transition-colors border-b border-white/[0.04] last:border-0 ${
        !n.isRead ? 'bg-white/[0.025] hover:bg-white/[0.04]' : 'hover:bg-white/[0.01]'
      } ${!n.isRead ? 'cursor-pointer' : ''}`}
      onClick={() => !n.isRead && onMarkRead(n.id)}
      role={!n.isRead ? 'button' : undefined}
      aria-label={!n.isRead ? `Mark as read: ${n.message}` : undefined}
      tabIndex={!n.isRead ? 0 : undefined}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !n.isRead) onMarkRead(n.id); }}
    >
      {/* Type icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
        aria-hidden="true"
      >
        <Icon size={16} style={{ color: meta.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${!n.isRead ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
          {n.message}
        </p>
        <p className="text-xs text-text-dim mt-1 font-medium">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Unread indicator dot */}
      <div className="flex items-start mt-1.5 shrink-0">
        {!n.isRead ? (
          <div
            className="w-2 h-2 rounded-full bg-accent-yellow shadow-[0_0_6px_rgba(250,204,21,0.5)]"
            aria-label="Unread"
          />
        ) : (
          <div className="w-2 h-2 rounded-full bg-transparent" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function ActivityItem({ log }) {
  const actionLabel = log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex gap-4 p-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
      <div className="flex flex-col items-center gap-1 shrink-0 mt-1" aria-hidden="true">
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <div className="w-px flex-1 bg-white/[0.05] min-h-[12px]" />
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <p className="text-sm text-text-secondary">
          <span className="text-text-primary font-semibold">{log.actorName}</span>{' '}
          {actionLabel}
        </p>
        {log.details && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
            {Object.entries(log.details).map(([k, v]) => (
              <span key={k} className="text-xs text-text-dim">
                <span className="font-medium text-text-secondary">{k}:</span> {String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs text-text-dim whitespace-nowrap font-medium shrink-0">{timeAgo(log.createdAt)}</span>
    </div>
  );
}

const LOGS_PER_PAGE = 20;

export default function NotificationsPage() {
  const [activeView, setActiveView] = useState('notifications');
  const [notifFilter, setNotifFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const { addToast } = useToast();

  // Notifications fetch
  const { data: notifRes, loading: notifLoading } = useFetch(
    getNotifications,
    notifFilter,
    [notifFilter, refreshKey]
  );

  // Activity logs fetch — paginated
  const { data: logRes, loading: logLoading } = useFetch(
    () => getActivityLogs({ page: logPage, limit: LOGS_PER_PAGE }),
    null,
    [logPage, refreshKey]
  );

  const notifications = notifRes?.data || [];
  const logs = logRes?.data || [];
  // Backend may return total count for pagination — gracefully handle missing field
  const logTotalCount = logRes?.meta?.total || logRes?.total || null;
  const hasMoreLogs = logTotalCount ? (logPage * LOGS_PER_PAGE < logTotalCount) : (logs.length === LOGS_PER_PAGE);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  // ── Mark as read handlers ────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setRefreshKey(k => k + 1);
    } catch {
      addToast('Failed to mark as read', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      addToast('All notifications marked as read', 'success');
      setRefreshKey(k => k + 1);
    } catch {
      addToast('Failed to mark all as read', 'error');
    }
  };

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Inbox</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Activity & Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-text-secondary text-sm mt-1">
              <span className="text-accent-yellow font-semibold">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-pill bg-white/[0.02] border border-white/[0.05]">
            <button
              onClick={() => setActiveView('notifications')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-pill text-sm font-medium transition-colors ${
                activeView === 'notifications' ? 'bg-white/[0.08] text-text-primary' : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              <Bell size={14} aria-hidden="true" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-status-danger text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('logs')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-pill text-sm font-medium transition-colors ${
                activeView === 'logs' ? 'bg-white/[0.08] text-text-primary' : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              <Activity size={14} aria-hidden="true" />
              Activity Log
            </button>
          </div>

          {/* Mark All Read — only on notifications tab when there are unread */}
          {activeView === 'notifications' && unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-glass flex items-center gap-2 py-2 text-sm text-text-secondary hover:text-text-primary"
              aria-label="Mark all notifications as read"
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification filter tabs */}
      {activeView === 'notifications' && (
        <div className="flex items-center gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setNotifFilter(tab.key)}
              className={`px-4 py-1.5 rounded-pill text-sm font-medium transition-colors ${
                notifFilter === tab.key
                  ? 'bg-white/[0.08] text-text-primary'
                  : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <GlassCard padding="p-0" className="overflow-hidden">
        {activeView === 'notifications' ? (
          notifLoading ? (
            <div className="p-6 space-y-3">
              <LoadingSkeleton variant="row" count={5} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={Bell}
                title="No notifications"
                message={notifFilter !== 'all' ? 'No notifications in this category.' : 'You\'re all caught up!'}
              />
            </div>
          ) : (
            <div role="list" aria-label="Notifications">
              {notifications.map((n, i) => (
                <div key={n.id} className={`animate-fade-in-up ${i < 5 ? `animate-stagger-${i + 1}` : ''}`} role="listitem">
                  <NotificationItem n={n} onMarkRead={handleMarkRead} />
                </div>
              ))}
            </div>
          )
        ) : (
          logLoading ? (
            <div className="p-6 space-y-3">
              <LoadingSkeleton variant="row" count={5} />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16">
              <EmptyState icon={Activity} title="No activity recorded" message="Workflow actions will appear here." />
            </div>
          ) : (
            <div role="list" aria-label="Activity log">
              {logs.map((log, i) => (
                <div key={log.id} className={`animate-fade-in-up ${i < 5 ? `animate-stagger-${i + 1}` : ''}`} role="listitem">
                  <ActivityItem log={log} />
                </div>
              ))}
            </div>
          )
        )}
      </GlassCard>

      {/* Pagination controls — Activity Log tab only */}
      {activeView === 'logs' && !logLoading && logs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-dim">
            Page {logPage}
            {logTotalCount ? ` of ${Math.ceil(logTotalCount / LOGS_PER_PAGE)}` : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setLogPage(p => Math.max(1, p - 1))}
              disabled={logPage === 1}
              className="btn-glass text-xs flex items-center gap-1 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => setLogPage(p => p + 1)}
              disabled={!hasMoreLogs}
              className="btn-glass text-xs flex items-center gap-1 disabled:opacity-30"
              aria-label="Next page"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

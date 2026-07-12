import { useState, useMemo, useEffect } from 'react';
import { CalendarClock, Plus, X, Clock, Search } from 'lucide-react';
import { useFetch, useDebounce } from '../hooks/useFetch';
import { getAllBookings, cancelBooking } from '../api/bookings';
import GlassCard from '../components/GlassCard';
import StatusPill from '../components/StatusPill';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate, formatTimeRange } from '../utils/formatters';
import { BookingStatus } from '../utils/constants';

export default function BookingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, booking: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const debouncedSearch = useDebounce(search, 300);

  // Client-side filter on bookings returned from GET /bookings
  const { data: bookingsData, loading, error, refetch } = useFetch(getAllBookings, null, [refreshKey]);

  const allBookings = bookingsData ?? [];

  useEffect(() => {
    if (error) addToast(`Bookings failed to load: ${error}`, 'error');
  }, [error, addToast]);

  const filteredBookings = useMemo(() => {
    let res = allBookings;
    if (statusFilter) res = res.filter(b => b.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      res = res.filter(b =>
        b.asset?.name?.toLowerCase().includes(q) ||
        b.bookedByEmployeeName?.toLowerCase().includes(q)
      );
    }
    return res;
  }, [allBookings, statusFilter, debouncedSearch]);

  const handleCancel = async () => {
    if (!confirmDialog.booking) return;
    setIsSubmitting(true);
    try {
      await cancelBooking(confirmDialog.booking.id);
      addToast(`Booking for ${confirmDialog.booking.asset?.name} cancelled.`, 'success');
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setIsSubmitting(false);
      setConfirmDialog({ isOpen: false, booking: null });
    }
  };

  const columns = [
    {
      header: 'Resource',
      render: (bk) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{bk.asset?.name ?? '—'}</p>
          <p className="text-xs text-text-dim font-mono">{bk.asset?.assetTag}</p>
        </div>
      ),
    },
    {
      header: 'Booked By',
      render: (bk) => (
        <span className="text-sm text-text-secondary">{bk.bookedByEmployeeName}</span>
      ),
    },
    {
      header: 'Date',
      render: (bk) => (
        <span className="text-sm text-text-secondary">{formatDate(bk.startTime)}</span>
      ),
    },
    {
      header: 'Time Slot',
      render: (bk) => (
        <span className="text-sm text-text-secondary flex items-center gap-1.5">
          <Clock size={13} className="text-text-dim shrink-0" aria-hidden="true" />
          {formatTimeRange(bk.startTime, bk.endTime)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (bk) => <StatusPill status={bk.status} />,
    },
    {
      header: 'Action',
      render: (bk) =>
        bk.status === BookingStatus.Upcoming ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, booking: bk }); }}
            className="flex items-center gap-1.5 text-xs text-status-danger hover:text-red-400 transition-colors py-1 px-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20"
            aria-label={`Cancel booking for ${bk.asset?.name}`}
          >
            <X size={13} /> Cancel
          </button>
        ) : null,
    },
  ];

  const statusCounts = useMemo(() => {
    const counts = {};
    allBookings.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return counts;
  }, [allBookings]);

  return (
    <div className="space-y-5 max-w-7xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Shared Resources</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Resource Bookings</h1>
          <p className="text-text-secondary text-sm mt-1">
            {statusCounts[BookingStatus.Upcoming] || 0} upcoming · {statusCounts[BookingStatus.Ongoing] || 0} ongoing
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search resource or person…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search bookings"
              className="glass-input pl-9 w-full sm:w-64 text-sm"
            />
          </div>
          <button className="w-full sm:w-auto btn-yellow flex items-center justify-center gap-2 text-sm">
            <Plus size={15} aria-hidden="true" />
            New Booking
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[{ label: 'All', value: '' }, ...Object.values(BookingStatus).map(s => ({ label: s, value: s }))].map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-4 py-1.5 rounded-pill text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === opt.value
                ? 'bg-white/[0.08] text-text-primary'
                : 'text-text-dim hover:text-text-secondary'
            }`}
          >
            {opt.label}
            {opt.value && statusCounts[opt.value] > 0 && (
              <span className="text-[10px] bg-white/10 text-text-dim px-1.5 py-0.5 rounded-full font-bold">
                {statusCounts[opt.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && !loading && (
        <GlassCard padding="p-4" className="border border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-status-danger">{error}</p>
            <button onClick={refetch} className="btn-glass text-xs text-status-danger border-red-500/20">Retry</button>
          </div>
        </GlassCard>
      )}

      {/* Table */}
      <GlassCard padding="p-0">
        <Table
          columns={columns}
          data={filteredBookings}
          loading={loading}
          emptyIcon={CalendarClock}
          emptyTitle="No bookings found"
          emptyMessage={search || statusFilter ? 'Try adjusting your search or status filter.' : 'No bookings have been created yet.'}
        />
      </GlassCard>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, booking: null })}
        onConfirm={handleCancel}
        title="Cancel Booking"
        message={`Are you sure you want to cancel the booking for ${confirmDialog.booking?.asset?.name}? This action cannot be undone.`}
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        isDestructive
        isLoading={isSubmitting}
      />
    </div>
  );
}

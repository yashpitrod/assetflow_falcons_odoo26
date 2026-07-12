import { useState, useMemo } from 'react';
import { ClipboardCheck, Plus, CheckCircle2, AlertTriangle, Search, X } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { getAuditCycles, closeAuditCycle } from '../api/audit';
import GlassCard from '../components/GlassCard';
import StatusPill from '../components/StatusPill';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/formatters';
import { AuditCycleStatus, VerificationStatus } from '../utils/constants';

// Progress bar for audit findings — renders Verified / Missing / Damaged breakdown
function FindingsBar({ verified, missing, damaged, total }) {
  if (!total) return <span className="text-text-dim text-xs">No findings yet</span>;
  const vPct = (verified / total) * 100;
  const mPct = (missing / total) * 100;
  const dPct = (damaged / total) * 100;
  return (
    <div>
      <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-white/5">
        <div className="bg-status-success h-full transition-all" style={{ width: `${vPct}%` }} />
        <div className="bg-status-warning h-full transition-all" style={{ width: `${dPct}%` }} />
        <div className="bg-status-danger h-full transition-all" style={{ width: `${mPct}%` }} />
      </div>
      <p className="text-[10px] text-text-dim mt-1">
        {verified} verified · {damaged} damaged · {missing} missing
      </p>
    </div>
  );
}

export default function AuditPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, cycle: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const { data: auditRes, loading, error, refetch } = useFetch(getAuditCycles, null, [refreshKey]);
  const audits = auditRes?.data || [];

  const handleClose = async () => {
    if (!confirmDialog.cycle) return;
    setIsSubmitting(true);
    try {
      await closeAuditCycle(confirmDialog.cycle.id);
      addToast('Audit cycle closed successfully.', 'success');
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Failed to close cycle', 'error');
    } finally {
      setIsSubmitting(false);
      setConfirmDialog({ isOpen: false, cycle: null });
    }
  };

  // Summary stats
  const stats = useMemo(() => ({
    open: audits.filter(a => a.status === AuditCycleStatus.Open).length,
    closed: audits.filter(a => a.status === AuditCycleStatus.Closed).length,
    totalMissing: audits.reduce((sum, a) => sum + (a.missing || 0), 0),
  }), [audits]);

  const columns = [
    {
      header: 'Scope',
      render: (audit) => (
        <div>
          <p className="text-sm font-medium text-text-primary">
            {audit.scopeDepartmentId ? audit.departmentName : audit.scopeLocation || 'Global'}
          </p>
          <p className="text-xs text-text-dim font-mono">#{String(audit.id).padStart(4, '0')}</p>
        </div>
      ),
    },
    {
      header: 'Date Range',
      render: (audit) => (
        <div>
          <p className="text-sm text-text-secondary">{formatDate(audit.dateRangeStart)}</p>
          <p className="text-xs text-text-dim">→ {formatDate(audit.dateRangeEnd)}</p>
        </div>
      ),
    },
    {
      header: 'Auditors',
      render: (audit) => (
        <div className="flex -space-x-2">
          {(audit.auditors || []).slice(0, 4).map((name, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-[#121214] flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              title={name}
              aria-label={name}
            >
              {name.charAt(0)}
            </div>
          ))}
          {(audit.auditors || []).length > 4 && (
            <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-[#121214] flex items-center justify-center text-[10px] font-bold text-text-dim">
              +{audit.auditors.length - 4}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Findings',
      render: (audit) => (
        <div className="min-w-[120px]">
          <FindingsBar
            verified={audit.verified}
            missing={audit.missing}
            damaged={audit.damaged}
            total={audit.totalAssets}
          />
        </div>
      ),
    },
    {
      header: 'Status',
      render: (audit) => <StatusPill status={audit.status} />,
    },
    {
      header: 'Actions',
      render: (audit) =>
        audit.status === AuditCycleStatus.Open ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, cycle: audit }); }}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-yellow transition-colors py-1 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]"
            aria-label="Close audit cycle"
          >
            <CheckCircle2 size={13} aria-hidden="true" /> Close Cycle
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Compliance</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Audit Cycles</h1>
          <p className="text-text-secondary text-sm mt-1">
            {stats.open} open · {stats.closed} closed
            {stats.totalMissing > 0 && (
              <span className="ml-2 text-status-danger font-medium">
                · {stats.totalMissing} missing assets
              </span>
            )}
          </p>
        </div>
        <button className="w-full md:w-auto btn-yellow flex items-center justify-center gap-2 text-sm">
          <Plus size={15} aria-hidden="true" />
          New Audit Cycle
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <GlassCard padding="p-4" className="border border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-status-danger">{error}</p>
            <button onClick={refetch} className="btn-glass text-xs text-status-danger border-red-500/20">Retry</button>
          </div>
        </GlassCard>
      )}

      {/* Discrepancy alert banner */}
      {!loading && stats.totalMissing > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl animate-fade-in-up"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '3px solid #EF4444' }}
          role="alert"
        >
          <AlertTriangle size={18} className="text-status-danger shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {stats.totalMissing} asset{stats.totalMissing !== 1 ? 's' : ''} flagged as missing
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Closing open audit cycles will automatically mark these assets as Lost.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <GlassCard padding="p-0">
        <Table
          columns={columns}
          data={audits}
          loading={loading}
          emptyIcon={ClipboardCheck}
          emptyTitle="No audit cycles found"
          emptyMessage="Create your first audit cycle to start verifying assets."
        />
      </GlassCard>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, cycle: null })}
        onConfirm={handleClose}
        title="Close Audit Cycle"
        message={`This will mark ${confirmDialog.cycle?.missing || 0} missing asset(s) as Lost. This action cannot be undone.`}
        confirmText="Close Cycle"
        isDestructive
        isLoading={isSubmitting}
      />
    </div>
  );
}

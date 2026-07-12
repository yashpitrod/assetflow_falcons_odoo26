import { useState, useMemo, useEffect } from 'react';
import { ClipboardCheck, Plus, CheckCircle2, AlertTriangle, Users, Search, X } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { getAuditCycles, createAuditCycle, addAuditors, createAuditFinding, closeAuditCycle } from '../api/audit';
import { getDepartments, getEmployees } from '../api/org';
import { getAssets } from '../api/assets';
import GlassCard from '../components/GlassCard';
import StatusPill from '../components/StatusPill';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/formatters';
import { AuditCycleStatus, VerificationStatus, EmployeeRole } from '../utils/constants';

// ── Findings progress bar ──────────────────────────────────────
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

// ── New Audit Cycle Modal ──────────────────────────────────────
function NewCycleModal({ onClose, onSave }) {
  const [form, setForm] = useState({ scopeDepartmentId: '', scopeLocation: '', dateRangeStart: '', dateRangeEnd: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { data: deptRes } = useFetch(getDepartments, null, []);
  const departments = deptRes?.data || [];

  const validate = () => {
    const errs = {};
    if (!form.dateRangeStart) errs.dateRangeStart = 'Start date is required';
    if (!form.dateRangeEnd) errs.dateRangeEnd = 'End date is required';
    if (form.dateRangeStart && form.dateRangeEnd && new Date(form.dateRangeEnd) <= new Date(form.dateRangeStart)) {
      errs.dateRangeEnd = 'End date must be after start date';
    }
    if (!form.scopeDepartmentId && !form.scopeLocation.trim()) {
      errs.scopeDepartmentId = 'Select a department or enter a location';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      dateRangeStart: form.dateRangeStart,
      dateRangeEnd: form.dateRangeEnd,
    };
    if (form.scopeDepartmentId) payload.scopeDepartmentId = Number(form.scopeDepartmentId);
    if (form.scopeLocation.trim()) payload.scopeLocation = form.scopeLocation.trim();
    await onSave(payload);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md" padding="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-semibold">New Audit Cycle</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="eyebrow mb-1.5 block">Scope — Department</label>
            <select className="glass-input" value={form.scopeDepartmentId} onChange={e => setForm(f => ({ ...f, scopeDepartmentId: e.target.value }))}>
              <option value="">None (use location instead)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.scopeDepartmentId && <p className="text-status-danger text-xs mt-1">{errors.scopeDepartmentId}</p>}
          </div>
          <div>
            <label className="eyebrow mb-1.5 block">Scope — Location</label>
            <input className="glass-input" value={form.scopeLocation} onChange={e => setForm(f => ({ ...f, scopeLocation: e.target.value }))} placeholder="e.g. Building A, Floor 3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow mb-1.5 block">Start Date</label>
              <input type="date" className="glass-input" value={form.dateRangeStart} onChange={e => setForm(f => ({ ...f, dateRangeStart: e.target.value }))} />
              {errors.dateRangeStart && <p className="text-status-danger text-xs mt-1">{errors.dateRangeStart}</p>}
            </div>
            <div>
              <label className="eyebrow mb-1.5 block">End Date</label>
              <input type="date" className="glass-input" value={form.dateRangeEnd} onChange={e => setForm(f => ({ ...f, dateRangeEnd: e.target.value }))} />
              {errors.dateRangeEnd && <p className="text-status-danger text-xs mt-1">{errors.dateRangeEnd}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-yellow text-sm min-w-[120px] flex justify-center">
              {submitting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Create Cycle'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ── Assign Auditors Modal ──────────────────────────────────────
function AssignAuditorsModal({ cycle, onClose, onSave }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { data: empRes } = useFetch(getEmployees, null, []);
  const employees = empRes?.data || [];

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setError('');
  };

  const handleSubmit = async () => {
    if (selected.length === 0) { setError('Select at least one auditor'); return; }
    setSubmitting(true);
    await onSave(cycle.id, selected);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md max-h-[80vh] flex flex-col" padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold">Assign Auditors</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary"><X size={18} /></button>
        </div>
        <p className="text-text-dim text-xs mb-4">Cycle #{String(cycle.id).padStart(4, '0')}</p>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input className="glass-input pl-9 text-sm" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 mb-4 custom-scrollbar">
          {filtered.map(emp => (
            <button
              key={emp.id}
              type="button"
              onClick={() => toggle(emp.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors border ${
                selected.includes(emp.id)
                  ? 'bg-white/[0.06] border-accent-yellow/30'
                  : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03]'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                selected.includes(emp.id) ? 'bg-accent-yellow text-black' : 'bg-white/10 text-text-dim'
              }`}>
                {emp.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">{emp.name}</p>
                <p className="text-xs text-text-dim truncate">{emp.email}</p>
              </div>
              {selected.includes(emp.id) && <CheckCircle2 size={16} className="ml-auto text-accent-yellow shrink-0" />}
            </button>
          ))}
        </div>

        {error && <p className="text-status-danger text-xs mb-3">{error}</p>}

        <div className="flex justify-between items-center">
          <span className="text-xs text-text-dim">{selected.length} selected</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-glass text-sm">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-yellow text-sm min-w-[100px] flex justify-center">
              {submitting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Assign'}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Submit Findings Modal ──────────────────────────────────────
function SubmitFindingsModal({ cycle, onClose, onSave }) {
  const { addToast } = useToast();
  const [findings, setFindings] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Scope filters mirror GET /assets query params from architecture.md
  const assetFilters = useMemo(() => {
    const filters = {};
    if (cycle.scopeDepartmentId) filters.department = cycle.scopeDepartmentId;
    if (cycle.scopeLocation) filters.location = cycle.scopeLocation;
    return filters;
  }, [cycle.scopeDepartmentId, cycle.scopeLocation]);

  const { data: assetRes, loading: assetsLoading } = useFetch(getAssets, assetFilters, [cycle.id, cycle.scopeDepartmentId, cycle.scopeLocation]);
  const assets = assetRes?.data || [];

  // Sync findings rows when scoped assets load
  useEffect(() => {
    setFindings(assets.map(a => ({
      assetId: a.id,
      assetName: a.name,
      assetTag: a.assetTag,
      expectedLocation: a.location || '',
      verificationStatus: '',
      notes: '',
    })));
  }, [assets]);

  const updateFinding = (idx, field, value) => {
    setFindings(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };

  const handleSubmit = async () => {
    // Validate: every asset must have a status
    const incomplete = findings.filter(f => !f.verificationStatus);
    if (incomplete.length > 0) {
      addToast(`Mark all ${incomplete.length} remaining asset${incomplete.length !== 1 ? 's' : ''} before submitting.`, 'error');
      return;
    }
    setSubmitting(true);
    await onSave(cycle.id, findings);
    setSubmitting(false);
  };

  const completedCount = findings.filter(f => f.verificationStatus).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-2xl max-h-[85vh] flex flex-col" padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-text-primary font-semibold">Submit Findings</h2>
            <p className="text-text-dim text-xs mt-1">Cycle #{String(cycle.id).padStart(4, '0')} · {completedCount}/{findings.length} reviewed</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary"><X size={18} /></button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-white/5 mb-4 overflow-hidden">
          <div className="h-full bg-accent-yellow rounded-full transition-all duration-300" style={{ width: findings.length ? `${(completedCount / findings.length) * 100}%` : '0%' }} />
        </div>

        {/* Asset list */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
          {assetsLoading ? (
            <p className="text-text-dim text-sm text-center py-8">Loading assets…</p>
          ) : findings.length === 0 ? (
            <p className="text-text-dim text-sm text-center py-8">No assets found in scope.</p>
          ) : (
            findings.map((f, i) => (
              <div key={f.assetId} className={`p-4 rounded-2xl border transition-colors ${
                f.verificationStatus ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03]'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{f.assetName}</p>
                    <p className="text-xs text-text-dim font-mono">{f.assetTag}</p>
                  </div>
                  {f.verificationStatus && <StatusPill status={f.verificationStatus} />}
                </div>

                {/* Verification status buttons */}
                <div className="flex gap-2 mb-2">
                  {Object.values(VerificationStatus).map(vs => (
                    <button
                      key={vs}
                      type="button"
                      onClick={() => updateFinding(i, 'verificationStatus', vs)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                        f.verificationStatus === vs
                          ? vs === 'Verified' ? 'bg-green-500/15 border-green-500/30 text-status-success'
                            : vs === 'Missing' ? 'bg-red-500/15 border-red-500/30 text-status-danger'
                            : 'bg-yellow-500/15 border-yellow-500/30 text-accent-yellow'
                          : 'bg-white/[0.02] border-white/[0.06] text-text-dim hover:text-text-secondary'
                      }`}
                    >
                      {vs}
                    </button>
                  ))}
                </div>

                {/* Notes (optional) */}
                {(f.verificationStatus === 'Missing' || f.verificationStatus === 'Damaged') && (
                  <input
                    className="glass-input text-xs mt-1"
                    placeholder="Add notes (optional)…"
                    value={f.notes}
                    onChange={e => updateFinding(i, 'notes', e.target.value)}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-glass text-sm">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || completedCount < findings.length}
            className="btn-yellow text-sm min-w-[140px] flex justify-center disabled:opacity-50"
          >
            {submitting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : `Submit ${completedCount} Findings`}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Main Audit Page ────────────────────────────────────────────
export default function AuditPage() {
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, cycle: null });
  const [findingsModal, setFindingsModal] = useState({ open: false, cycle: null });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, cycle: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: auditRes, loading, error, refetch } = useFetch(getAuditCycles, null, [refreshKey]);
  const audits = auditRes?.data || [];

  // RBAC — Admin/AssetManager can create cycles and assign auditors
  const canManageCycles = hasRole([EmployeeRole.Admin, EmployeeRole.AssetManager]);

  // Check if current user is an assigned auditor for a given cycle
  const isAuditorOnCycle = (audit) => {
    if (!user) return false;
    // auditors may come as an array of names or an array of objects with id
    return (audit.auditorIds || []).includes(user.id) || (audit.auditors || []).some(a => a === user.name || a?.id === user.id);
  };

  // Summary stats
  const stats = useMemo(() => ({
    open: audits.filter(a => a.status === AuditCycleStatus.Open).length,
    closed: audits.filter(a => a.status === AuditCycleStatus.Closed).length,
    totalMissing: audits.reduce((sum, a) => sum + (a.missing || 0), 0),
  }), [audits]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleCreateCycle = async (payload) => {
    try {
      await createAuditCycle(payload);
      addToast('Audit cycle created.', 'success');
      setShowNewCycleModal(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Failed to create cycle', 'error');
    }
  };

  const handleAssignAuditors = async (cycleId, auditorIds) => {
    try {
      await addAuditors(cycleId, { auditorIds });
      addToast('Auditors assigned.', 'success');
      setAssignModal({ open: false, cycle: null });
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Failed to assign auditors', 'error');
    }
  };

  const handleSubmitFindings = async (cycleId, findings) => {
    try {
      // Submit each finding individually as per architecture.md (POST /audit-findings)
      for (const f of findings) {
        await createAuditFinding({
          auditCycleId: cycleId,
          assetId: f.assetId,
          expectedLocation: f.expectedLocation,
          verificationStatus: f.verificationStatus,
          notes: f.notes || null,
        });
      }
      addToast(`${findings.length} findings submitted.`, 'success');
      setFindingsModal({ open: false, cycle: null });
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Failed to submit findings', 'error');
    }
  };

  const handleCloseCycle = async () => {
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

  // ── Table columns ────────────────────────────────────────────
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
              title={typeof name === 'string' ? name : name?.name}
              aria-label={typeof name === 'string' ? name : name?.name}
            >
              {(typeof name === 'string' ? name : name?.name || '?').charAt(0)}
            </div>
          ))}
          {(audit.auditors || []).length > 4 && (
            <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-[#121214] flex items-center justify-center text-[10px] font-bold text-text-dim">
              +{audit.auditors.length - 4}
            </div>
          )}
          {(audit.auditors || []).length === 0 && <span className="text-xs text-text-dim">None assigned</span>}
        </div>
      ),
    },
    {
      header: 'Findings',
      render: (audit) => (
        <div className="min-w-[120px]">
          <FindingsBar verified={audit.verified} missing={audit.missing} damaged={audit.damaged} total={audit.totalAssets} />
        </div>
      ),
    },
    {
      header: 'Status',
      render: (audit) => <StatusPill status={audit.status} />,
    },
    {
      header: 'Actions',
      render: (audit) => {
        if (audit.status !== AuditCycleStatus.Open) return null;

        return (
          <div className="flex gap-2 flex-wrap">
            {/* Assign Auditors — Admin/AssetManager only */}
            {canManageCycles && (
              <button
                onClick={(e) => { e.stopPropagation(); setAssignModal({ open: true, cycle: audit }); }}
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-[#818CF8] transition-colors py-1 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]"
                aria-label="Assign auditors"
              >
                <Users size={13} aria-hidden="true" /> Assign
              </button>
            )}

            {/* Submit Findings — only if user is an assigned auditor on THIS cycle */}
            {isAuditorOnCycle(audit) && (
              <button
                onClick={(e) => { e.stopPropagation(); setFindingsModal({ open: true, cycle: audit }); }}
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-yellow transition-colors py-1 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]"
                aria-label="Submit findings"
              >
                <ClipboardCheck size={13} aria-hidden="true" /> Findings
              </button>
            )}

            {/* Close Cycle — Admin/AssetManager only */}
            {canManageCycles && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, cycle: audit }); }}
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-yellow transition-colors py-1 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]"
                aria-label="Close audit cycle"
              >
                <CheckCircle2 size={13} aria-hidden="true" /> Close
              </button>
            )}
          </div>
        );
      },
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

        {/* New Audit Cycle — Admin/AssetManager only */}
        {canManageCycles && (
          <button onClick={() => setShowNewCycleModal(true)} className="w-full md:w-auto btn-yellow flex items-center justify-center gap-2 text-sm">
            <Plus size={15} aria-hidden="true" />
            New Audit Cycle
          </button>
        )}
      </div>

      {/* Error banner */}
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

      {/* ── Modals ── */}
      {showNewCycleModal && (
        <NewCycleModal onClose={() => setShowNewCycleModal(false)} onSave={handleCreateCycle} />
      )}

      {assignModal.open && (
        <AssignAuditorsModal
          cycle={assignModal.cycle}
          onClose={() => setAssignModal({ open: false, cycle: null })}
          onSave={handleAssignAuditors}
        />
      )}

      {findingsModal.open && (
        <SubmitFindingsModal
          cycle={findingsModal.cycle}
          onClose={() => setFindingsModal({ open: false, cycle: null })}
          onSave={handleSubmitFindings}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, cycle: null })}
        onConfirm={handleCloseCycle}
        title="Close Audit Cycle"
        message={`This will mark ${confirmDialog.cycle?.missing || 0} missing asset(s) as Lost. This action cannot be undone.`}
        confirmText="Close Cycle"
        isDestructive
        isLoading={isSubmitting}
      />
    </div>
  );
}

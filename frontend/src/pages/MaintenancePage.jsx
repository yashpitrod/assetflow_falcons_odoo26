import { useState, useMemo } from 'react';
import { Wrench, Plus, ChevronRight, Check, Play, X, UserPlus } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  startMaintenanceWork,
  resolveMaintenanceRequest,
} from '../api/maintenance';
import { getAssets } from '../api/assets';
import GlassCard from '../components/GlassCard';
import StatusPill from '../components/StatusPill';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/formatters';
import { MaintenanceStatus, MaintenancePriority, EmployeeRole } from '../utils/constants';

// Kanban column order matches the exact Prisma enum values byte-for-byte
const KANBAN_COLUMNS = [
  MaintenanceStatus.Pending,
  MaintenanceStatus.Approved,
  MaintenanceStatus.TechnicianAssigned,
  MaintenanceStatus.InProgress,
  MaintenanceStatus.Resolved,
  MaintenanceStatus.Rejected,
];

// Human-readable column labels — derived from the enum key
function columnLabel(status) {
  return status.replace(/([A-Z])/g, ' $1').trim();
}

// ── New Request Modal ──────────────────────────────────────────
function NewRequestModal({ onClose, onSave, assets, assetsLoading }) {
  const [form, setForm] = useState({ assetId: '', issueDescription: '', priority: MaintenancePriority.Medium });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.assetId) errs.assetId = 'Select an asset';
    if (!form.issueDescription.trim()) errs.issueDescription = 'Describe the issue';
    if (form.issueDescription.trim().length < 10) errs.issueDescription = 'Description must be at least 10 characters';
    if (!form.priority) errs.priority = 'Select a priority';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await onSave({
      assetId: Number(form.assetId),
      issueDescription: form.issueDescription.trim(),
      priority: form.priority,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md" padding="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-semibold">New Maintenance Request</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset selector */}
          <div>
            <label className="eyebrow mb-1.5 block">Asset</label>
            <select
              className="glass-input"
              value={form.assetId}
              disabled={assetsLoading}
              onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
            >
              <option value="">{assetsLoading ? 'Loading assets…' : 'Select an asset…'}</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>
              ))}
            </select>
            {errors.assetId && <p className="text-status-danger text-xs mt-1">{errors.assetId}</p>}
          </div>

          {/* Issue description */}
          <div>
            <label className="eyebrow mb-1.5 block">Issue Description</label>
            <textarea
              className="glass-input min-h-[100px] resize-none"
              value={form.issueDescription}
              onChange={e => setForm(f => ({ ...f, issueDescription: e.target.value }))}
              placeholder="Describe the problem in detail…"
            />
            {errors.issueDescription && <p className="text-status-danger text-xs mt-1">{errors.issueDescription}</p>}
          </div>

          {/* Priority */}
          <div>
            <label className="eyebrow mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {Object.values(MaintenancePriority).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    form.priority === p
                      ? p === 'High' ? 'bg-red-500/15 border-red-500/30 text-status-danger'
                        : p === 'Medium' ? 'bg-yellow-500/15 border-yellow-500/30 text-accent-yellow'
                        : 'bg-green-500/15 border-green-500/30 text-status-success'
                      : 'bg-white/[0.02] border-white/[0.06] text-text-dim hover:text-text-secondary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {errors.priority && <p className="text-status-danger text-xs mt-1">{errors.priority}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-yellow text-sm min-w-[120px] flex justify-center">
              {submitting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Submit Request'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ── Assign Technician Modal ────────────────────────────────────
function AssignTechModal({ req, onClose, onSave }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Technician name is required'); return; }
    setSubmitting(true);
    await onSave(req.id, name.trim());
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-sm" padding="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-semibold">Assign Technician</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary"><X size={18} /></button>
        </div>
        <p className="text-text-dim text-xs mb-4">For: <span className="text-text-secondary font-medium">{req?.asset?.name}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="eyebrow mb-1.5 block">Technician Name</label>
            <input
              className="glass-input"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Enter technician name"
            />
            {error && <p className="text-status-danger text-xs mt-1">{error}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-glass text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-yellow text-sm min-w-[100px] flex justify-center">
              {submitting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Assign'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ── Main Maintenance Page ──────────────────────────────────────
export default function MaintenancePage() {
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const { data: maintRes, loading } = useFetch(getMaintenanceRequests, {}, [refreshKey]);
  const requests = maintRes?.data || [];

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, req: null });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, req: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assets for the New Request form — loaded on demand
  const [assetsForForm, setAssetsForForm] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  // RBAC helpers — who can do what
  const canApproveReject = hasRole([EmployeeRole.Admin, EmployeeRole.AssetManager, EmployeeRole.DepartmentHead]);
  const isAdmin = hasRole([EmployeeRole.Admin]);

  // Load assets when New Request modal opens
  const openNewModal = async () => {
    setShowNewModal(true);
    setAssetsLoading(true);
    try {
      const res = await getAssets();
      let allAssets = res?.data || [];
      // Non-admin users can only raise requests for assets allocated to them
      if (!isAdmin) {
        allAssets = allAssets.filter(a =>
          a.allocatedToId === user?.id || a.departmentId === user?.departmentId
        );
      }
      setAssetsForForm(allAssets);
    } catch {
      addToast('Failed to load assets', 'error');
    } finally {
      setAssetsLoading(false);
    }
  };

  // ── Action handlers ──────────────────────────────────────────
  const handleConfirmAction = async () => {
    const { type, req } = confirmDialog;
    if (!req) return;
    setIsSubmitting(true);
    try {
      if (type === 'approve') await approveMaintenanceRequest(req.id);
      if (type === 'reject') await rejectMaintenanceRequest(req.id);
      if (type === 'start') await startMaintenanceWork(req.id);
      if (type === 'resolve') await resolveMaintenanceRequest(req.id);
      addToast(`Request ${type === 'start' ? 'started' : type + 'd'} successfully.`, 'success');
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
      setConfirmDialog({ isOpen: false, type: null, req: null });
    }
  };

  const handleNewRequest = async (formData) => {
    try {
      await createMaintenanceRequest(formData);
      addToast('Maintenance request created.', 'success');
      setShowNewModal(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Failed to create request', 'error');
    }
  };

  const handleAssignTech = async (reqId, techName) => {
    try {
      await assignTechnician(reqId, techName);
      addToast('Technician assigned.', 'success');
      setAssignModal({ open: false, req: null });
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Failed to assign technician', 'error');
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-[1600px] h-full flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <p className="eyebrow mb-1">Service & Repair</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Maintenance Board</h1>
        </div>
        <button onClick={openNewModal} className="btn-yellow flex items-center gap-2">
          <Plus size={16} />
          New Request
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <DashboardSkeleton />
      ) : requests.length === 0 ? (
        <GlassCard><EmptyState icon={Wrench} title="No maintenance requests" message="Create your first request to get started." /></GlassCard>
      ) : (
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4 custom-scrollbar">
          {KANBAN_COLUMNS.map(col => {
            const colRequests = requests.filter(r => r.status === col);

            return (
              <div key={col} className="w-80 shrink-0 flex flex-col bg-white/[0.01] rounded-2xl border border-white/[0.03] overflow-hidden">
                {/* Column header */}
                <div className="p-4 border-b border-white/[0.05] flex items-center justify-between glass-surface sticky top-0 z-10">
                  <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                    {columnLabel(col)}
                    <span className="bg-white/10 text-text-dim text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {colRequests.length}
                    </span>
                  </h3>
                </div>

                {/* Cards */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {colRequests.map((req, i) => {
                    const staggerClass = i < 5 ? `animate-stagger-${i + 1}` : '';
                    return (
                      <GlassCard
                        key={req.id}
                        padding="p-4"
                        className={`cursor-pointer group relative overflow-hidden animate-fade-in-up ${staggerClass}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium text-text-primary truncate pr-2">{req.asset?.name}</p>
                          <StatusPill status={req.priority} />
                        </div>
                        <p className="text-xs text-text-dim mb-3 font-mono">{req.asset?.assetTag}</p>
                        <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">{req.issueDescription}</p>

                        {/* Technician info if assigned */}
                        {req.technicianName && (
                          <p className="text-xs text-text-dim mb-3 flex items-center gap-1.5">
                            <UserPlus size={11} /> {req.technicianName}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-text-dim border-t border-white/5 pt-3">
                          <span className="flex items-center gap-1.5 font-medium text-text-secondary"><Wrench size={12}/> {req.raisedByEmployeeName}</span>
                          <span>{formatDate(req.createdAt)}</span>
                        </div>

                        {/* Hover Overlay Actions — RBAC gated, hidden not disabled */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Pending: Approve/Reject (Admin/AssetManager/DeptHead only) */}
                          {col === MaintenanceStatus.Pending && canApproveReject && (
                            <>
                              <button onClick={() => setConfirmDialog({ isOpen: true, type: 'approve', req })} className="btn-glass text-xs w-28 text-status-success border-green-500/20 hover:bg-green-500/10 hover:border-green-500/30">Approve</button>
                              <button onClick={() => setConfirmDialog({ isOpen: true, type: 'reject', req })} className="btn-glass text-xs w-28 text-status-danger border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30">Reject</button>
                            </>
                          )}

                          {/* Approved: Assign Technician (Admin/AssetManager/DeptHead only) */}
                          {col === MaintenanceStatus.Approved && canApproveReject && (
                            <button onClick={() => setAssignModal({ open: true, req })} className="btn-glass text-xs w-28 flex items-center justify-center gap-1 text-[#818CF8] border-indigo-500/20 hover:bg-indigo-500/10"><UserPlus size={14}/> Assign Tech</button>
                          )}

                          {/* TechnicianAssigned: Start Work (Admin/AssetManager/DeptHead) */}
                          {col === MaintenanceStatus.TechnicianAssigned && canApproveReject && (
                            <button onClick={() => setConfirmDialog({ isOpen: true, type: 'start', req })} className="btn-yellow text-xs w-28 flex items-center justify-center gap-1"><Play size={14}/> Start Work</button>
                          )}

                          {/* InProgress: Resolve (Admin/AssetManager/DeptHead) */}
                          {col === MaintenanceStatus.InProgress && canApproveReject && (
                            <button onClick={() => setConfirmDialog({ isOpen: true, type: 'resolve', req })} className="btn-yellow text-xs w-28 flex items-center justify-center gap-1"><Check size={14}/> Resolve</button>
                          )}

                          {/* View Details — always visible for all cards */}
                          <button className="btn-glass text-xs w-28 flex items-center justify-center gap-1">View Details <ChevronRight size={14}/></button>
                        </div>
                      </GlassCard>
                    );
                  })}

                  {colRequests.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-sm font-medium text-text-dim/50 border-2 border-dashed border-white/[0.03] rounded-2xl mx-1 bg-white/[0.01]">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {showNewModal && (
        <NewRequestModal
          onClose={() => setShowNewModal(false)}
          onSave={handleNewRequest}
          assets={assetsForForm}
          assetsLoading={assetsLoading}
        />
      )}

      {assignModal.open && (
        <AssignTechModal
          req={assignModal.req}
          onClose={() => setAssignModal({ open: false, req: null })}
          onSave={handleAssignTech}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, req: null })}
        onConfirm={handleConfirmAction}
        title={`${confirmDialog.type ? confirmDialog.type.charAt(0).toUpperCase() + confirmDialog.type.slice(1) : ''} Request`}
        message={`Are you sure you want to ${confirmDialog.type} this maintenance request for ${confirmDialog.req?.asset?.name}?`}
        confirmText="Confirm"
        isDestructive={confirmDialog.type === 'reject'}
        isLoading={isSubmitting}
      />
    </div>
  );
}

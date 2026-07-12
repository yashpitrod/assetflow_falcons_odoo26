import { useState } from 'react';
import { Wrench, Plus, ChevronRight, Check } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { getMaintenanceRequests, approveMaintenanceRequest, rejectMaintenanceRequest, resolveMaintenanceRequest } from '../api/maintenance';
import GlassCard from '../components/GlassCard';
import StatusPill from '../components/StatusPill';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/formatters';

const KANBAN_COLUMNS = ['Pending', 'Approved', 'TechnicianAssigned', 'InProgress', 'Resolved', 'Rejected'];

export default function MaintenancePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: maintRes, loading } = useFetch(getMaintenanceRequests, {}, [refreshKey]);
  const requests = maintRes?.data || [];
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, req: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleAction = async () => {
    const { type, req } = confirmDialog;
    if (!req) return;
    
    setIsSubmitting(true);
    try {
      if (type === 'approve') await approveMaintenanceRequest(req.id);
      if (type === 'reject') await rejectMaintenanceRequest(req.id);
      if (type === 'resolve') await resolveMaintenanceRequest(req.id);
      
      addToast(`Request ${type}d successfully.`, 'success');
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
      setConfirmDialog({ isOpen: false, type: null, req: null });
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] h-full flex flex-col animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <p className="eyebrow mb-1">Service & Repair</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Maintenance Board</h1>
        </div>
        <button className="btn-yellow flex items-center gap-2">
          <Plus size={16} />
          New Request
        </button>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : requests.length === 0 ? (
        <GlassCard><EmptyState icon={Wrench} title="No maintenance requests" /></GlassCard>
      ) : (
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4 custom-scrollbar">
          {KANBAN_COLUMNS.map(col => {
            const colRequests = requests.filter(r => r.status === col);
            
            return (
              <div key={col} className="w-80 shrink-0 flex flex-col bg-white/[0.01] rounded-2xl border border-white/[0.03] overflow-hidden">
                <div className="p-4 border-b border-white/[0.05] flex items-center justify-between glass-surface sticky top-0 z-10">
                  <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                    {col.replace(/([A-Z])/g, ' $1').trim()}
                    <span className="bg-white/10 text-text-dim text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {colRequests.length}
                    </span>
                  </h3>
                </div>
                
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
                        
                        <div className="flex items-center justify-between text-[11px] text-text-dim border-t border-white/5 pt-3">
                          <span className="flex items-center gap-1.5 font-medium text-text-secondary"><Wrench size={12}/> {req.raisedByEmployeeName}</span>
                          <span>{formatDate(req.createdAt)}</span>
                        </div>
                        
                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {col === 'Pending' && (
                            <>
                              <button onClick={() => setConfirmDialog({ isOpen: true, type: 'approve', req })} className="btn-glass text-xs w-28 text-status-success border-green-500/20 hover:bg-green-500/10 hover:border-green-500/30">Approve</button>
                              <button onClick={() => setConfirmDialog({ isOpen: true, type: 'reject', req })} className="btn-glass text-xs w-28 text-status-danger border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30">Reject</button>
                            </>
                          )}
                          {col === 'InProgress' && (
                            <button onClick={() => setConfirmDialog({ isOpen: true, type: 'resolve', req })} className="btn-yellow text-xs w-28 flex items-center justify-center gap-1"><Check size={14}/> Resolve</button>
                          )}
                          {(col !== 'Pending' && col !== 'InProgress') && (
                            <button className="btn-glass text-xs w-28 flex items-center justify-center gap-1">View Details <ChevronRight size={14}/></button>
                          )}
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

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, req: null })}
        onConfirm={handleAction}
        title={`${confirmDialog.type ? confirmDialog.type.charAt(0).toUpperCase() + confirmDialog.type.slice(1) : ''} Request`}
        message={`Are you sure you want to ${confirmDialog.type} this maintenance request for ${confirmDialog.req?.asset?.name}?`}
        confirmText="Confirm"
        isDestructive={confirmDialog.type === 'reject'}
        isLoading={isSubmitting}
      />
    </div>
  );
}

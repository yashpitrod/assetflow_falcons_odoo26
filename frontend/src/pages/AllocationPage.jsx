import { useState, useMemo, useEffect } from 'react';
import { ArrowLeftRight, Check, X, Search, Plus } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { getAllocations, getTransferRequests, approveTransfer, rejectTransfer } from '../api/allocations';
import GlassCard from '../components/GlassCard';
import StatusPill from '../components/StatusPill';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/formatters';
import { AllocationStatus, TransferStatus } from '../utils/constants';

export default function AllocationPage() {
  const [activeTab, setActiveTab] = useState('allocations');
  const [search, setSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, transfer: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { addToast } = useToast();

  // Load both datasets in parallel — they share the same refresh key
  const { data: allocationsData, loading: allocLoading, error: allocError } = useFetch(getAllocations, null, [refreshKey]);
  const { data: transfersData, loading: transLoading, error: transError } = useFetch(getTransferRequests, null, [refreshKey]);

  const allAllocations = allocationsData ?? [];
  const allTransfers = transfersData ?? [];

  useEffect(() => {
    if (allocError) addToast(`Allocations failed to load: ${allocError}`, 'error');
  }, [allocError, addToast]);

  useEffect(() => {
    if (transError) addToast(`Transfer requests failed to load: ${transError}`, 'error');
  }, [transError, addToast]);

  // Client-side search filter on server-returned data
  const allocations = useMemo(() => {
    if (!search) return allAllocations;
    const q = search.toLowerCase();
    return allAllocations.filter(al =>
      al.asset?.name?.toLowerCase().includes(q) ||
      al.employeeName?.toLowerCase().includes(q) ||
      al.asset?.assetTag?.toLowerCase().includes(q)
    );
  }, [allAllocations, search]);

  const filteredTransfers = useMemo(() => {
    if (!search) return allTransfers;
    const q = search.toLowerCase();
    return allTransfers.filter(tr =>
      tr.asset?.name?.toLowerCase().includes(q) ||
      tr.fromEmployeeName?.toLowerCase().includes(q) ||
      tr.toEmployeeName?.toLowerCase().includes(q)
    );
  }, [allTransfers, search]);

  const pendingCount = allTransfers.filter(t => t.status === TransferStatus.Requested).length;

  const handleActionClick = (type, transfer) => {
    setConfirmDialog({ isOpen: true, type, transfer });
  };

  const handleConfirm = async () => {
    const { type, transfer } = confirmDialog;
    if (!transfer) return;

    setIsSubmitting(true);
    try {
      if (type === 'approve') {
        await approveTransfer(transfer.id);
        addToast(`Transfer for ${transfer.asset?.name} approved.`, 'success');
      } else if (type === 'reject') {
        await rejectTransfer(transfer.id);
        addToast(`Transfer rejected.`, 'info');
      }
      setRefreshKey(k => k + 1);
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
      setConfirmDialog({ isOpen: false, type: null, transfer: null });
    }
  };

  const allocationColumns = [
    {
      header: 'Asset',
      render: (al) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{al.asset?.name}</p>
          <p className="text-xs text-text-dim font-mono">{al.asset?.assetTag}</p>
        </div>
      ),
    },
    {
      header: 'Allocated To',
      render: (al) => (
        <div>
          <p className="text-sm text-text-secondary font-medium">{al.employeeName}</p>
          <p className="text-xs text-text-dim">{al.departmentName}</p>
        </div>
      ),
    },
    {
      header: 'Allocated On',
      render: (al) => <span className="text-sm text-text-secondary">{formatDate(al.allocatedDate)}</span>,
    },
    {
      header: 'Return Due',
      render: (al) => (
        <span className={`text-sm ${al.isOverdue ? 'text-status-danger font-semibold' : 'text-text-secondary'}`}>
          {al.expectedReturnDate ? formatDate(al.expectedReturnDate) : '—'}
          {al.isOverdue && ' ⚠'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (al) => <StatusPill status={al.status} />,
    },
  ];

  const transferColumns = [
    {
      header: 'Asset',
      render: (tr) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{tr.asset?.name}</p>
          <p className="text-xs text-text-dim font-mono">{tr.asset?.assetTag}</p>
        </div>
      ),
    },
    {
      header: 'From → To',
      render: (tr) => (
        <div>
          <p className="text-sm text-text-secondary">
            <span className="text-text-dim text-xs">From</span>{' '}{tr.fromEmployeeName}
          </p>
          <p className="text-sm text-text-secondary">
            <span className="text-text-dim text-xs">To</span>{' '}{tr.toEmployeeName}
          </p>
        </div>
      ),
    },
    {
      header: 'Reason',
      render: (tr) => (
        <span className="text-sm text-text-secondary line-clamp-2 max-w-[200px]" title={tr.reason}>
          {tr.reason || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (tr) => <StatusPill status={tr.status} />,
    },
    {
      header: 'Actions',
      render: (tr) =>
        tr.status === TransferStatus.Requested ? (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleActionClick('approve', tr); }}
              className="p-1.5 rounded-full bg-green-500/10 text-status-success hover:bg-green-500/20 transition-colors"
              aria-label={`Approve transfer for ${tr.asset?.name}`}
            >
              <Check size={15} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleActionClick('reject', tr); }}
              className="p-1.5 rounded-full bg-red-500/10 text-status-danger hover:bg-red-500/20 transition-colors"
              aria-label={`Reject transfer for ${tr.asset?.name}`}
            >
              <X size={15} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Asset Movement</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Allocations & Transfers</h1>
          <p className="text-text-secondary text-sm mt-1">
            {allAllocations.filter(a => a.status === AllocationStatus.Active).length} active allocations
            {pendingCount > 0 && (
              <span className="ml-2 text-accent-yellow font-semibold">· {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search allocations or transfers"
              className="glass-input pl-9 w-full sm:w-56 text-sm"
            />
          </div>
          <button className="w-full sm:w-auto btn-yellow flex items-center justify-center gap-2 text-sm">
            <Plus size={15} aria-hidden="true" />
            Allocate Asset
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div
        className="flex items-center gap-1 p-1 rounded-pill bg-white/[0.02] border border-white/[0.05] w-fit"
        role="tablist"
        aria-label="View allocations or transfer requests"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'allocations'}
          onClick={() => setActiveTab('allocations')}
          className={`px-5 py-2 rounded-pill text-sm font-medium transition-colors ${
            activeTab === 'allocations' ? 'bg-white/[0.08] text-text-primary shadow-sm' : 'text-text-dim hover:text-text-secondary'
          }`}
        >
          Active Allocations
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'transfers'}
          onClick={() => setActiveTab('transfers')}
          className={`px-5 py-2 rounded-pill text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'transfers' ? 'bg-white/[0.08] text-text-primary shadow-sm' : 'text-text-dim hover:text-text-secondary'
          }`}
        >
          Transfer Requests
          {pendingCount > 0 && (
            <span className="bg-accent-yellow text-bg-base text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <GlassCard padding="p-0">
        {(activeTab === 'allocations' ? allocError : transError) && !(activeTab === 'allocations' ? allocLoading : transLoading) && (
          <div className="p-4 border-b border-red-500/20 bg-red-500/5">
            <p className="text-sm text-status-danger">
              {activeTab === 'allocations' ? allocError : transError}
            </p>
          </div>
        )}
        <Table
          columns={activeTab === 'allocations' ? allocationColumns : transferColumns}
          data={activeTab === 'allocations' ? allocations : filteredTransfers}
          loading={activeTab === 'allocations' ? allocLoading : transLoading}
          emptyIcon={ArrowLeftRight}
          emptyTitle={activeTab === 'allocations' ? 'No active allocations' : 'No transfer requests'}
          emptyMessage={
            search
              ? 'No matches found for your search.'
              : activeTab === 'transfers'
              ? 'Transfer requests appear here when employees request asset handovers.'
              : undefined
          }
        />
      </GlassCard>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, transfer: null })}
        onConfirm={handleConfirm}
        title={confirmDialog.type === 'approve' ? 'Approve Transfer Request' : 'Reject Transfer Request'}
        message={
          confirmDialog.type === 'approve'
            ? `Approve the transfer of ${confirmDialog.transfer?.asset?.name} from ${confirmDialog.transfer?.fromEmployeeName} to ${confirmDialog.transfer?.toEmployeeName}?`
            : `Reject the transfer request for ${confirmDialog.transfer?.asset?.name}? The requester will be notified.`
        }
        confirmText={confirmDialog.type === 'approve' ? 'Approve' : 'Reject'}
        isDestructive={confirmDialog.type === 'reject'}
        isLoading={isSubmitting}
      />
    </div>
  );
}

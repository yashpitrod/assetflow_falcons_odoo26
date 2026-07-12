import { useState, useMemo, useEffect } from 'react';
import { Package, Search, Plus, Filter, X, Tag, MapPin, Calendar } from 'lucide-react';
import { useFetch, useDebounce } from '../hooks/useFetch';
import { getAssets } from '../api/assets';
import GlassCard from '../components/GlassCard';
import StatusPill from '../components/StatusPill';
import Table from '../components/Table';
import { formatDate, formatCurrency } from '../utils/formatters';
import { AssetStatus } from '../utils/constants';
import { useToast } from '../components/Toast';

const STATUS_OPTIONS = ['', ...Object.values(AssetStatus)];

export default function AssetRegistryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToast();

  // Debounce search so we don't re-fetch on every keystroke
  const debouncedSearch = useDebounce(search, 300);

  const filters = useMemo(
    () => ({ search: debouncedSearch, status: statusFilter }),
    [debouncedSearch, statusFilter]
  );

  const { data: assets, loading, error, refetch } = useFetch(getAssets, filters, [filters]);
  const assetList = assets ?? [];

  // Surface errors via toast — no silent failures
  useEffect(() => {
    if (error) addToast(`Assets failed to load: ${error}`, 'error');
  }, [error, addToast]);

  const columns = [
    {
      header: 'Asset',
      render: (asset) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{asset.name}</p>
          <p className="text-xs text-text-dim">{asset.categoryName || 'General'}</p>
        </div>
      ),
    },
    {
      header: 'Tag / Serial',
      render: (asset) => (
        <div>
          <p className="text-sm text-text-secondary font-mono tracking-tight">{asset.assetTag}</p>
          <p className="text-xs text-text-dim">{asset.serialNumber || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (asset) => <StatusPill status={asset.status} />,
    },
    {
      header: 'Location',
      render: (asset) => (
        <span className="text-sm text-text-secondary flex items-center gap-1">
          <MapPin size={12} className="text-text-dim shrink-0" aria-hidden="true" />
          {asset.location || '—'}
        </span>
      ),
    },
    {
      header: 'Acquired',
      render: (asset) => (
        <span className="text-sm text-text-secondary flex items-center gap-1">
          <Calendar size={12} className="text-text-dim shrink-0" aria-hidden="true" />
          {formatDate(asset.acquisitionDate)}
        </span>
      ),
    },
    {
      header: 'Cost',
      render: (asset) => (
        <span className="text-sm text-text-secondary font-mono">
          {asset.acquisitionCost ? formatCurrency(asset.acquisitionCost) : '—'}
        </span>
      ),
    },
  ];

  const activeFilters = [statusFilter].filter(Boolean).length;

  return (
    <div className="space-y-5 max-w-7xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Directory</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Asset Registry</h1>
          <p className="text-text-secondary text-sm mt-1">
            {loading ? 'Loading…' : `${assetList.length} asset${assetList.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search assets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search assets"
              className="glass-input pl-9 w-full sm:w-60 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(s => !s)}
              aria-label="Toggle filters"
              aria-expanded={showFilters}
              className={`flex-1 sm:flex-none btn-glass flex items-center justify-center gap-2 text-sm ${
                activeFilters > 0 ? 'border-accent-yellow/30 text-accent-yellow' : ''
              }`}
            >
              <Filter size={15} aria-hidden="true" />
              Filter
              {activeFilters > 0 && (
                <span className="bg-accent-yellow text-bg-base text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </button>

            <button className="flex-1 sm:flex-none btn-yellow flex items-center justify-center gap-2 text-sm">
              <Plus size={15} aria-hidden="true" />
              New Asset
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <GlassCard padding="p-4" className="animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-text-dim" aria-hidden="true" />
              <label htmlFor="status-filter" className="eyebrow">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input text-sm py-1.5"
              >
                <option value="">All statuses</option>
                {Object.values(AssetStatus).map(s => (
                  <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>
                ))}
              </select>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={() => { setStatusFilter(''); }}
                className="text-xs text-text-dim hover:text-status-danger flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </GlassCard>
      )}

      {/* Error state */}
      {error && !loading && (
        <GlassCard padding="p-6" className="border border-red-500/20 bg-red-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-status-danger">Failed to load assets: {error}</p>
            <button onClick={refetch} className="btn-glass text-sm text-status-danger border-red-500/20 min-h-[44px] px-5">
              Retry
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard padding="p-0">
        <Table
          columns={columns}
          data={assetList}
          loading={loading}
          emptyIcon={Package}
          emptyTitle="No assets found"
          emptyMessage={search || statusFilter ? 'Try adjusting your search or filters.' : 'Register your first asset to get started.'}
        />
      </GlassCard>
    </div>
  );
}

import { useMemo, useState, useCallback, useEffect } from 'react';
import { BarChart3, Download, PieChart, Activity, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import GlassCard from '../components/GlassCard';
import { useFetch } from '../hooks/useFetch';
import { getUtilizationReport, getMaintenanceFrequency, getIdleAssets, getMostUsedAssets } from '../api/reports';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

const CHART_COLORS = ['#FACC15', '#818CF8', '#C026D3', '#22C55E', '#F59E0B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-surface rounded-2xl px-4 py-3 text-sm shadow-xl">
      <p className="text-text-dim text-xs mb-1 font-semibold uppercase tracking-wider">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#FACC15' }} className="font-bold">
          {p.value}{p.name === 'utilization' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

// ── CSV Escaping — wraps fields in quotes and escapes embedded quotes/commas ──
function escapeCSV(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // Always wrap in quotes; double any existing quotes inside
  return `"${str.replace(/"/g, '""')}"`;
}

function buildCSVContent(utilData, maintData, idleData, usedData) {
  const lines = [];

  // Section 1: Department Utilization
  lines.push('Department Utilization');
  lines.push([escapeCSV('Department'), escapeCSV('Utilization %')].join(','));
  (Array.isArray(utilData) ? utilData : []).forEach(d => {
    lines.push([escapeCSV(d.departmentName), escapeCSV(d.utilizationPercent)].join(','));
  });
  lines.push(''); // blank separator

  // Section 2: Maintenance Frequency
  lines.push('Maintenance Frequency');
  lines.push([escapeCSV('Month'), escapeCSV('Requests')].join(','));
  (Array.isArray(maintData) ? maintData : []).forEach(d => {
    lines.push([escapeCSV(d.month), escapeCSV(d.requests)].join(','));
  });
  lines.push('');

  // Section 3: Idle Assets
  lines.push('Idle Assets (30+ days)');
  lines.push([escapeCSV('Asset Tag'), escapeCSV('Name'), escapeCSV('Days Idle')].join(','));
  (Array.isArray(idleData) ? idleData : []).forEach(d => {
    lines.push([escapeCSV(d.assetTag), escapeCSV(d.name), escapeCSV(d.daysIdle)].join(','));
  });
  lines.push('');

  // Section 4: Most Used Resources
  lines.push('Most Used Resources');
  lines.push([escapeCSV('Asset'), escapeCSV('Booking Count')].join(','));
  (Array.isArray(usedData) ? usedData : []).forEach(d => {
    lines.push([escapeCSV(d.name), escapeCSV(d.bookingCount)].join(','));
  });

  return lines.join('\n');
}

export default function ReportsPage() {
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const { data: utilData, loading: utilLoading, error: utilError } = useFetch(getUtilizationReport, null, []);
  const { data: maintData, loading: maintLoading, error: maintError } = useFetch(getMaintenanceFrequency, null, []);
  const { data: idleData, loading: idleLoading, error: idleError } = useFetch(getIdleAssets, null, []);
  const { data: usedData, loading: usedLoading, error: usedError } = useFetch(getMostUsedAssets, null, []);

  useEffect(() => {
    if (utilError) addToast(`Utilization report failed: ${utilError}`, 'error');
    if (maintError) addToast(`Maintenance frequency report failed: ${maintError}`, 'error');
    if (idleError) addToast(`Idle assets report failed: ${idleError}`, 'error');
    if (usedError) addToast(`Most-used assets report failed: ${usedError}`, 'error');
  }, [utilError, maintError, idleError, usedError, addToast]);

  const utilizationChartData = useMemo(() => {
    if (!Array.isArray(utilData)) return [];
    return utilData.map(d => ({ name: d.departmentName?.split(' ')[0], utilization: d.utilizationPercent }));
  }, [utilData]);

  const maintChartData = useMemo(() => {
    if (!Array.isArray(maintData)) return [];
    return maintData;
  }, [maintData]);

  // Client-side CSV export with proper escaping — no backend dependency
  const handleExport = useCallback(() => {
    setIsExporting(true);
    try {
      const csvContent = buildCSVContent(utilData, maintData, idleData, usedData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assetflow_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Report exported successfully', 'success');
    } catch {
      addToast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [utilData, maintData, idleData, usedData, addToast]);

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Insights</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Reports & Analytics</h1>
          <p className="text-text-dim text-sm mt-1">Real-time asset performance overview</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          aria-label="Export data as CSV"
          className="btn-glass flex items-center justify-center gap-2 py-2.5 px-5 disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Row 1: Utilization Bar + Maintenance Line */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Department Utilization — bar chart */}
        <GlassCard padding="p-6" className="lg:col-span-3 animate-stagger-1 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-text-primary font-semibold text-sm">Department Utilization</h2>
              <p className="text-text-dim text-xs mt-0.5">Allocated assets per department</p>
            </div>
            <BarChart3 size={18} className="text-text-dim" aria-hidden="true" />
          </div>
          {utilLoading ? (
            <div className="h-[240px]"><LoadingSkeleton variant="card" /></div>
          ) : utilizationChartData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-text-dim text-sm">No utilization data yet</div>
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="#55555C" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#55555C" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 4 }} />
                  <Bar dataKey="utilization" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {utilizationChartData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        {/* Maintenance Frequency — line chart */}
        <GlassCard padding="p-6" className="lg:col-span-2 animate-stagger-2 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-text-primary font-semibold text-sm">Maintenance Trend</h2>
              <p className="text-text-dim text-xs mt-0.5">Requests per month</p>
            </div>
            <TrendingUp size={18} className="text-text-dim" aria-hidden="true" />
          </div>
          {maintLoading ? (
            <div className="h-[240px]"><LoadingSkeleton variant="card" /></div>
          ) : maintChartData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-text-dim text-sm">No maintenance data yet</div>
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={maintChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="month" stroke="#55555C" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#55555C" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(250,204,21,0.2)' }} />
                  <Line type="monotone" dataKey="requests" stroke="#FACC15" strokeWidth={2.5} dot={{ r: 4, fill: '#FACC15', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#FACC15' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Row 2: Idle Assets + Most Used */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Idle Assets */}
        <GlassCard padding="p-6" className="animate-stagger-3 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-text-primary font-semibold text-sm">Idle Assets</h2>
              <p className="text-text-dim text-xs mt-0.5">Not allocated for 30+ days</p>
            </div>
            <PieChart size={18} className="text-text-dim" aria-hidden="true" />
          </div>
          {idleLoading ? (
            <LoadingSkeleton variant="row" count={5} />
          ) : !(Array.isArray(idleData) && idleData.length) ? (
            <div className="py-8 text-center text-text-dim text-sm">No idle assets — all assets are in use!</div>
          ) : (
            <div className="space-y-2">
              {idleData.map((asset, i) => {
                const pct = Math.min((asset.daysIdle / 90) * 100, 100);
                return (
                  <div key={asset.id} className={`p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors animate-stagger-${i + 1} animate-fade-in-up`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{asset.name}</p>
                        <p className="text-xs text-text-dim font-mono">{asset.assetTag}</p>
                      </div>
                      <span className={`text-base font-bold ${asset.daysIdle > 45 ? 'text-status-danger' : 'text-accent-yellow'}`}>
                        {asset.daysIdle}d
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${asset.daysIdle > 45 ? 'bg-status-danger' : 'bg-accent-yellow'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Most Used Resources */}
        <GlassCard padding="p-6" className="animate-stagger-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-text-primary font-semibold text-sm">Most Used Resources</h2>
              <p className="text-text-dim text-xs mt-0.5">Bookable assets by booking count</p>
            </div>
            <Activity size={18} className="text-text-dim" aria-hidden="true" />
          </div>
          {usedLoading ? (
            <LoadingSkeleton variant="row" count={5} />
          ) : !(Array.isArray(usedData) && usedData.length) ? (
            <div className="py-8 text-center text-text-dim text-sm">No booking data yet</div>
          ) : (
            <div className="space-y-3">
              {usedData.map((asset, i) => {
                const max = usedData[0]?.bookingCount || 1;
                const pct = (asset.bookingCount / max) * 100;
                return (
                  <div key={asset.assetId} className={`animate-stagger-${i + 1} animate-fade-in-up`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-text-secondary font-medium truncate max-w-[70%]">{asset.name}</p>
                      <span className="text-xs text-accent-yellow font-bold">{asset.bookingCount} bookings</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#818CF8] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

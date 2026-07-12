import { useMemo, useState } from 'react';
import { BarChart3, Download, PieChart, Activity, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import GlassCard from '../components/GlassCard';
import { useFetch } from '../hooks/useFetch';
import { getUtilizationReport, getMaintenanceFrequency, getIdleAssets, getMostUsedAssets, exportReport } from '../api/reports';
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

export default function ReportsPage() {
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: utilData, loading: utilLoading } = useFetch(getUtilizationReport, null, []);
  const { data: maintData, loading: maintLoading } = useFetch(getMaintenanceFrequency, null, []);
  const { data: idleData, loading: idleLoading } = useFetch(getIdleAssets, null, []);
  const { data: usedData, loading: usedLoading } = useFetch(getMostUsedAssets, null, []);

  const utilizationChartData = useMemo(() => {
    if (!utilData?.data) return [];
    // Data now has departmentName + utilizationPercent shape
    return utilData.data.map(d => ({ name: d.departmentName?.split(' ')[0], utilization: d.utilizationPercent }));
  }, [utilData]);

  const maintChartData = useMemo(() => {
    if (!maintData?.data) return [];
    return maintData.data;
  }, [maintData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportReport('csv');
      addToast('Report exported successfully', 'success');
    } catch {
      addToast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

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
          ) : (
            <div className="space-y-2">
              {(idleData?.data || []).map((asset, i) => {
                // Visual urgency bar based on daysIdle
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
          ) : (
            <div className="space-y-3">
              {(usedData?.data || []).map((asset, i) => {
                const max = usedData.data[0]?.bookingCount || 1;
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

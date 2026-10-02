import { useMemo } from 'react';
import { AlertTriangle, ArrowDown, Search, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Order } from '@/types';
import { SectionHeader, StatusBadge, ChartCard, EmptyState } from '@/components/ui';
import { detectOperationalSignals, causalChain } from '@/logic/analysis';
import {
  analyzeZones,
  analyzeCancellationReasons,
  analyzeCancellationByZone,
  calculatePeakMetrics,
} from '@/logic/calculations';

const PIE_COLORS = ['#f43f5e', '#f97316', '#eab308', '#a855f7', '#3b82f6', '#64748b'];

interface RootCauseProps {
  orders: Order[];
}

export function RootCausePage({ orders }: RootCauseProps) {
  const signals = useMemo(() => detectOperationalSignals(orders), [orders]);
  const zones = useMemo(() => analyzeZones(orders), [orders]);
  const peak = useMemo(() => calculatePeakMetrics(orders), [orders]);
  const reasons = useMemo(() => analyzeCancellationReasons(orders), [orders]);
  const cancelByZone = useMemo(() => analyzeCancellationByZone(orders), [orders]);

  const zoneChartData = zones.map((z) => ({
    zone: z.zone.replace('Zone ', 'Z'),
    avgDelivery: Math.round(z.averageDeliveryTime * 10) / 10,
    cancelRate: Math.round(z.cancellationRate * 10) / 10,
    riderUtil: Math.round(z.riderUtilization * 10) / 10,
    invAvail: Math.round(z.inventoryAvailability * 10) / 10,
  }));

  const peakChartData = [
    {
      period: 'Peak',
      avgDelivery: Math.round(peak.peak.avgDeliveryTime * 10) / 10,
      cancelRate: Math.round(peak.peak.cancellationRate * 10) / 10,
      riderAvail: Math.round(peak.peak.riderAvailability * 10) / 10,
      invAvail: Math.round(peak.peak.inventoryAvailability * 10) / 10,
      repeatRate: Math.round(peak.peak.repeatPurchaseRate * 10) / 10,
    },
    {
      period: 'Non-Peak',
      avgDelivery: Math.round(peak.nonPeak.avgDeliveryTime * 10) / 10,
      cancelRate: Math.round(peak.nonPeak.cancellationRate * 10) / 10,
      riderAvail: Math.round(peak.nonPeak.riderAvailability * 10) / 10,
      invAvail: Math.round(peak.nonPeak.inventoryAvailability * 10) / 10,
      repeatRate: Math.round(peak.nonPeak.repeatPurchaseRate * 10) / 10,
    },
  ];

  if (orders.length === 0) {
    return (
      <div>
        <SectionHeader title="Root Cause Analysis" description="Transparent rule-based analysis of operational signals." />
        <EmptyState message="No data available. Load data in the Data Center." />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Root Cause Analysis"
        description="Transparent rule-based analysis of operational signals. Findings are hypotheses — not proven causation."
      />

      {/* Causal Chain */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            Analytical Hypothesis — Causal Chain
          </h2>
          <span className="text-xs text-amber-600 ml-2 font-medium">Requires Validation</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          This dataset demonstrates signals and associations rather than proving causality. The chain below is an analytical hypothesis that must be validated with controlled experiments.
        </p>
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-0 flex-wrap">
          {causalChain.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 min-w-[140px]">
                <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
              </div>
              {i < causalChain.length - 1 && (
                <ArrowDown className="w-4 h-4 text-pink-500 mx-1 md:rotate-[-90deg]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detected Signals */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-pink-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            Detected Operational Signals ({signals.length})
          </h2>
        </div>
        {signals.length === 0 ? (
          <EmptyState message="No significant operational signals detected in the current dataset." />
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <div key={signal.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 bg-pink-500 rounded-full" />
                    <p className="text-sm font-semibold text-slate-900">{signal.observation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Signal:</span>
                    <StatusBadge status={signal.confidence} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-3">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Evidence</p>
                    <p className="text-sm text-slate-700">{signal.evidence}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Possible Contributing Factor</p>
                    <p className="text-sm text-slate-700">{signal.possibleFactor}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Recommended Investigation</p>
                    <p className="text-sm text-slate-700">{signal.recommendedInvestigation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancellation Analysis */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-pink-500" />
          <h2 className="text-sm font-semibold text-slate-900">Cancellation Reason Analysis</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Cancellation Reasons"
            subtitle="Breakdown of cancellation reasons by count"
            textSummary={reasons.length > 0 ? `"${reasons[0].reason}" is the dominant reason at ${reasons[0].percentage.toFixed(1)}% of all cancellations.` : 'No cancellations in dataset.'}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={reasons} dataKey="count" nameKey="reason" cx="50%" cy="50%" outerRadius={80} label>
                  {reasons.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Cancellations by Zone"
            subtitle="Total cancellations per zone"
            textSummary="Zone C has the highest cancellation count, consistent with its delivery time issues."
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cancelByZone.map((c) => ({ zone: c.zone.replace('Zone ', 'Z'), cancellations: c.totalCancellations }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="zone" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="cancellations" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Peak Analysis */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-900">Peak vs Non-Peak Analysis</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2 font-semibold text-slate-700">Metric</th>
                  <th className="text-right px-4 py-2 font-semibold text-slate-700">Peak</th>
                  <th className="text-right px-4 py-2 font-semibold text-slate-700">Non-Peak</th>
                  <th className="text-right px-4 py-2 font-semibold text-slate-700">Difference</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Orders', peak: peak.peak.orders, nonPeak: peak.nonPeak.orders },
                  { label: 'Avg Delivery (min)', peak: peak.peak.avgDeliveryTime, nonPeak: peak.nonPeak.avgDeliveryTime },
                  { label: 'Cancel Rate (%)', peak: peak.peak.cancellationRate, nonPeak: peak.nonPeak.cancellationRate },
                  { label: 'Rider Avail (%)', peak: peak.peak.riderAvailability, nonPeak: peak.nonPeak.riderAvailability },
                  { label: 'Inventory Avail (%)', peak: peak.peak.inventoryAvailability, nonPeak: peak.nonPeak.inventoryAvailability },
                  { label: 'Repeat Purchase (%)', peak: peak.peak.repeatPurchaseRate, nonPeak: peak.nonPeak.repeatPurchaseRate },
                  { label: 'On-Time (%)', peak: peak.peak.onTimeDeliveryRate, nonPeak: peak.nonPeak.onTimeDeliveryRate },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{row.label}</td>
                    <td className="text-right px-4 py-2 text-slate-600">{row.peak.toFixed(1)}</td>
                    <td className="text-right px-4 py-2 text-slate-600">{row.nonPeak.toFixed(1)}</td>
                    <td className="text-right px-4 py-2 text-slate-600">{(row.peak - row.nonPeak).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ChartCard
          title="Peak vs Non-Peak Comparison"
          subtitle="Delivery time, cancellation, rider availability, and repeat purchase"
          textSummary="Peak hours show significantly higher delivery times and cancellations with lower rider availability."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={peakChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgDelivery" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Delivery (min)" />
              <Bar dataKey="cancelRate" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Cancel Rate (%)" />
              <Bar dataKey="riderAvail" fill="#10b981" radius={[4, 4, 0, 0]} name="Rider Avail (%)" />
              <Bar dataKey="repeatRate" fill="#ec4899" radius={[4, 4, 0, 0]} name="Repeat (%)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Zone comparison chart */}
      <ChartCard
        title="Zone Comparison"
        subtitle="Average delivery time and cancellation rate by zone"
        textSummary="Zone C shows the highest delivery time and cancellation rate, indicating operational pressure."
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={zoneChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="zone" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgDelivery" fill="#ec4899" radius={[4, 4, 0, 0]} name="Avg Delivery (min)" />
            <Bar dataKey="cancelRate" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Cancel Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

import { useMemo } from 'react';
import {
  ShoppingCart,
  DollarSign,
  XCircle,
  Repeat,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Order, KpiMetrics, TrendPoint, DashboardFilters } from '@/types';
import { KpiCard, ChartCard, SectionHeader, FilterBar, EmptyState } from '@/components/ui';
import {
  calculateKpis,
  calculateKpiComparison,
  buildTrendData,
  applyFilters,
} from '@/logic/calculations';

interface OverviewProps {
  orders: Order[];
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function OverviewPage({ orders, filters, onFiltersChange }: OverviewProps) {
  const zones = useMemo(() => [...new Set(orders.map((o) => o.zone))].sort(), [orders]);
  const filteredOrders = useMemo(() => applyFilters(orders, filters), [orders, filters]);
  const comparison = useMemo(() => calculateKpiComparison(filteredOrders), [filteredOrders]);
  const trend = useMemo(() => buildTrendData(filteredOrders), [filteredOrders]);
  const kpis = comparison.current;

  if (filteredOrders.length === 0) {
    return (
      <div>
        <SectionHeader title="Overview Dashboard" description="Business health snapshot." />
        <FilterBar filters={filters} onFiltersChange={onFiltersChange} zones={zones} />
        <EmptyState message="No orders match the current filters. Adjust filters to see data." />
      </div>
    );
  }

  const formatDelta = (delta: number, lowerIsBetter: boolean) => {
    const isGood = lowerIsBetter ? delta < 0 : delta > 0;
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '—';
    const color = isGood ? 'text-emerald-600' : delta === 0 ? 'text-slate-500' : 'text-rose-600';
    const sign = delta > 0 ? '+' : '';
    return { text: `${arrow} ${sign}${delta.toFixed(1)}`, color };
  };

  const orderDelta = formatDelta(comparison.deltas.totalOrders, false);
  const revenueDelta = formatDelta(comparison.deltas.revenue, false);
  const cancelDelta = formatDelta(comparison.deltas.cancellationRate, true);
  const repeatDelta = formatDelta(comparison.deltas.repeatPurchaseRate, false);
  const deliveryDelta = formatDelta(comparison.deltas.averageDeliveryTime, true);
  const onTimeDelta = formatDelta(comparison.deltas.onTimeDeliveryRate, false);

  return (
    <div>
      <SectionHeader
        title="Overview Dashboard"
        description="Executive business health snapshot. KPIs are calculated from the dataset and respond to filters."
      />

      <FilterBar filters={filters} onFiltersChange={onFiltersChange} zones={zones} />

      {/* Business Health Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-pink-400" />
          <h2 className="text-sm font-semibold">Business Health Summary</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Orders and revenue are growing, while cancellation and delivery-delay
          signals are increasing. Root-cause signals suggest operational capacity
          pressure — particularly during peak hours and in specific zones. No
          root cause is proven until validated against operational data.
        </p>
      </div>

      {/* KPI Cards with previous-period comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard
          label="Total Orders"
          value={kpis.totalOrders.toLocaleString()}
          icon={<ShoppingCart className="w-4 h-4" />}
          subtext={`vs prev: ${orderDelta.text}`}
          trend={comparison.deltas.totalOrders > 0 ? 'up' : 'down'}
          tooltip="Total order count including cancelled orders"
        />
        <KpiCard
          label="Revenue"
          value={`$${kpis.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={<DollarSign className="w-4 h-4" />}
          subtext={`vs prev: ${revenueDelta.text}`}
          trend={comparison.deltas.revenue > 0 ? 'up' : 'down'}
          tooltip="Revenue from delivered (non-cancelled) orders"
        />
        <KpiCard
          label="Cancellation Rate"
          value={`${kpis.cancellationRate.toFixed(1)}%`}
          icon={<XCircle className="w-4 h-4" />}
          subtext={`vs prev: ${cancelDelta.text}`}
          trend={comparison.deltas.cancellationRate > 0 ? 'down' : 'up'}
          tooltip="Cancelled orders as percentage of total orders"
        />
        <KpiCard
          label="Repeat Purchase"
          value={`${kpis.repeatPurchaseRate.toFixed(1)}%`}
          icon={<Repeat className="w-4 h-4" />}
          subtext={`vs prev: ${repeatDelta.text}`}
          trend={comparison.deltas.repeatPurchaseRate > 0 ? 'up' : 'down'}
          tooltip="Repeat purchases as percentage of delivered orders"
        />
        <KpiCard
          label="Avg Delivery Time"
          value={`${kpis.averageDeliveryTime.toFixed(1)} min`}
          icon={<Clock className="w-4 h-4" />}
          subtext={`vs prev: ${deliveryDelta.text}`}
          trend={comparison.deltas.averageDeliveryTime > 0 ? 'down' : 'up'}
          tooltip="Average delivery time for non-cancelled orders"
        />
        <KpiCard
          label="On-Time Delivery"
          value={`${kpis.onTimeDeliveryRate.toFixed(1)}%`}
          icon={<CheckCircle className="w-4 h-4" />}
          subtext={`vs prev: ${onTimeDelta.text}`}
          trend={comparison.deltas.onTimeDeliveryRate > 0 ? 'up' : 'down'}
          tooltip="Orders delivered within expected delivery time"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Orders Over Time"
          subtitle="Daily order volume"
          textSummary={`Order volume ranges from ${Math.min(...trend.map((t) => t.orders))} to ${Math.max(...trend.map((t) => t.orders))} orders per day.`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revenue Trend"
          subtitle="Daily revenue from delivered orders"
          textSummary={`Revenue ranges from $${Math.min(...trend.map((t) => t.revenue)).toFixed(0)} to $${Math.max(...trend.map((t) => t.revenue)).toFixed(0)} per day.`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Cancellation Trend"
          subtitle="Daily cancellations"
          textSummary={`Cancellations peak at ${Math.max(...trend.map((t) => t.cancellations))} per day.`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="cancellations" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Repeat Purchase Trend"
          subtitle="Daily repeat purchase count"
          textSummary={`Repeat purchases range from ${Math.min(...trend.map((t) => t.repeatPurchases))} to ${Math.max(...trend.map((t) => t.repeatPurchases))} per day.`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="repeatPurchases" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Delivery Time Trend"
          subtitle="Daily average delivery time (minutes)"
          textSummary={`Average delivery time ranges from ${Math.min(...trend.map((t) => t.deliveryTime)).toFixed(1)} to ${Math.max(...trend.map((t) => t.deliveryTime)).toFixed(1)} minutes.`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="deliveryTime" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Avg Delivery (min)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="On-Time Delivery Trend"
          subtitle="Daily on-time delivery rate (%)"
          textSummary={`On-time rate ranges from ${Math.min(...trend.map((t) => t.onTimeRate)).toFixed(1)}% to ${Math.max(...trend.map((t) => t.onTimeRate)).toFixed(1)}%.`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="onTimeRate" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} name="On-Time (%)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Problem alignment: Growth vs Decline */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">Growing Signals</h3>
          </div>
          <ul className="text-sm text-slate-600 space-y-1.5">
            <li className="flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 text-emerald-500" /> Order volume is increasing across all zones</li>
            <li className="flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 text-emerald-500" /> Revenue from delivered orders is trending upward</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900">Declining Signals</h3>
          </div>
          <ul className="text-sm text-slate-600 space-y-1.5">
            <li className="flex items-center gap-1.5"><ArrowDownRight className="w-3 h-3 text-rose-500" /> Cancellation rate is above healthy threshold</li>
            <li className="flex items-center gap-1.5"><ArrowDownRight className="w-3 h-3 text-rose-500" /> Average delivery time is increasing</li>
            <li className="flex items-center gap-1.5"><ArrowDownRight className="w-3 h-3 text-rose-500" /> Repeat purchase rate is declining</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

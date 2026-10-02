import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import type { Order } from '@/types';
import { SectionHeader, ChartCard, StatusBadge, EmptyState } from '@/components/ui';
import {
  analyzeZones,
  calculatePeakMetrics,
  analyzeRiderCapacity,
  analyzeInventoryAvailability,
} from '@/logic/calculations';

interface OperationsProps {
  orders: Order[];
}

export function OperationsPage({ orders }: OperationsProps) {
  const zones = useMemo(() => analyzeZones(orders), [orders]);
  const peak = useMemo(() => calculatePeakMetrics(orders), [orders]);
  const rider = useMemo(() => analyzeRiderCapacity(orders), [orders]);
  const inventory = useMemo(() => analyzeInventoryAvailability(orders), [orders]);

  const chartData = zones.map((z) => ({
    zone: z.zone.replace('Zone ', 'Z'),
    avgDelivery: Math.round(z.averageDeliveryTime * 10) / 10,
    cancelRate: Math.round(z.cancellationRate * 10) / 10,
    riderUtil: Math.round(z.riderUtilization * 10) / 10,
    invAvail: Math.round(z.inventoryAvailability * 10) / 10,
    onTime: Math.round(z.onTimeDeliveryRate * 10) / 10,
    repeatRate: Math.round(z.repeatPurchaseRate * 10) / 10,
  }));

  const investigationZones = zones.filter((z) => z.status === 'investigate');
  const watchZones = zones.filter((z) => z.status === 'watch');

  if (orders.length === 0) {
    return (
      <div>
        <SectionHeader title="Operations Monitor" description="Zone-level performance metrics." />
        <EmptyState message="No data available. Load data in the Data Center." />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Operations Monitor"
        description="Zone-level performance metrics for delivery, cancellations, rider utilization, inventory, and repeat purchases."
      />

      {/* Zone Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Zone performance metrics including orders, revenue, delivery time, cancellation rate, repeat purchase rate, rider availability, rider utilization, inventory availability, on-time delivery, and status</caption>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-700">Zone</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">Orders</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">Revenue</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">Avg Delivery</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">Cancel Rate</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">Repeat Rate</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">Rider Avail</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">Rider Util</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">Inv Avail</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-slate-700">On-Time</th>
                <th scope="col" className="text-center px-4 py-3 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.zone} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{z.zone}</td>
                  <td className="text-right px-4 py-3 text-slate-600">{z.orders}</td>
                  <td className="text-right px-4 py-3 text-slate-600">${z.revenue.toFixed(0)}</td>
                  <td className="text-right px-4 py-3 text-slate-600">{z.averageDeliveryTime.toFixed(1)} min</td>
                  <td className="text-right px-4 py-3 text-slate-600">{z.cancellationRate.toFixed(1)}%</td>
                  <td className="text-right px-4 py-3 text-slate-600">{z.repeatPurchaseRate.toFixed(1)}%</td>
                  <td className="text-right px-4 py-3 text-slate-600">{z.riderAvailability.toFixed(1)}%</td>
                  <td className="text-right px-4 py-3 text-slate-600">{z.riderUtilization.toFixed(1)}%</td>
                  <td className="text-right px-4 py-3 text-slate-600">{z.inventoryAvailability.toFixed(1)}%</td>
                  <td className="text-right px-4 py-3 text-slate-600">{z.onTimeDeliveryRate.toFixed(1)}%</td>
                  <td className="text-center px-4 py-3"><StatusBadge status={z.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status alerts */}
      {investigationZones.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Needs Investigation</p>
            <p className="text-xs text-rose-700 mt-1">
              {investigationZones.map((z) => z.zone).join(', ')} — elevated delivery times or cancellations detected.
            </p>
          </div>
        </div>
      )}
      {watchZones.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Watch</p>
            <p className="text-xs text-amber-700 mt-1">
              {watchZones.map((z) => z.zone).join(', ')} — early warning signs detected. Monitor closely.
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Delivery Time by Zone" subtitle="Average delivery time (minutes)" textSummary="Zone C has the highest average delivery time.">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="zone" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="avgDelivery" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cancellation Rate by Zone" subtitle="Cancellation percentage" textSummary="Zone C has the highest cancellation rate.">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="zone" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="cancelRate" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Rider Utilization" subtitle="Rider availability percentage by zone" textSummary="Rider availability varies by zone.">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="zone" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="riderUtil" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory Availability" subtitle="Inventory availability percentage by zone" textSummary="Inventory availability is lowest in Zone C.">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="zone" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="invAvail" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Rider & Inventory Analysis */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Rider Capacity Analysis</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Orders with rider:</span><span className="font-medium text-slate-900">{rider.availableOrders}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Orders without rider:</span><span className="font-medium text-slate-900">{rider.unavailableOrders}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Avg delivery with rider:</span><span className="font-medium text-slate-900">{rider.avgDeliveryWhenAvailable.toFixed(1)} min</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Avg delivery without rider:</span><span className="font-medium text-slate-900">{rider.avgDeliveryWhenUnavailable.toFixed(1)} min</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Cancel rate with rider:</span><span className="font-medium text-slate-900">{rider.cancellationRateWhenAvailable.toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Cancel rate without rider:</span><span className="font-medium text-slate-900">{rider.cancellationRateWhenUnavailable.toFixed(1)}%</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Inventory Availability Analysis</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Orders with inventory:</span><span className="font-medium text-slate-900">{inventory.availableOrders}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Orders without inventory:</span><span className="font-medium text-slate-900">{inventory.unavailableOrders}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Avg delivery with inventory:</span><span className="font-medium text-slate-900">{inventory.avgDeliveryWhenAvailable.toFixed(1)} min</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Avg delivery without inventory:</span><span className="font-medium text-slate-900">{inventory.avgDeliveryWhenUnavailable.toFixed(1)} min</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Cancel rate with inventory:</span><span className="font-medium text-slate-900">{inventory.cancellationRateWhenAvailable.toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Cancel rate without inventory:</span><span className="font-medium text-slate-900">{inventory.cancellationRateWhenUnavailable.toFixed(1)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

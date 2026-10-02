import { useState, useMemo } from 'react';
import { SlidersHorizontal, Info, BookOpen } from 'lucide-react';
import type { Order } from '@/types';
import { SectionHeader, EmptyState } from '@/components/ui';
import { calculateModeledImpact, SIMULATOR_MODEL_ASSUMPTIONS } from '@/logic/simulator';
import { calculateKpis } from '@/logic/calculations';

interface SimulatorProps {
  orders: Order[];
}

interface SliderConfig {
  key: 'riderCapacityImprovement' | 'inventoryAvailabilityImprovement' | 'deliveryTimeReduction';
  label: string;
  description: string;
  max: number;
}

const sliderConfigs: SliderConfig[] = [
  { key: 'riderCapacityImprovement', label: 'Rider Capacity Improvement', description: 'Additional riders during peak hours', max: 50 },
  { key: 'inventoryAvailabilityImprovement', label: 'Inventory Availability Improvement', description: 'Better stock replenishment and forecasting', max: 30 },
  { key: 'deliveryTimeReduction', label: 'Delivery Time Reduction', description: 'Route optimization and dispatch efficiency', max: 30 },
];

export function SimulatorPage({ orders }: SimulatorProps) {
  const [inputs, setInputs] = useState({
    riderCapacityImprovement: 0,
    inventoryAvailabilityImprovement: 0,
    deliveryTimeReduction: 0,
  });
  const [showAssumptions, setShowAssumptions] = useState(false);

  const result = useMemo(() => calculateModeledImpact(orders, inputs), [orders, inputs]);
  const currentKpis = useMemo(() => calculateKpis(orders), [orders]);

  if (orders.length === 0) {
    return (
      <div>
        <SectionHeader title="Impact Simulator" description="Model the potential impact of operational improvements." />
        <EmptyState message="No data available. Load data in the Data Center." />
      </div>
    );
  }

  const metrics = [
    { label: 'Cancellation Rate', current: currentKpis.cancellationRate, modeled: result.modeled.cancellationRate, unit: '%', lowerIsBetter: true },
    { label: 'Average Delivery Time', current: currentKpis.averageDeliveryTime, modeled: result.modeled.averageDeliveryTime, unit: ' min', lowerIsBetter: true },
    { label: 'Repeat Purchase Rate', current: currentKpis.repeatPurchaseRate, modeled: result.modeled.repeatPurchaseRate, unit: '%', lowerIsBetter: false },
    { label: 'On-Time Delivery Rate', current: currentKpis.onTimeDeliveryRate, modeled: result.modeled.onTimeDeliveryRate, unit: '%', lowerIsBetter: false },
  ];

  return (
    <div>
      <SectionHeader
        title="Impact Simulator"
        description="Model the potential impact of operational improvements. Adjust sliders to see projected changes."
      />

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Modeled Impact — Not a guaranteed business outcome.</span>{' '}
          These projections are based on simplified modeling assumptions and directional relationships. Actual results will vary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal className="w-4 h-4 text-pink-500" />
            <h2 className="text-sm font-semibold text-slate-900">Improvement Levers</h2>
          </div>
          <div className="space-y-6">
            {sliderConfigs.map((cfg) => (
              <div key={cfg.key}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label htmlFor={cfg.key} className="text-sm font-medium text-slate-700">{cfg.label}</label>
                    <p className="text-xs text-slate-400">{cfg.description}</p>
                  </div>
                  <span className="text-sm font-bold text-pink-600 tabular-nums">{inputs[cfg.key]}%</span>
                </div>
                <input
                  id={cfg.key}
                  type="range"
                  min={0}
                  max={cfg.max}
                  step={5}
                  value={inputs[cfg.key]}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [cfg.key]: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  aria-label={cfg.label}
                  aria-valuemin={0}
                  aria-valuemax={cfg.max}
                  aria-valuenow={inputs[cfg.key]}
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0%</span>
                  <span>{Math.round(cfg.max / 2)}%</span>
                  <span>{cfg.max}%</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setInputs({ riderCapacityImprovement: 0, inventoryAvailabilityImprovement: 0, deliveryTimeReduction: 0 })}
            className="mt-6 w-full py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Reset Sliders
          </button>

          {/* Model assumptions toggle */}
          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 rounded py-1"
            aria-expanded={showAssumptions}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showAssumptions ? 'Hide' : 'Show'} Model Assumptions
          </button>
          {showAssumptions && (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <ul className="space-y-1.5">
                {SIMULATOR_MODEL_ASSUMPTIONS.map((a, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-pink-400 mt-0.5 shrink-0">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {metrics.map((m) => {
            const delta = m.modeled - m.current;
            const isImprovement = m.lowerIsBetter ? delta < 0 : delta > 0;
            const deltaColor = isImprovement ? 'text-emerald-600' : delta === 0 ? 'text-slate-500' : 'text-rose-600';
            const arrow = delta < 0 ? '↓' : delta > 0 ? '↑' : '—';

            return (
              <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">{m.label}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Current</p>
                    <p className="text-xl font-bold text-slate-900">{m.current.toFixed(1)}{m.unit}</p>
                  </div>
                  <div className="text-2xl text-slate-300">→</div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Modeled</p>
                    <p className="text-xl font-bold text-pink-600">{m.modeled.toFixed(1)}{m.unit}</p>
                  </div>
                  <div className={`text-sm font-semibold ${deltaColor}`}>
                    {arrow} {Math.abs(delta).toFixed(1)}{m.unit}
                  </div>
                </div>
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isImprovement ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, Math.abs((delta / Math.max(m.current, 0.01)) * 100) * 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

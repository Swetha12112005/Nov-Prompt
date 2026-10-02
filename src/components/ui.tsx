import type { ReactNode } from 'react';
import type { DashboardFilters } from '@/types';

interface KpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  tooltip?: string;
}

export function KpiCard({ label, value, subtext, trend, icon, tooltip }: KpiCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-600'
      : trend === 'down'
      ? 'text-rose-600'
      : 'text-slate-500';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        {icon && <div className="text-pink-500">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtext && (
        <p className={`text-xs mt-1 ${trendColor}`}>{subtext}</p>
      )}
      {tooltip && (
        <p className="text-[10px] text-slate-400 mt-1 italic">{tooltip}</p>
      )}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  textSummary?: string;
}

export function ChartCard({ title, subtitle, children, textSummary }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
      {textSummary && (
        <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
          <span className="font-medium text-slate-500">Chart summary: </span>
          {textSummary}
        </p>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}

interface BadgeProps {
  status: 'healthy' | 'watch' | 'investigate' | 'high' | 'medium' | 'low';
}

export function StatusBadge({ status }: BadgeProps) {
  const styles: Record<string, string> = {
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    watch: 'bg-amber-50 text-amber-700 border-amber-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    investigate: 'bg-rose-50 text-rose-700 border-rose-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    high: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const labels: Record<string, string> = {
    healthy: 'Healthy',
    low: 'Low',
    watch: 'Watch',
    warning: 'Warning',
    medium: 'Medium',
    investigate: 'Needs Investigation',
    critical: 'Critical',
    high: 'High',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? styles.warning}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

interface FilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  zones: string[];
}

export function FilterBar({ filters, onFiltersChange, zones }: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="zone-filter" className="text-xs font-medium text-slate-600">
          Zone:
        </label>
        <select
          id="zone-filter"
          value={filters.zone}
          onChange={(e) =>
            onFiltersChange({ ...filters, zone: e.target.value as DashboardFilters['zone'] })
          }
          className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <option value="all">All Zones</option>
          {zones.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="period-filter" className="text-xs font-medium text-slate-600">
          Period:
        </label>
        <select
          id="period-filter"
          value={filters.period}
          onChange={(e) =>
            onFiltersChange({ ...filters, period: e.target.value as DashboardFilters['period'] })
          }
          className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <option value="all">All</option>
          <option value="peak">Peak Hours</option>
          <option value="non-peak">Non-Peak</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="date-filter" className="text-xs font-medium text-slate-600">
          Date Range:
        </label>
        <select
          id="date-filter"
          value={filters.dateRange}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateRange: e.target.value as DashboardFilters['dateRange'] })
          }
          className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <option value="all">All Dates</option>
          <option value="first-half">First Half</option>
          <option value="second-half">Second Half</option>
        </select>
      </div>

      <button
        onClick={() =>
          onFiltersChange({ zone: 'all', period: 'all', dateRange: 'all' })
        }
        className="text-xs text-slate-500 hover:text-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 rounded px-2 py-1"
      >
        Reset Filters
      </button>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-2">
      <span className="text-rose-500 text-sm shrink-0 mt-0.5">⚠</span>
      <p className="text-sm text-rose-700">{message}</p>
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
      <div className="inline-block w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

import {
  BarChart3,
  Search,
  Activity,
  Bot,
  SlidersHorizontal,
  Database,
  BookOpen,
} from 'lucide-react';
import type { PageKey } from '@/types';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof BarChart3;
}

const navItems: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'root-cause', label: 'Root Cause', icon: Search },
  { key: 'operations', label: 'Operations', icon: Activity },
  { key: 'ai-advisor', label: 'AI Advisor', icon: Bot },
  { key: 'simulator', label: 'Impact Simulator', icon: SlidersHorizontal },
  { key: 'data-center', label: 'Data Center', icon: Database },
  { key: 'methodology', label: 'Methodology', icon: BookOpen },
];

export const pageTitles: Record<PageKey, string> = {
  overview: 'Overview',
  'root-cause': 'Root Cause Analysis',
  operations: 'Operations Monitor',
  'ai-advisor': 'AI Business Advisor',
  simulator: 'Impact Simulator',
  'data-center': 'Data Center',
  methodology: 'Methodology',
};

interface SidebarProps {
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside
      className="w-60 shrink-0 bg-slate-900 text-white flex flex-col hidden md:flex"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center shrink-0">
          <span className="font-bold text-sm">NC</span>
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-sm leading-tight">NOVA CART</p>
          <p className="text-[10px] text-slate-400 leading-tight">
            AI Business Rescue
          </p>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1" aria-label="Page navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-pink-600/20 text-pink-300 border-r-2 border-pink-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-slate-700">
        <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-400/10 rounded px-2 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Hackathon Demo
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({
  active,
  onNavigate,
}: {
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}) {
  return (
    <div className="md:hidden sticky top-0 z-30 bg-slate-900 text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
          <span className="font-bold text-xs">NC</span>
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">NOVA CART</p>
          <p className="text-[9px] text-slate-400 leading-tight">
            AI Business Rescue
          </p>
        </div>
      </div>
      <div className="flex overflow-x-auto gap-1 px-2 py-2 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-pink-600 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

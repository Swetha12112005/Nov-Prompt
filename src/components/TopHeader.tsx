import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface TopHeaderProps {
  pageTitle: string;
}

export function TopHeader({ pageTitle }: TopHeaderProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-20">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">NOVA CART</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-900">{pageTitle}</span>
      </nav>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
          aria-label="User menu"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm text-slate-700 hidden sm:inline max-w-[160px] truncate">
            {user?.email ?? 'Demo User'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {user?.email ?? 'Demo User'}
              </p>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

import { useState, useCallback, useMemo } from 'react';
import { Sidebar, MobileNav, pageTitles } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { OverviewPage } from '@/pages/OverviewPage';
import { RootCausePage } from '@/pages/RootCausePage';
import { OperationsPage } from '@/pages/OperationsPage';
import { AiAdvisorPage } from '@/pages/AiAdvisorPage';
import { SimulatorPage } from '@/pages/SimulatorPage';
import { DataCenterPage } from '@/pages/DataCenterPage';
import { MethodologyPage } from '@/pages/MethodologyPage';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { LoginPage } from '@/pages/LoginPage';
import { demoOrders } from '@/data/demoData';
import type { Order, PageKey, DashboardFilters } from '@/types';

function AppContent() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<PageKey>('overview');
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [dataSource, setDataSource] = useState('Demo Dataset');
  const [filters, setFilters] = useState<DashboardFilters>({
    zone: 'all',
    period: 'all',
    dateRange: 'all',
  });

  const handleDataLoaded = useCallback(
    (newOrders: Order[], source: string) => {
      if (newOrders.length === 0) {
        setOrders(demoOrders);
        setDataSource('Demo Dataset');
      } else {
        setOrders(newOrders);
        setDataSource(source);
      }
      setActivePage('overview');
    },
    []
  );

  const filteredOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage orders={filteredOrders} filters={filters} onFiltersChange={setFilters} />;
      case 'root-cause':
        return <RootCausePage orders={filteredOrders} />;
      case 'operations':
        return <OperationsPage orders={filteredOrders} />;
      case 'ai-advisor':
        return <AiAdvisorPage orders={filteredOrders} />;
      case 'simulator':
        return <SimulatorPage orders={filteredOrders} />;
      case 'data-center':
        return (
          <DataCenterPage
            orders={orders}
            onDataLoaded={handleDataLoaded}
            dataSource={dataSource}
          />
        );
      case 'methodology':
        return <MethodologyPage />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active={activePage} onNavigate={setActivePage} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader pageTitle={pageTitles[activePage]} />
        <MobileNav active={activePage} onNavigate={setActivePage} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{renderPage()}</div>
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              NOVA CART Business Rescue — AI + Data + Business Reasoning
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Hackathon Demo
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

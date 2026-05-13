import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import Layout from './components/Layout';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '800px', margin: '2rem auto' }}>
          <h2 style={{ color: '#c00', marginBottom: '1rem' }}>Erro na aplicação</h2>
          <pre style={{ background: '#fee', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '13px' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Recarregar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Catalog = lazy(() => import('./pages/Catalog'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const SellMyVehicle = lazy(() => import('./pages/SellMyVehicle'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminVehicles = lazy(() => import('./pages/AdminVehicles'));
const AdminVehicleEditor = lazy(() => import('./pages/AdminVehicleEditor'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminSellLeads = lazy(() => import('./pages/AdminSellLeads'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();
  const location = useLocation();

  // Páginas públicas não precisam esperar a verificação de auth — só bloqueia /admin
  if (isLoadingAuth && location.pathname.startsWith('/admin')) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/admin/login" element={
        <Suspense fallback={<PageLoader />}>
          <AdminLogin />
        </Suspense>
      } />

      <Route element={<Layout />}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><Catalog /></Suspense>} />
        <Route path="/veiculo/:id" element={<Suspense fallback={<PageLoader />}><VehicleDetail /></Suspense>} />
        <Route path="/vender" element={<Suspense fallback={<PageLoader />}><SellMyVehicle /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
        <Route path="/admin/veiculos" element={<Suspense fallback={<PageLoader />}><AdminVehicles /></Suspense>} />
        <Route path="/admin/propostas" element={<Suspense fallback={<PageLoader />}><AdminSellLeads /></Suspense>} />
        <Route path="/admin/configuracoes" element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
        <Route path="/admin/veiculo/:id" element={<Suspense fallback={<PageLoader />}><AdminVehicleEditor /></Suspense>} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
            <SonnerToaster position="top-center" richColors />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

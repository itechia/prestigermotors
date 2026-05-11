import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import Layout from './components/Layout';
import Catalog from './pages/Catalog';
import VehicleDetail from './pages/VehicleDetail';
import SellMyVehicle from './pages/SellMyVehicle';
import AdminDashboard from './pages/AdminDashboard';
import AdminVehicles from './pages/AdminVehicles';
import AdminVehicleEditor from './pages/AdminVehicleEditor';
import AdminSettings from './pages/AdminSettings';
import AdminSellLeads from './pages/AdminSellLeads';
import AdminLogin from './pages/AdminLogin';

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
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Catalog />} />
        <Route path="/veiculo/:id" element={<VehicleDetail />} />
        <Route path="/vender" element={<SellMyVehicle />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/veiculos" element={<AdminVehicles />} />
        <Route path="/admin/propostas" element={<AdminSellLeads />} />
        <Route path="/admin/configuracoes" element={<AdminSettings />} />
        <Route path="/admin/veiculo/:id" element={<AdminVehicleEditor />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
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
  );
}

export default App;

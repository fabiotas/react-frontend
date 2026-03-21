import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import AdminUsers from './pages/AdminUsers';
import AdminAreas from './pages/AdminAreas';
import Profile from './pages/Profile';
import Areas from './pages/Areas';
import Bookings from './pages/Bookings';
import AreaDetails from './pages/AreaDetails';
import SpecialPrices from './pages/SpecialPrices';
import ExternalBooking from './pages/ExternalBooking';

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const approvalStatus = user?.approvalStatus ?? 'approved';
  const canUseApp = isAuthenticated && approvalStatus === 'approved';

  useEffect(() => {
    const path = location.pathname;
    const exactTitleMap: Record<string, string> = {
      '/': 'AreaHub',
      '/login': 'AreaHub - Entrar',
      '/register': 'AreaHub - Criar Conta',
      '/dashboard': 'AreaHub - Dashboard',
      '/areas': 'AreaHub - Áreas',
      '/bookings': 'AreaHub - Reservas',
      '/external-booking': 'AreaHub - Reserva Externa',
      '/special-prices': 'AreaHub - Preços Especiais',
      '/users': 'AreaHub - Usuários',
      '/admin/users': 'AreaHub - Aprovação de Usuários',
      '/admin/areas': 'AreaHub - Aprovação de Áreas',
      '/profile': 'AreaHub - Meu Perfil',
    };

    // `AreaDetails` já define o título dinâmico com o nome da área.
    if (path.startsWith('/areas/')) return;

    document.title = exactTitleMap[path] || 'AreaHub';
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/areas/:id" element={<AreaDetails />} />
      <Route
        path="/login"
        element={canUseApp ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={canUseApp ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/special-prices" element={<SpecialPrices />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/external-booking" element={<ExternalBooking />} />
          <Route path="/users" element={<Users />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/areas" element={<AdminAreas />} />
          </Route>
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;



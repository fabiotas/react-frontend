import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  User, 
  LogOut,
  Menu,
  X,
  Leaf,
  Home,
  Calendar,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/areas', icon: Home, label: 'Minhas Áreas' },
    { to: '/bookings', icon: Calendar, label: 'Reservas' },
    ...(user?.role === 'admin' ? [{ to: '/users', icon: Users, label: 'Usuários' }] : []),
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 glass border-r border-neutral-200">
          <div className="flex items-center h-16 px-6 border-b border-neutral-200">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-200">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-neutral-800">AreaHub</span>
            </Link>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-800 border border-primary-200 shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                user?.role === 'admin' 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-700 ring-2 ring-purple-200' 
                  : 'bg-gradient-to-br from-primary-500 to-primary-700'
              }`}>
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-neutral-800 truncate">{user?.name}</p>
                  {user?.role === 'admin' && (
                    <Shield className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    <Shield className="w-3 h-3" />
                    Administrador
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-neutral-200">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-neutral-800">AreaHub</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-neutral-600" />
            ) : (
              <Menu className="w-6 h-6 text-neutral-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="px-4 py-4 border-t border-neutral-200 bg-white animate-slide-up">
            {/* User Info - Mobile */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                user?.role === 'admin' 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-700 ring-2 ring-purple-200' 
                  : 'bg-gradient-to-br from-primary-500 to-primary-700'
              }`}>
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-neutral-800 truncate">{user?.name}</p>
                  {user?.role === 'admin' && (
                    <Shield className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    <Shield className="w-3 h-3" />
                    Administrador
                  </span>
                )}
              </div>
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-800'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors duration-200 mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <div className="min-h-screen pt-16 md:pt-0 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

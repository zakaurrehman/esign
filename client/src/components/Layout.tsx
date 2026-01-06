import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Layout: React.FC = () => {
  const { user, isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
      <nav className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-white tracking-tight">
                E-Sign
              </Link>
              <div className="ml-10 flex items-center space-x-3">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                    location.pathname === '/'
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/create"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all no-underline shadow-md ${
                    location.pathname === '/create'
                      ? 'bg-white text-indigo-700'
                      : 'bg-white/90 text-indigo-600 hover:bg-white'
                  }`}
                >
                  + Create Document
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                      location.pathname === '/admin'
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    User Management
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

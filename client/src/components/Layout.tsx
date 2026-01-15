import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Layout: React.FC = () => {
  const { user, isAdmin, isManager, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (isAdmin) return { text: 'Admin', class: 'bg-purple-500' };
    if (isManager) return { text: 'Manager', class: 'bg-green-500' };
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar */}
      <aside className="w-64 h-screen fixed top-0 left-0 bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-800 text-white flex flex-col py-8 px-4 shadow-2xl z-30 select-none">
        <div className="flex items-center mb-10 px-2">
          <Link to="/" className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <span className="mr-1 text-3xl">📝</span> <span className="drop-shadow">E-Sign</span>
          </Link>
        </div>
        <nav className="flex-1">
          <ul className="space-y-1">
            <li>
              <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/' ? 'bg-white/20 text-white font-bold shadow' : 'hover:bg-white/10 text-white/90'}`}>
                <span className="text-xl">🏠</span> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/create" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/create' ? 'bg-white/20 text-white font-bold shadow' : 'hover:bg-white/10 text-white/90'}`}>
                <span className="text-xl">➕</span> Create Document
              </Link>
            </li>
            {isManager && (
              <li>
                <Link to="/manager/team" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/manager/team' ? 'bg-white/20 text-white font-bold shadow' : 'hover:bg-white/10 text-white/90'}`}>
                  <span className="text-xl">👥</span> Team Documents
                </Link>
              </li>
            )}
            {isAdmin && (
              <>
                <li>
                  <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/admin' ? 'bg-white/20 text-white font-bold shadow' : 'hover:bg-white/10 text-white/90'}`}>
                    <span className="text-xl">👤</span> User Management
                  </Link>
                </li>
                <li>
                  <Link to="/admin/documents" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/admin/documents' ? 'bg-white/20 text-white font-bold shadow' : 'hover:bg-white/10 text-white/90'}`}>
                    <span className="text-xl">📄</span> View All Documents
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col items-center pt-8">
          <span className="text-sm font-medium mb-2 text-white/90">{user?.name}</span>
          {roleBadge && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold mb-2 bg-white/20 text-white shadow`}>{roleBadge.text}</span>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all mt-2"
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        {/* Header */}
        <header className="h-20 bg-blue-700 shadow-lg flex items-center px-8 justify-between border-b-2 border-blue-800/20">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-extrabold text-white drop-shadow">E-Sign Platform</span>
            <span className="text-base text-blue-100 font-medium">Professional e-signature solution</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-base font-semibold text-white">{user?.name}</span>
            {roleBadge && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-blue-700 text-white shadow`}>{roleBadge.text}</span>
            )}
          </div>
        </header>
        <main className="flex-1 px-2 sm:px-4 md:px-8 py-8 bg-white min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

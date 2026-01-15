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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-700 via-violet-700 to-purple-700 text-white flex flex-col py-8 px-4 shadow-2xl rounded-r-3xl">
        <div className="flex items-center mb-10">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-white">
            <span className="mr-2">📝</span> E-Sign
          </Link>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/90'}`}>Dashboard</Link>
            </li>
            <li>
              <Link to="/create" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/create' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/90'}`}>+ Create Document</Link>
            </li>
            {isManager && (
              <li>
                <Link to="/manager/team" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/manager/team' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/90'}`}>Team Documents</Link>
              </li>
            )}
            {isAdmin && (
              <>
                <li>
                  <Link to="/admin" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/admin' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/90'}`}>User Management</Link>
                </li>
                <li>
                  <Link to="/admin/documents" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/admin/documents' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/90'}`}>View All Documents</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col items-center">
          <span className="text-sm font-medium mb-2">{user?.name}</span>
          {roleBadge && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold mb-2 ${roleBadge.class}`}>{roleBadge.text}</span>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/30 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-20 bg-white shadow-lg flex items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-indigo-700">E-Sign Platform</span>
            <span className="text-sm text-slate-500">Professional e-signature solution</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-base font-semibold text-indigo-700">{user?.name}</span>
            {roleBadge && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleBadge.class}`}>{roleBadge.text}</span>
            )}
          </div>
        </header>
        <main className="flex-1 px-8 py-8 bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

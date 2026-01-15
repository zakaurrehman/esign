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
      <aside className="min-h-screen h-screen fixed inset-0 left-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white flex flex-col py-6 px-0 shadow-2xl z-30 select-none" style={{ width: '260px' }}>
        <div className="flex flex-col items-center mb-8 px-6">
          <Link to="/" className="w-full flex items-center gap-3 mb-2">
            <span className="text-3xl">📝</span>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-white drop-shadow">E-Sign</div>
              <div className="text-xs text-white/70 font-medium -mt-1">Professional e-signature</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            <li>
              <Link to="/" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold transition-all ${location.pathname === '/' ? 'bg-white/10 text-yellow-300 font-bold shadow' : 'hover:bg-white/5 text-white/90'}`}>
                <span className="text-xl">🏠</span> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/create" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold transition-all ${location.pathname === '/create' ? 'bg-white/10 text-pink-200 font-bold shadow' : 'hover:bg-white/5 text-white/90'}`}>
                <span className="text-xl">➕</span> Create Document
              </Link>
            </li>
            {isManager && (
              <li>
                <Link to="/manager/team" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold transition-all ${location.pathname === '/manager/team' ? 'bg-white/10 text-green-200 font-bold shadow' : 'hover:bg-white/5 text-white/90'}`}>
                  <span className="text-xl">👥</span> Team Documents
                </Link>
              </li>
            )}
            {isAdmin && (
              <>
                <li>
                  <Link to="/admin" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold transition-all ${location.pathname === '/admin' ? 'bg-white/10 text-blue-200 font-bold shadow' : 'hover:bg-white/5 text-white/90'}`}>
                    <span className="text-xl">👤</span> User Management
                  </Link>
                </li>
                <li>
                  <Link to="/admin/documents" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold transition-all ${location.pathname === '/admin/documents' ? 'bg-white/10 text-purple-200 font-bold shadow' : 'hover:bg-white/5 text-white/90'}`}>
                    <span className="text-xl">📄</span> View All Documents
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div className="border-t border-white/20 my-6"></div>
        </nav>
        <div className="flex flex-col items-center px-6 pb-2 mt-auto">
          <div className="flex items-center gap-3 w-full mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white font-bold text-lg">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white/90">{user?.name}</div>
              {roleBadge && (
                <span className="text-xs font-bold text-white/60">{roleBadge.text}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '260px' }}>
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

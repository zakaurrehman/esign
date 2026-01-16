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
      <aside className="min-h-screen h-screen fixed inset-0 left-0 text-white flex flex-col py-6 px-0 shadow-lg z-30 select-none bg-slate-900" style={{ width: '260px' }}>
        <div className="flex flex-col items-center mb-8 px-6">
          <Link to="/" className="w-full flex items-center gap-3 mb-2">
            <span className="text-3xl">📝</span>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-white drop-shadow">E-Sign</div>
              <div className="text-xs text-white/70 font-medium -mt-1">Professional e-signature</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          <ul className="space-y-0.5 list-none">
            <li>
              <Link to="/" className={`flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${location.pathname === '/' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/create" className={`flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${location.pathname === '/create' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Document
              </Link>
            </li>
            {isManager && (
              <li>
                <Link to="/manager/team" className={`flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${location.pathname === '/manager/team' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
                  Team Documents
                </Link>
              </li>
            )}
            {isAdmin && (
              <>
                <li>
                  <Link to="/admin" className={`flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${location.pathname === '/admin' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    User Management
                  </Link>
                </li>
                <li>
                  <Link to="/admin/documents" className={`flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${location.pathname === '/admin/documents' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    All Documents
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div className="border-t border-slate-700 my-6 mx-2"></div>
        </nav>
        <div className="flex flex-col px-3 pb-2 mt-auto">
          <div className="flex items-center gap-3 w-full mb-3 bg-slate-800 rounded-md p-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-sm">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
              {roleBadge && (
                <span className="text-xs text-slate-400">{roleBadge.text}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-600 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '260px' }}>
        {/* Header */}
        <header className="h-16 shadow-sm flex items-center px-8 justify-between border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">E-Sign Platform</span>
            <span className="text-sm text-slate-500 font-medium">Professional e-signature solution</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">{user?.name}</span>
            {roleBadge && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{roleBadge.text}</span>
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

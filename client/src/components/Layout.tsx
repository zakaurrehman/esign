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
      <aside className="w-64 min-h-screen bg-blue-50 text-[#22223b] flex flex-col py-8 px-4 shadow-2xl rounded-r-3xl border-r-2 border-blue-100">
        <div className="flex items-center mb-10">
              <Link to="/" className="text-2xl font-extrabold tracking-tight text-blue-700">
            <span className="mr-2">📝</span> E-Sign
          </Link>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-blue-50 text-[#22223b]'}`}>Dashboard</Link>
            </li>
            <li>
              <Link to="/create" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/create' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-blue-50 text-[#22223b]'}`}>+ Create Document</Link>
            </li>
            {isManager && (
              <li>
                <Link to="/manager/team" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/manager/team' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-blue-50 text-[#22223b]'}`}>Team Documents</Link>
              </li>
            )}
            {isAdmin && (
              <>
                <li>
                  <Link to="/admin" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/admin' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-blue-50 text-[#22223b]'}`}>User Management</Link>
                </li>
                <li>
                  <Link to="/admin/documents" className={`block px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/admin/documents' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-blue-50 text-[#22223b]'}`}>View All Documents</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col items-center">
          <span className="text-sm font-medium mb-2 text-[#22223b]">{user?.name}</span>
          {roleBadge && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold mb-2 bg-blue-700 text-white`}>{roleBadge.text}</span>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-200 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
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

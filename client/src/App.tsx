import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateDocument } from './pages/CreateDocument';
import { PrepareDocument } from './pages/PrepareDocument';
import { ViewDocument } from './pages/ViewDocument';
import { SignDocument } from './pages/SignDocument';
import { SignComplete, SignDeclined } from './pages/SignComplete';
import { AdminPanel } from './pages/AdminPanel';
import AllDocuments from './pages/AllDocuments';
import TemplateManagement from './pages/TemplateManagement';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public auth routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Public signing routes */}
        <Route path="/sign/:documentId/:token" element={<SignDocument />} />
        <Route path="/sign/complete" element={<SignComplete />} />
        <Route path="/sign/declined" element={<SignDeclined />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreateDocument />} />
          <Route path="prepare/:id" element={<PrepareDocument />} />
          <Route path="document/:id" element={<ViewDocument />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="admin/documents" element={<AllDocuments />} />
          <Route path="admin/template" element={<TemplateManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

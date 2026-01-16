import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Top branding section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-white">E-Sign</div>
              <div className="text-xs text-slate-400">Professional e-signature</div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <Card size="md" variant="default" className="w-full shadow-2xl">
          <CardHeader className="text-center py-8 border-b border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-600 text-sm mt-2">Sign in to your account to continue</p>
          </CardHeader>
          <CardContent className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-base"
                isLoading={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
              </div>

              <p className="text-center text-sm text-slate-600">
                <span>Don't have an account? </span>
                <span className="font-semibold text-blue-600">Contact your administrator</span>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="mt-8 text-center text-slate-400 text-xs">
          <p>© 2026 E-Sign Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

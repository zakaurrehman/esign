import { create } from 'zustand';
import type { User } from '../types/index';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isManager: false,

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    set({ 
      user, 
      token, 
      isAuthenticated: true, 
      isAdmin: user.role === 'SUPER_ADMIN',
      isManager: user.role === 'MANAGER'
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false, isManager: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, isAdmin: false, isManager: false });
      return;
    }

    try {
      const response = await authApi.me();
      const user = response.data.user;
      set({ 
        user, 
        isAuthenticated: true, 
        isAdmin: user.role === 'SUPER_ADMIN', 
        isManager: user.role === 'MANAGER',
        isLoading: false 
      });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isAdmin: false, isManager: false, isLoading: false });
    }
  }
}));

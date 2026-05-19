import { create } from 'zustand';
import { authApi } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      const { accessToken, refreshToken, user } = data.data;
      if (user.role !== 'ADMIN') {
        set({ isLoading: false, error: 'Access denied. Admin credentials required.' });
        return;
      }
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Invalid credentials', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const { data } = await authApi.me();
      const user = data.data.user;
      if (user.role !== 'ADMIN') {
        localStorage.clear();
        set({ user: null, isAuthenticated: false });
        return;
      }
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));

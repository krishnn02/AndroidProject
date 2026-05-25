import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  college?: string;
  role: 'ADMIN' | 'USER';
  avatarColor?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
}

const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await SecureStore.getItemAsync(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login(email, password);
          const { user, tokens } = data.data;

          await SecureStore.setItemAsync('accessToken', tokens.accessToken);
          await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {}
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      loadUser: async () => {
        try {
          const token = await SecureStore.getItemAsync('accessToken');
          if (!token) {
            // No token at all — check if refresh token exists
            const refresh = await SecureStore.getItemAsync('refreshToken');
            if (!refresh) {
              set({ user: null, isAuthenticated: false, isLoading: false });
              return;
            }
          }

          set({ isLoading: true });
          const { data } = await authApi.getProfile();
          set({ user: data.data.user, isAuthenticated: true, isLoading: false });
        } catch {
          // Don't delete tokens here — the interceptor may still be refreshing.
          // Only clear in-memory auth state. If the interceptor already cleared
          // tokens (refresh truly failed), this just resets UI state.
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
      updateUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

import { setUnauthorizedCallback } from '../services/api';
setUnauthorizedCallback(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

import { create } from 'zustand';
import { api, ApiError } from '../lib/api';
import { useRepoStore } from './useRepoStore';
import { setUnauthorizedHandler } from '../lib/authEvents';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  sessionExpired: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  setUnauthorizedHandler(() => {
    set({ user: null, sessionExpired: true });
  });

  return {
    user: null,
    isLoading: true,
    sessionExpired: false,

    checkAuth: async () => {
      set({ isLoading: true });
      try {
        const user = await api.getMe();
        set({ user, sessionExpired: false });
        useRepoStore.getState().fetchRepos();
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) {
          console.error('Auth check failed', e);
        }
        set({ user: null });
      } finally {
        set({ isLoading: false });
      }
    },

    logout: async () => {
      try {
        await api.logout();
        set({ user: null, sessionExpired: false });
      } catch (e) {
        console.error('Logout request failed', e);
      } finally {
        set({ user: null, sessionExpired: false });
      }
    },

    deleteAccount: async () => {
      await api.deleteAccount();
      set({ user: null, sessionExpired: false });
    },
  };
});

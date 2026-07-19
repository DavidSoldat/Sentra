import { create } from 'zustand';
import { Repo } from '../types';
import { api } from '../lib/api';

const POLL_MS = 2000;

interface RepoState {
  repo: Repo | null;
  repos: Repo[];
  isLoadingRepos: boolean;
  error: string | null;
  isSubmitting: boolean;
  _pollId: ReturnType<typeof setInterval> | null;

  fetchRepos: () => Promise<void>;
  submit: (url: string) => Promise<Repo>;
  selectById: (id: number) => Promise<void>;
  select: (repo: Repo) => void;
  reset: () => void;
  _stopPolling: () => void;
  _startPolling: (id: number) => void;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repo: null,
  repos: [],
  isLoadingRepos: true,
  error: null,
  isSubmitting: false,
  _pollId: null,

  _stopPolling: () => {
    const { _pollId } = get();
    if (_pollId) {
      clearInterval(_pollId);
      set({ _pollId: null });
    }
  },

  _startPolling: (id) => {
    get()._stopPolling();
    const pollId = setInterval(async () => {
      try {
        const data = await api.getRepo(id);
        set({ repo: data });
        if (data.status === 'READY' || data.status === 'FAILED') {
          get()._stopPolling();
          set((state) => ({
            repos: state.repos.map((r) => (r.id === data.id ? data : r)),
          }));
        }
      } catch {}
    }, POLL_MS);
    set({ _pollId: pollId });
  },

  fetchRepos: async () => {
    set({ isLoadingRepos: true });
    try {
      const repos = await api.listRepos();
      set({ repos });
    } catch (e) {
      console.error('Failed to load repo list', e);
    } finally {
      set({ isLoadingRepos: false });
    }
  },

  selectById: async (id) => {
    get()._stopPolling();
    set({ error: null });

    const cached = get().repos.find((r) => r.id === id);
    if (cached) {
      set({ repo: cached });
      if (cached.status !== 'READY' && cached.status !== 'FAILED') {
        get()._startPolling(cached.id);
      }
      return;
    }

    try {
      const data = await api.getRepo(id);
      set((state) => {
        const exists = state.repos.some((r) => r.id === data.id);
        return {
          repo: data,
          repos: exists ? state.repos : [data, ...state.repos],
        };
      });
      if (data.status !== 'READY' && data.status !== 'FAILED') {
        get()._startPolling(data.id);
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Repo not found' });
    }
  },

  submit: async (url) => {
    set({ error: null, isSubmitting: true });
    try {
      const data = await api.submitRepo(url);
      set((state) => {
        const exists = state.repos.some((r) => r.id === data.id);
        return {
          repo: data,
          repos: exists
            ? state.repos.map((r) => (r.id === data.id ? data : r))
            : [data, ...state.repos],
        };
      });
      if (data.status !== 'READY') get()._startPolling(data.id);
      return data;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to submit repo' });
      throw e;
    } finally {
      set({ isSubmitting: false });
    }
  },

  select: (selected) => {
    get()._stopPolling();
    set({ error: null, repo: selected });
    if (selected.status !== 'READY' && selected.status !== 'FAILED') {
      get()._startPolling(selected.id);
    }
  },

  reset: () => {
    get()._stopPolling();
    set({ repo: null, error: null });
  },
}));

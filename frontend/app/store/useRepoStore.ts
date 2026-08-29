import { create } from 'zustand';
import { Repo } from '../types';
import { api } from '../lib/api';

const SSE_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface RepoState {
  repo: Repo | null;
  repos: Repo[];
  isLoadingRepos: boolean;
  error: string | null;
  isSubmitting: boolean;
  _eventSource: EventSource | null;
  indexingProgress: { filesProcessed: number; totalFiles: number } | null;

  fetchRepos: () => Promise<void>;
  submit: (url: string) => Promise<Repo>;
  selectById: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  rename: (id: number, name: string) => Promise<void>;
  select: (repo: Repo) => void;
  reset: () => void;
  _stopStream: () => void;
  _startStream: (id: number) => void;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repo: null,
  repos: [],
  isLoadingRepos: true,
  error: null,
  isSubmitting: false,
  _eventSource: null,
  indexingProgress: null,

  _stopStream: () => {
    const { _eventSource } = get();
    if (_eventSource) {
      _eventSource.close();
      set({ _eventSource: null });
    }
  },

  _startStream: (id) => {
    get()._stopStream();
    set({ indexingProgress: null });

    const es = new EventSource(
      `${SSE_BASE_URL}/api/repos/${id}/status-stream`,
      {
        withCredentials: true,
      },
    );

    es.addEventListener('status', (event) => {
      const data: Repo = JSON.parse(event.data);
      set({ repo: data });

      if (data.status === 'READY' || data.status === 'FAILED') {
        set((state) => ({
          repos: state.repos.map((r) => (r.id === data.id ? data : r)),
          indexingProgress: null,
        }));
        get()._stopStream();
      }
    });

    es.addEventListener('progress', (event) => {
      const data: { filesProcessed: number; totalFiles: number } = JSON.parse(
        event.data,
      );
      set({ indexingProgress: data });
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        get()._stopStream();
      }
    };

    set({ _eventSource: es });
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
    get()._stopStream();
    set({ error: null });

    const cached = get().repos.find((r) => r.id === id);
    if (cached) {
      set({ repo: cached });
      if (cached.status !== 'READY' && cached.status !== 'FAILED') {
        get()._startStream(cached.id);
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
        get()._startStream(data.id);
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Repo not found' });
    }
  },

  remove: async (id) => {
    await api.deleteRepo(id);
    set((state) => ({
      repos: state.repos.filter((r) => r.id !== id),
      repo: state.repo?.id === id ? null : state.repo,
    }));
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

      if (data.status !== 'READY') {
        get()._startStream(data.id);
      }

      return data;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to submit repo' });
      throw e;
    } finally {
      set({ isSubmitting: false });
    }
  },

  select: (selected) => {
    get()._stopStream();
    set({ error: null, repo: selected });
    if (selected.status !== 'READY' && selected.status !== 'FAILED') {
      get()._startStream(selected.id);
    }
  },
  rename: async (id, name) => {
    const data = await api.renameRepo(id, name);
    set((state) => ({
      repos: state.repos.map((r) => (r.id === id ? data : r)),
      repo: state.repo?.id === id ? data : state.repo,
    }));
  },

  reset: () => {
    get()._stopStream();
    set({ repo: null, error: null });
  },
}));

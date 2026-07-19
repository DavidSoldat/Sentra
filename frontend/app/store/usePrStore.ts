import { create } from 'zustand';
import { api } from '../lib/api';
import { PullRequestSummary } from '../types/review';

interface PrState {
  byRepoId: Record<number, PullRequestSummary[]>;
  isLoading: boolean;
  error: string | null;
  load: (repoId: number) => Promise<void>;
  refetch: (repoId: number) => Promise<void>;
}

async function fetchAndStore(
  repoId: number,
  set: (partial: Partial<PrState> | ((s: PrState) => Partial<PrState>)) => void,
) {
  set({ isLoading: true, error: null });
  try {
    const data = await api.getPullRequests(repoId);
    set((state) => ({ byRepoId: { ...state.byRepoId, [repoId]: data } }));
  } catch (e) {
    set({
      error: e instanceof Error ? e.message : 'Failed to load pull requests',
    });
  } finally {
    set({ isLoading: false });
  }
}

export const usePrStore = create<PrState>((set, get) => ({
  byRepoId: {},
  isLoading: false,
  error: null,

  load: async (repoId) => {
    if (get().byRepoId[repoId]) return;
    await fetchAndStore(repoId, set);
  },

  refetch: async (repoId) => {
    await fetchAndStore(repoId, set);
  },
}));

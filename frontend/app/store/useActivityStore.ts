import { create } from 'zustand';
import { api } from '../lib/api';
import { ActivityItem } from '../types/review';

interface ActivityState {
  items: ActivityItem[];
  lastViewedAt: string | null;
  isLoading: boolean;
  fetch: () => Promise<void>;
  markSeen: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  items: [],
  lastViewedAt: null,
  isLoading: false,

  fetch: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const feed = await api.getActivity();
      set({ items: feed.items, lastViewedAt: feed.lastViewedAt });
    } catch {
    } finally {
      set({ isLoading: false });
    }
  },

  markSeen: async () => {
    set({ lastViewedAt: new Date().toISOString() });
    try {
      await api.markActivitySeen();
    } catch {}
  },
}));

export function selectHasUnseen(state: ActivityState): boolean {
  const lastViewed = state.lastViewedAt
    ? new Date(state.lastViewedAt).getTime()
    : 0;
  return state.items.some(
    (item) =>
      !!item.completedAt && new Date(item.completedAt).getTime() > lastViewed,
  );
}

import { create } from 'zustand';
import { Message } from '../types';
import { api } from '../lib/api';
import { useRepoStore } from './useRepoStore';

interface ChatState {
  messages: Message[];
  isAsking: boolean;
  isLoadingHistory: boolean;
  _loadedRepoId: number | null;

  loadHistory: (repoId: number) => Promise<void>;
  ask: (question: string) => Promise<void>;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isAsking: false,
  isLoadingHistory: false,
  _loadedRepoId: null,

  loadHistory: async (repoId) => {
    if (get()._loadedRepoId === repoId) return;
    set({ messages: [], isLoadingHistory: true, _loadedRepoId: repoId });
    try {
      const history = await api.getQuestions(repoId);
      if (useRepoStore.getState().repo?.id !== repoId) return; 
      const historyMessages: Message[] = history.flatMap((h) => [
        {
          id: `${h.id}-q`,
          role: 'user' as const,
          content: h.question,
          timestamp: new Date(h.createdAt),
        },
        {
          id: `${h.id}-a`,
          role: 'assistant' as const,
          content: h.answer,
          timestamp: new Date(h.createdAt),
        },
      ]);
      set({ messages: historyMessages });
    } catch (e) {
      console.error('Failed to load chat history', e);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  ask: async (question) => {
    const repoId = useRepoStore.getState().repo?.id ?? null;
    if (!repoId || !question.trim() || get().isAsking) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, userMsg],
      isAsking: true,
    }));

    try {
      const data = await api.ask(repoId, question.trim());
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };
      set((state) => ({ messages: [...state.messages, assistantMsg] }));
    } catch (e) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          e instanceof Error
            ? `Error: ${e.message}`
            : 'Something went wrong. Check the backend logs.',
        timestamp: new Date(),
      };
      set((state) => ({ messages: [...state.messages, errMsg] }));
    } finally {
      set({ isAsking: false });
    }
  },

  clear: () => set({ messages: [], _loadedRepoId: null }),
}));

import { create } from 'zustand';
import { Message } from '../types';
import { api, isQuotaExceeded } from '../lib/api';
import { useRepoStore } from './useRepoStore';

interface QuotaExceededBody {
  error: 'quota_exceeded';
  resourceType: 'questions' | 'reviews';
  limit: number;
  resetsAt: string;
}

interface ChatState {
  messages: Message[];
  isAsking: boolean;
  isLoadingHistory: boolean;
  quotaError: QuotaExceededBody | null;
  askError: string | null;
  _loadedRepoId: number | null;

  loadHistory: (repoId: number) => Promise<void>;
  ask: (question: string) => Promise<void>;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isAsking: false,
  isLoadingHistory: false,
  quotaError: null,
  askError: null,
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
      quotaError: null,
      askError: null,
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
      if (isQuotaExceeded(e)) {
        set((state) => ({
          // roll back the optimistic user message — it never got answered
          messages: state.messages.filter((m) => m.id !== userMsg.id),
          quotaError: e.body,
        }));
      } else {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== userMsg.id),
          askError:
            e instanceof Error
              ? e.message
              : 'Something went wrong. Check the backend logs.',
        }));
      }
    } finally {
      set({ isAsking: false });
    }
  },

  clear: () =>
    set({
      messages: [],
      quotaError: null,
      askError: null,
      _loadedRepoId: null,
    }),
}));

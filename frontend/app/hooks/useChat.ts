'use client';

import { useState, useCallback } from 'react';
import { Message } from '../types';
import { api } from '../lib/api';

export function useChat(repoId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const ask = useCallback(
    async (question: string) => {
      if (!repoId || !question.trim() || isAsking) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsAsking(true);

      try {
        const data = await api.ask(repoId, question.trim());
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
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
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsAsking(false);
      }
    },
    [repoId, isAsking],
  );

  const clear = useCallback(() => setMessages([]), []);

  return { messages, isAsking, ask, clear };
}

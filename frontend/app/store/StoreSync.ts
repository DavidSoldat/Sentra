'use client';

import { useEffect } from 'react';
import { useAuthStore } from './useAuthStore';
import { useRepoStore } from './useRepoStore';
import { useChatStore } from './useChatStore';

export function StoreSync() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const repoId = useRepoStore((s) => s.repo?.id ?? null);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const clearChat = useChatStore((s) => s.clear);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (repoId != null) {
      loadHistory(repoId);
    } else {
      clearChat();
    }
  }, [repoId, loadHistory, clearChat]);

  return null;
}

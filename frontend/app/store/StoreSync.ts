'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useRepoStore } from '../store/useRepoStore';
import { useChatStore } from '../store/useChatStore';
import { useBillingStore } from '../store/useBillingStore';

export function StoreSync() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const repoId = useRepoStore((s) => s.repo?.id ?? null);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const clearChat = useChatStore((s) => s.clear);
  const initPaddle = useBillingStore((s) => s.initPaddle);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    initPaddle();
  }, [initPaddle]);

  useEffect(() => {
    if (repoId != null) {
      loadHistory(repoId);
    } else {
      clearChat();
    }
  }, [repoId, loadHistory, clearChat]);

  return null;
}

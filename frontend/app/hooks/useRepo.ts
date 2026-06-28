'use client';

import { useState, useRef, useCallback } from 'react';
import { Repo } from '../types';
import { api } from '../lib/api';

const POLL_MS = 2000;

export function useRepo() {
  const [repo, setRepo] = useState<Repo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: number) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const data = await api.getRepo(id);
          setRepo(data);
          if (data.status === 'READY' || data.status === 'FAILED') {
            stopPolling();
          }
        } catch {}
      }, POLL_MS);
    },
    [stopPolling],
  );

  const submit = useCallback(
    async (url: string) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const data = await api.submitRepo(url);
        setRepo(data);
        if (data.status !== 'READY') startPolling(data.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit repo');
      } finally {
        setIsSubmitting(false);
      }
    },
    [startPolling],
  );

  const reset = useCallback(() => {
    stopPolling();
    setRepo(null);
    setError(null);
  }, [stopPolling]);

  return { repo, error, isSubmitting, submit, reset };
}

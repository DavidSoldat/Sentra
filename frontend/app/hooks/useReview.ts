import { useCallback, useEffect, useRef, useState } from 'react';
import { ReviewResponse } from '../types/review';
import { getReview, ApiError, submitReview } from '../lib/api';

const POLL_INTERVAL_MS = 2000;

interface UseReviewResult {
  review: ReviewResponse | null;
  error: string | null;
  isSubmitting: boolean;
  start: (prUrl: string) => Promise<void>;
  reset: () => void;
}

export function useReview(repoId: number | null): UseReviewResult {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setReview(null);
    setError(null);
  }, [stopPolling]);

  const [lastRepoId, setLastRepoId] = useState(repoId);
  if (repoId !== lastRepoId) {
    setLastRepoId(repoId);
    setReview(null);
    setError(null);
  }

  useEffect(() => {
    stopPolling();
  }, [repoId, stopPolling]);

  const poll = useCallback(
    (id: number) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await getReview(id);
          setReview(res);
          if (res.status === 'COMPLETED' || res.status === 'FAILED') {
            stopPolling();
          }
        } catch (err) {
          console.error('Review poll failed', err);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  const start = useCallback(
    async (prUrl: string) => {
      if (repoId == null) {
        setError('No repo selected.');
        return;
      }
      setError(null);
      setIsSubmitting(true);
      try {
        const created = await submitReview({ repoId, prUrl });
        setReview(created);
        if (created.status !== 'COMPLETED' && created.status !== 'FAILED') {
          poll(created.id);
        }
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Couldn't start the review. Check the backend is running.";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [repoId, poll],
  );

  useEffect(() => stopPolling, [stopPolling]);

  return { review, error, isSubmitting, start, reset };
}

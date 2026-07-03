import { useCallback, useEffect, useRef, useState } from 'react';
import { ReviewResponse } from '../types/review';
import { getReview, ReviewApiError, submitReview } from '../lib/api';

const POLL_INTERVAL_MS = 2000;

interface UseReviewResult {
  review: ReviewResponse | null;
  error: string | null;
  isSubmitting: boolean;
  start: (repoId: number, prUrl: string) => Promise<void>;
  reset: () => void;
}

export function useReview(): UseReviewResult {
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
    async (repoId: number, prUrl: string) => {
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
          err instanceof ReviewApiError
            ? err.message
            : "Couldn't start the review. Check the backend is running.";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [poll],
  );

  const reset = useCallback(() => {
    stopPolling();
    setReview(null);
    setError(null);
  }, [stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  return { review, error, isSubmitting, start, reset };
}

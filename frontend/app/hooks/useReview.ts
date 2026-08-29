import { useCallback, useEffect, useRef, useState } from 'react';
import { AgentResult, ReviewResponse } from '../types/review';
import { ApiError, getReview, isQuotaExceeded, submitReview } from '../lib/api';

interface QuotaExceededBody {
  error: 'quota_exceeded';
  resourceType: 'questions' | 'reviews';
  limit: number;
  resetsAt: string;
}

interface ReviewStatusEvent {
  status: string;
  completedAt: string | null;
}

const SSE_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface UseReviewResult {
  review: ReviewResponse | null;
  error: string | null;
  quotaError: QuotaExceededBody | null;
  isSubmitting: boolean;
  start: (prUrl: string) => Promise<ReviewResponse | null>;
  loadReview: (reviewId: number) => Promise<void>;
  reset: () => void;
  resumeStream: (reviewId: number) => void;
}

export function useReview(repoId: number | null): UseReviewResult {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<QuotaExceededBody | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const stopStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setReview(null);
    setError(null);
    setQuotaError(null);
  }, [stopStream]);

  const [lastRepoId, setLastRepoId] = useState(repoId);
  if (repoId !== lastRepoId) {
    setLastRepoId(repoId);
    setReview(null);
    setError(null);
    setQuotaError(null);
  }

  useEffect(() => {
    stopStream();
  }, [repoId, stopStream]);

  const startStream = useCallback(
    (reviewId: number) => {
      stopStream();

      const es = new EventSource(
        `${SSE_BASE_URL}/api/reviews/${reviewId}/stream`,
        { withCredentials: true },
      );

      es.addEventListener('agent', (event) => {
        const updated: AgentResult = JSON.parse(event.data);
        setReview((prev) => {
          if (!prev) return prev;
          const exists = prev.agents.some((a) => a.agent === updated.agent);
          return {
            ...prev,
            agents: exists
              ? prev.agents.map((a) =>
                  a.agent === updated.agent ? updated : a,
                )
              : [...prev.agents, updated],
          };
        });
      });

      es.addEventListener('review', (event) => {
        const statusUpdate: ReviewStatusEvent = JSON.parse(event.data);
        setReview((prev) =>
          prev
            ? {
                ...prev,
                status: statusUpdate.status as ReviewResponse['status'],
                completedAt: statusUpdate.completedAt,
              }
            : prev,
        );

        if (
          statusUpdate.status === 'COMPLETED' ||
          statusUpdate.status === 'FAILED'
        ) {
          stopStream();
        }
      });

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          stopStream();
        }
      };

      esRef.current = es;
    },
    [stopStream],
  );

  const start = useCallback(
    async (prUrl: string): Promise<ReviewResponse | null> => {
      if (repoId == null) {
        setError('No repo selected.');
        return null;
      }
      setError(null);
      setQuotaError(null);
      setIsSubmitting(true);
      try {
        const created = await submitReview({ repoId, prUrl });
        setReview(created);
        if (created.status !== 'COMPLETED' && created.status !== 'FAILED') {
          startStream(created.id);
        }
        return created;
      } catch (err) {
        if (isQuotaExceeded(err)) {
          setQuotaError(err.body);
        } else {
          const message =
            err instanceof ApiError
              ? err.message
              : "Couldn't start the review. Check the backend is running.";
          setError(message);
        }
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [repoId, startStream],
  );

  const loadReview = useCallback(
    async (reviewId: number) => {
      setError(null);
      setQuotaError(null);
      try {
        const data = await getReview(reviewId);
        setReview(data);
        if (data.status !== 'COMPLETED' && data.status !== 'FAILED') {
          startStream(reviewId);
        }
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Couldn't load that review.",
        );
      }
    },
    [startStream],
  );

  const resumeStream = useCallback(
    (reviewId: number) => {
      startStream(reviewId);
    },
    [startStream],
  );

  useEffect(() => stopStream, [stopStream]);

  return {
    review,
    error,
    quotaError,
    isSubmitting,
    start,
    loadReview,
    reset,
    resumeStream,
  };
}

import { useEffect } from 'react';
import { usePrStore } from '../store/usePrStore';

export function usePullRequests(repoId: number | null) {
  const byRepoId = usePrStore((s) => s.byRepoId);
  const isLoading = usePrStore((s) => s.isLoading);
  const error = usePrStore((s) => s.error);
  const load = usePrStore((s) => s.load);
  const refetchStore = usePrStore((s) => s.refetch);

  useEffect(() => {
    if (repoId != null) load(repoId);
  }, [repoId, load]);

  return {
    pullRequests: repoId != null ? (byRepoId[repoId] ?? []) : [],
    isLoading,
    error,
    refetch: () => {
      if (repoId != null) refetchStore(repoId);
    },
  };
}

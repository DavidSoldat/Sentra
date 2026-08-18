'use client';

import { usePullRequests } from '../../hooks/usePullRequests';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ReviewSummary } from '@/app/types/review';
import { api } from '@/app/lib/api';

interface PrPickerProps {
  repoId: number;
  isSubmitting: boolean;
  onSelect: (prUrl: string) => void;
  onSelectReview: (reviewId: number) => void;
}

type Filter = 'open' | 'closed';

export function PrPicker({
  repoId,
  isSubmitting,
  onSelect,
  onSelectReview,
}: PrPickerProps) {
  const { pullRequests, isLoading, error, refetch } = usePullRequests(repoId);
  const [history, setHistory] = useState<ReviewSummary[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const prStateParam = searchParams.get('prState');
  const filter: Filter = prStateParam === 'closed' ? 'closed' : 'open';

  function setFilter(next: Filter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'open') {
      params.delete('prState');
    } else {
      params.set('prState', next);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`);
  }

  useEffect(() => {
    api
      .getRepoReviews(repoId)
      .then(setHistory)
      .catch(() => {});
  }, [repoId]);

  const filtered = useMemo(
    () => pullRequests.filter((pr) => pr.state === filter),
    [pullRequests, filter],
  );

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-2'>
        {(['open', 'closed'] as const).map((f) => (
          <button
            key={f}
            type='button'
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 font-mono text-xs capitalize transition-colors ${
              filter === f
                ? 'bg-[#316DCA] text-white'
                : 'bg-[#0D1117] text-[#6E7681] border border-[#30363D] hover:text-[#CDD9E5]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className='font-mono text-sm text-[#6E7681]'>
          Loading pull requests…
        </p>
      )}

      {error && (
        <div className='flex items-center justify-between gap-3 rounded-md border border-[#F85149]/40 bg-[#3D1418] px-4 py-3'>
          <p className='font-mono text-sm text-[#F85149]'>{error}</p>
          <button
            type='button'
            onClick={refetch}
            className='shrink-0 font-mono text-xs text-[#F85149] underline hover:no-underline'
          >
            retry
          </button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <p className='font-mono text-sm text-[#6E7681]'>
          No {filter} pull requests found.
        </p>
      )}

      {!isLoading && filtered.length > 0 && (
        <ul className='flex flex-col gap-1.5 max-h-80 overflow-y-auto'>
          {filtered.map((pr) => (
            <li key={pr.number}>
              <button
                type='button'
                disabled={isSubmitting}
                onClick={() => onSelect(pr.htmlUrl)}
                className='w-full flex items-center gap-2 rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-left transition-colors hover:border-[#316DCA] disabled:cursor-not-allowed disabled:opacity-50'
              >
                <span className='font-mono text-xs text-[#6E7681] shrink-0'>
                  # {pr.number}
                </span>
                <span className='font-mono text-sm text-[#CDD9E5] truncate'>
                  {pr.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {history.length > 0 && (
        <div className='flex flex-col gap-1.5 pt-2 mt-1 border-t border-[#21262D]'>
          <p className='font-mono text-[11px] uppercase tracking-widest text-[#484F57] pt-1'>
            Past reviews
          </p>
          <ul className='flex flex-col gap-1.5 max-h-80 overflow-y-auto'>
            {history.map((r) => (
              <li key={r.id}>
                <button
                  type='button'
                  className='w-full flx items-center gap-2 rounded-md border border-[#30363D bg-[#0D1117] px-3 py-2 text-left transition-colors hover:border-[#316DCA] '
                  onClick={() => onSelectReview(r.id)}
                >
                  <span className='font-mono text-xs text-[#6E7681] shrink-0'>
                    # {r.prNumber}
                  </span>
                  <span className='font-mono text-sm text-[#CDD9E5] truncate'>
                    {r.prTitle ?? r.prUrl}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

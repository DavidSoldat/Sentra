'use client';

import { useMemo, useState } from 'react';
import { usePullRequests } from '../../hooks/usePullRequests';

interface PrPickerProps {
  repoId: number;
  isSubmitting: boolean;
  onSelect: (prUrl: string) => void;
}

type Filter = 'open' | 'closed';

export function PrPicker({ repoId, isSubmitting, onSelect }: PrPickerProps) {
  const { pullRequests, isLoading, error, refetch } = usePullRequests(repoId);
  const [filter, setFilter] = useState<Filter>('open');

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
                  #{pr.number}
                </span>
                <span className='font-mono text-sm text-[#CDD9E5] truncate'>
                  {pr.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/app/lib/api';
import { GitHubRepoPickerItem } from '@/app/types';

export function GithubRepoPicker({
  onPick,
  disabled,
}: {
  onPick: (htmlUrl: string) => void;
  disabled: boolean;
}) {
  const [repos, setRepos] = useState<GitHubRepoPickerItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .listGithubRepos()
      .then((data) => {
        if (!cancelled) setRepos(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load your GitHub repos.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = (repos ?? []).filter((r) =>
    r.fullName.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className='flex flex-col gap-2 px-3 pb-3'>
      {repos === null && !error && (
        <p className='font-mono text-xs text-[#484f58]'>Loading your repos…</p>
      )}

      {error && <p className='font-mono text-[11px] text-[#f85149]'>{error}</p>}

      {repos !== null && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search your repos…'
            className='w-full rounded-md border border-[#2d333b] bg-[#0d1117] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] placeholder:text-[#484f58] outline-none focus:border-[#316dca]'
          />

          <div className='max-h-56 overflow-y-auto flex flex-col gap-0.5'>
            {filtered.length === 0 && (
              <p className='px-1 py-1 font-mono text-xs text-[#484f58]'>
                No matching repos.
              </p>
            )}

            {filtered.map((r) => (
              <button
                key={r.fullName}
                type='button'
                disabled={disabled || r.alreadyAdded}
                onClick={() => onPick(r.htmlUrl)}
                className='flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left font-mono text-xs text-[#cdd9e5] hover:bg-[#161b22] disabled:cursor-not-allowed disabled:opacity-40'
              >
                <span className='truncate'>{r.fullName}</span>
                <span className='flex items-center gap-1.5 shrink-0'>
                  {r.isPrivate && (
                    <span className='text-[10px] text-[#6e7681]'>private</span>
                  )}
                  {r.alreadyAdded && (
                    <span className='rounded-full border border-[#316dca]/40 bg-[#316dca]/10 px-1.5 py-0.5 text-[10px] text-[#316dca]'>
                      added
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { SyntheticEvent, useState } from 'react';
import { useRepoStore } from '../../store/useRepoStore';
import { Repo } from '../../types';
import { GithubRepoPicker } from '../repo/GithubRepoPicker';


export function AddRepoForm({ onDone }: { onDone: (repo: Repo) => void }) {
  const [mode, setMode] = useState<'picker' | 'url'>('picker');
  const [url, setUrl] = useState('');
  const submit = useRepoStore((s) => s.submit);
  const isSubmitting = useRepoStore((s) => s.isSubmitting);
  const error = useRepoStore((s) => s.error);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim()) return;
    const repo = await submit(url.trim());
    setUrl('');
    onDone(repo);
  }

  async function handlePick(htmlUrl: string) {
    const repo = await submit(htmlUrl);
    onDone(repo);
  }

  return (
    <div className='flex flex-col gap-2 pb-3'>
      <div className='flex gap-1 px-3'>
        <button
          type='button'
          onClick={() => setMode('picker')}
          className={`flex-1 rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
            mode === 'picker'
              ? 'bg-[#21262d] text-[#cdd9e5]'
              : 'text-[#6e7681] hover:text-[#cdd9e5]'
          }`}
        >
          Your repos
        </button>
        <button
          type='button'
          onClick={() => setMode('url')}
          className={`flex-1 rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
            mode === 'url'
              ? 'bg-[#21262d] text-[#cdd9e5]'
              : 'text-[#6e7681] hover:text-[#cdd9e5]'
          }`}
        >
          Paste URL
        </button>
      </div>

      {mode === 'picker' ? (
        <GithubRepoPicker onPick={handlePick} disabled={isSubmitting} />
      ) : (
        <form onSubmit={handleSubmit} className='flex flex-col gap-2 px-3'>
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='github.com/owner/repo'
            disabled={isSubmitting}
            className='w-full rounded-md border border-[#2d333b] bg-[#0d1117] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] placeholder:text-[#484f58] outline-none focus:border-[#316dca] disabled:opacity-50'
          />
          {error && (
            <p className='font-mono text-[11px] text-[#f85149]'>{error}</p>
          )}
          <button
            type='submit'
            disabled={isSubmitting || !url.trim()}
            className='rounded-md bg-[#316dca] px-3 py-1.5 font-mono text-xs text-white hover:bg-[#2b5faf] disabled:cursor-not-allowed disabled:bg-[#21262d] disabled:text-[#6e7681]'
          >
            {isSubmitting ? 'Indexing…' : 'Index repo'}
          </button>
        </form>
      )}
    </div>
  );
}

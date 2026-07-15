'use client';

import { useState } from 'react';
import { useRepoStore } from '../../store/useRepoStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Repo, RepoStatus } from '../../types';

const STATUS_DOT: Record<RepoStatus, string> = {
  PENDING: 'bg-[#768390] animate-pulse',
  INDEXING: 'bg-[#d29922] animate-pulse',
  READY: 'bg-[#3fb950]',
  FAILED: 'bg-[#f85149]',
};

function AddRepoForm({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState('');
  const submit = useRepoStore((s) => s.submit);
  const isSubmitting = useRepoStore((s) => s.isSubmitting);
  const error = useRepoStore((s) => s.error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    await submit(url.trim());
    setUrl('');
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2 px-3 pb-3'>
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder='github.com/owner/repo'
        disabled={isSubmitting}
        className='w-full rounded-md border border-[#2d333b] bg-[#0d1117] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] placeholder:text-[#484f58] outline-none focus:border-[#316dca] disabled:opacity-50'
      />
      {error && <p className='font-mono text-[11px] text-[#f85149]'>{error}</p>}
      <button
        type='submit'
        disabled={isSubmitting || !url.trim()}
        className='rounded-md bg-[#316dca] px-3 py-1.5 font-mono text-xs text-white hover:bg-[#2b5faf] disabled:cursor-not-allowed disabled:bg-[#21262d] disabled:text-[#6e7681]'
      >
        {isSubmitting ? 'Indexing…' : 'Index repo'}
      </button>
    </form>
  );
}

export function Sidebar() {
  const repos = useRepoStore((s) => s.repos);
  const isLoadingRepos = useRepoStore((s) => s.isLoadingRepos);
  const activeRepo = useRepoStore((s) => s.repo);
  const reset = useRepoStore((s) => s.reset);
  const select = useRepoStore((s) => s.select);
  const clear = useChatStore((s) => s.clear);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      reset();
      clear();
    } catch {}
  }

  return (
    <aside className='w-64 shrink-0 border-r border-[#2d333b] bg-[#0d1117] flex flex-col'>
      <div className='flex items-center justify-between px-3 py-3'>
        <span className='font-mono text-xs uppercase tracking-widest text-[#484f58]'>
          Repos
        </span>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className='font-mono text-xs text-[#316dca] hover:underline'
        >
          {showAddForm ? 'cancel' : '+ new'}
        </button>
      </div>

      {showAddForm && <AddRepoForm onDone={() => setShowAddForm(false)} />}

      <div className='flex-1 overflow-y-auto px-2 pb-3'>
        {isLoadingRepos && (
          <p className='px-2 font-mono text-xs text-[#484f58]'>Loading…</p>
        )}

        {!isLoadingRepos && repos.length === 0 && (
          <p className='px-2 font-mono text-xs text-[#484f58]'>
            No repos indexed yet.
          </p>
        )}

        <ul className='flex flex-col gap-0.5'>
          {repos.map((r: Repo) => {
            const isActive = activeRepo?.id === r.id;
            return (
              <li key={r.id}>
                <button
                  onClick={() => select(r)}
                  className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-[#161b22] text-[#e6edf3]'
                      : 'text-[#768390] hover:bg-[#161b22] hover:text-[#cdd9e5]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[r.status]}`}
                  />
                  <span className='font-mono text-xs truncate'>{r.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {user && (
        <div className='mt-auto border-t border-[#2d333b] bg-[#1c1011]/60 px-3 py-3'>
          <button
            onClick={handleLogout}
            className='w-full rounded-md border border-[#f85149]/20 bg-[#f85149]/10 px-3 py-2 font-mono text-xs font-medium text-[#f85149] transition-colors hover:bg-[#f85149]/20 hover:text-[#ff7b72]'
          >
            logout
          </button>
        </div>
      )}
    </aside>
  );
}

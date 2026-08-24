'use client';

import { useUIStore } from '@/app/store/useUiStore';
import { useParams, useRouter } from 'next/navigation';
import { SyntheticEvent, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useRepoStore } from '../../store/useRepoStore';
import { Repo } from '../../types';
import { RepoRow } from './RepoRow';

function AddRepoForm({ onDone }: { onDone: (repo: Repo) => void }) {
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
  const router = useRouter();
  const params = useParams<{ repoId: string }>();
  const activeRepoId = Number(params.repoId);

  const repos = useRepoStore((s) => s.repos);
  const isLoadingRepos = useRepoStore((s) => s.isLoadingRepos);
  const reset = useRepoStore((s) => s.reset);
  const clear = useChatStore((s) => s.clear);
  const remove = useRepoStore((s) => s.remove);
  const rename = useRepoStore((s) => s.rename);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [showAddForm, setShowAddForm] = useState(false);

  const isOpen = useUIStore((s) => s.sidebarOpen);
  const close = useUIStore((s) => s.closeSidebar);

  async function handleLogout() {
    try {
      await logout();
      reset();
      clear();
    } catch {}
  }
  async function handleRename(id: number, name: string) {
    await rename(id, name);
  }

  function handleRepoCreated(repo: Repo) {
    setShowAddForm(false);
    close();
    router.push(`/repos/${repo.id}`);
  }

  async function handleDelete(id: number) {
    const wasActive = activeRepoId === id;
    await remove(id);
    if (wasActive) {
      const remaining = repos.filter((r) => r.id !== id);
      router.replace(remaining.length > 0 ? `/repos/${remaining[0].id}` : '/');
    }
  }

  return (
    <>
      {isOpen && (
        <div
          onClick={close}
          aria-hidden='true'
          className='fixed inset-0 z-30 bg-black/60 md:hidden'
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-[#2d333b] bg-[#0d1117] flex flex-col transition-transform duration-200 ease-out
          md:static md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
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

        {showAddForm && <AddRepoForm onDone={handleRepoCreated} />}

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
            {repos.map((r: Repo) => (
              <li key={r.id}>
                <RepoRow
                  repo={r}
                  isActive={activeRepoId === r.id}
                  onSelect={() => router.push(`/repos/${r.id}`)}
                  onDelete={() => handleDelete(r.id)}
                  onRename={(name) => handleRename(r.id, name)}
                />
              </li>
            ))}
          </ul>
        </div>

        {user && (
          <div className='mt-auto border-t border-[#2d333b] bg-[#1c1011]/60 px-3 py-3 flex flex-col gap-2'>
            <button
              onClick={() => router.push('/settings')}
              className='w-full rounded-md border border-[#2d333b] px-3 py-2 font-mono text-xs text-[#cdd9e5] transition-colors hover:bg-[#161b22]'
            >
              Settings
            </button>

            <button
              onClick={handleLogout}
              className='w-full rounded-md border border-[#f85149]/20 bg-[#f85149]/10 px-3 py-2 font-mono text-xs font-medium text-[#f85149] transition-colors hover:bg-[#f85149]/20 hover:text-[#ff7b72]'
            >
              logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

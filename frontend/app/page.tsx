'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRepoStore } from './store/useRepoStore';
import { useActivityStore } from './store/useActivityStore';
import { RepoInput } from './components/repo/RepoIntpu';
import { SEVERITY_STYLES } from './lib/helpers';

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Home() {
  const router = useRouter();
  const repos = useRepoStore((s) => s.repos);
  const isLoadingRepos = useRepoStore((s) => s.isLoadingRepos);
  const submit = useRepoStore((s) => s.submit);
  const isSubmitting = useRepoStore((s) => s.isSubmitting);
  const error = useRepoStore((s) => s.error);

  const items = useActivityStore((s) => s.items);
  const lastViewedAt = useActivityStore((s) => s.lastViewedAt);
  const fetchActivity = useActivityStore((s) => s.fetch);
  const markSeen = useActivityStore((s) => s.markSeen);

  useEffect(() => {
    if (repos.length > 0) fetchActivity();
  }, [repos.length, fetchActivity]);

  useEffect(() => {
    if (items.length > 0) markSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  async function handleSubmit(url: string) {
    const repo = await submit(url);
    router.push(`/repos/${repo.id}`);
  }

  if (isLoadingRepos) return null;

  if (repos.length === 0) {
    return (
      <div className='h-full min-h-0 bg-[#080c10] text-[#cdd9e5] flex flex-col overflow-hidden'>
        <main className='flex-1 min-h-0 flex flex-col w-full mx-auto px-6 py-8 gap-6 max-w-3xl'>
          <h1 className='font-mono text-2xl font-medium text-[#cdd9e5] leading-snug'>
            Ask anything about
            <br />
            <span className='text-[#316dca]'>any codebase.</span>
          </h1>
          <p className='font-mono text-sm text-[#768390]'>
            Point Sentra at a GitHub repo. Ask questions, get answers with cited
            source files.
          </p>
          <RepoInput
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            error={error}
          />
        </main>
      </div>
    );
  }

  const lastViewed = lastViewedAt ? new Date(lastViewedAt).getTime() : 0;

  return (
    <div className='h-full min-h-0 bg-[#080c10] text-[#cdd9e5] flex flex-col overflow-hidden'>
      <main className='flex-1 min-h-0 overflow-y-auto w-full mx-auto px-6 py-8 max-w-3xl flex flex-col gap-4'>
        <h1 className='font-mono text-lg text-[#cdd9e5]'>Recent activity</h1>

        {items.length === 0 && (
          <p className='font-mono text-sm text-[#6e7681]'>
            No reviews yet. Open a repo and submit a pull request to review.
          </p>
        )}

        <ul className='flex flex-col gap-2'>
          {items.map((item) => {
            const isUnseen =
              !!item.completedAt &&
              new Date(item.completedAt).getTime() > lastViewed;

            return (
              <li key={item.reviewId}>
                <Link
                  href={`/repos/${item.repoId}/reviews/${item.reviewId}`}
                  className='flex items-center justify-between gap-3 rounded-md border border-[#21262d] bg-[#0d1117] px-4 py-3 hover:border-[#316dca]/50 transition-colors'
                >
                  <div className='flex items-center gap-2 min-w-0'>
                    {isUnseen && (
                      <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-[#316dca]' />
                    )}
                    <div className='min-w-0'>
                      <p className='font-mono text-xs text-[#6e7681] truncate'>
                        {item.repoName}
                      </p>
                      <p className='font-mono text-sm text-[#cdd9e5] truncate'>
                        {item.prTitle ?? item.prUrl}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 shrink-0'>
                    {item.severity && (
                      <span
                        className={`font-mono text-[10px] uppercase tracking-widest rounded-full border px-2 py-0.5 ${SEVERITY_STYLES[item.severity] ?? ''}`}
                      >
                        {item.severity}
                      </span>
                    )}
                    {item.status === 'FAILED' && (
                      <span className='font-mono text-[10px] uppercase tracking-widest rounded-full border border-[#f85149]/30 bg-[#f85149]/10 text-[#f85149] px-2 py-0.5'>
                        failed
                      </span>
                    )}
                    <span className='font-mono text-[11px] text-[#484f58]'>
                      {item.completedAt
                        ? timeAgo(item.completedAt)
                        : timeAgo(item.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

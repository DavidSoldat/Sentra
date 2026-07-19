'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRepoStore } from './store/useRepoStore';
import { RepoInput } from './components/repo/RepoIntpu';

export default function Home() {
  const router = useRouter();
  const repos = useRepoStore((s) => s.repos);
  const isLoadingRepos = useRepoStore((s) => s.isLoadingRepos);
  const submit = useRepoStore((s) => s.submit);
  const isSubmitting = useRepoStore((s) => s.isSubmitting);
  const error = useRepoStore((s) => s.error);

  useEffect(() => {
    if (!isLoadingRepos && repos.length > 0) {
      router.replace(`/repos/${repos[0].id}`);
    }
  }, [isLoadingRepos, repos, router]);

  async function handleSubmit(url: string) {
    const repo = await submit(url);
    router.push(`/repos/${repo.id}`);
  }

  if (isLoadingRepos || repos.length > 0) return null;

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

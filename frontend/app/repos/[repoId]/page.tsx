'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { RepoInput } from '../../components/repo/RepoIntpu';
import { ReviewPanel } from '../../components/review/ReviewPanel';
import { Tabs } from '../../components/ui/Tabs';
import { useReview } from '../../hooks/useReview';
import { useChatStore } from '../../store/useChatStore';
import { useRepoStore } from '../../store/useRepoStore';

export default function RepoPage() {
  const params = useParams<{ repoId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = Number(params.repoId);

  const repo = useRepoStore((s) => s.repo);
  const error = useRepoStore((s) => s.error);
  const isSubmitting = useRepoStore((s) => s.isSubmitting);
  const submit = useRepoStore((s) => s.submit);
  const selectById = useRepoStore((s) => s.selectById);
  const indexingProgress = useRepoStore((s) => s.indexingProgress);
  const quotaError = useChatStore((s) => s.quotaError);
  const askError = useChatStore((s) => s.askError);

  useEffect(() => {
    if (!Number.isNaN(repoId)) selectById(repoId);

    return () => {
      useRepoStore.getState()._stopStream();
    };
  }, [repoId, selectById]);

  const messages = useChatStore((s) => s.messages);
  const isAsking = useChatStore((s) => s.isAsking);
  const ask = useChatStore((s) => s.ask);

  const {
    review,
    error: reviewError,
    quotaError: reviewQuotaError,
    isSubmitting: isReviewSubmitting,
    start: startReview,
    loadReview,
  } = useReview(repo?.id ?? null);

  const tabParam = searchParams.get('tab');
  const activeTab: 'chat' | 'review' =
    tabParam === 'review' ? 'review' : 'chat';

  function setActiveTab(tab: 'chat' | 'review') {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === 'chat') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    const query = next.toString();
    router.replace(`/repos/${repoId}${query ? `?${query}` : ''}`);
  }

  const isReady = repo?.status === 'READY';

  async function handleSubmit(url: string) {
    const newRepo = await submit(url);
    router.push(`/repos/${newRepo.id}`);
  }

  return (
    <div className='h-full min-h-0 bg-[#080c10] text-[#cdd9e5] flex flex-col overflow-hidden'>
      <main
        className={`flex-1 min-h-0 flex flex-col w-full mx-auto px-6 py-8 gap-6 transition-[max-width] duration-200 overflow-hidden ${
          isReady && activeTab === 'review' ? 'max-w-6xl' : 'max-w-3xl'
        }`}
      >
        {!isReady && (
          <div className='flex flex-col gap-3'>
            <RepoInput
              onSubmit={handleSubmit}
              isLoading={
                isSubmitting ||
                repo?.status === 'INDEXING' ||
                repo?.status === 'PENDING'
              }
              error={error}
            />

            {repo && !isReady && repo.status !== 'FAILED' && (
              <div className='font-mono text-xs text-[#768390] pl-1 flex items-center gap-2'>
                <span className='w-1.5 h-1.5 rounded-full bg-[#d29922] animate-pulse inline-block' />
                {repo.status === 'PENDING'
                  ? 'Queued for indexing…'
                  : indexingProgress
                    ? `Indexing — ${indexingProgress.filesProcessed} / ${indexingProgress.totalFiles} files`
                    : 'Reading files and building index — this takes a minute for large repos'}
              </div>
            )}

            {repo?.status === 'FAILED' && (
              <div className='font-mono text-xs text-[#f85149] bg-[#1c1011] border border-[#6e2b2b] rounded-md px-4 py-3'>
                Indexing failed. Check the Spring Boot logs, then try again.
              </div>
            )}
          </div>
        )}

        {isReady && repo && (
          <div className='flex-1 min-h-0 flex flex-col gap-4'>
            <Tabs active={activeTab} onChange={setActiveTab} />
            {activeTab === 'chat' && (
              <div className='flex-1 min-h-0 flex flex-col'>
                <ChatPanel
                  messages={messages}
                  isAsking={isAsking}
                  repoName={repo.name}
                  onAsk={ask}
                  quotaError={quotaError}
                  askError={askError}
                />
              </div>
            )}
            {activeTab === 'review' && (
              <div className='flex-1 min-h-0 flex flex-col overflow-y-auto'>
                <ReviewPanel
                  repoId={repo.id}
                  review={review}
                  error={reviewError}
                  quotaError={reviewQuotaError}
                  isSubmitting={isReviewSubmitting}
                  onSubmit={startReview}
                  onSelectReview={loadReview}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

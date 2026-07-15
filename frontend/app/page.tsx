'use client';

import { useState } from 'react';
import { ChatPanel } from './components/chat/ChatPanel';
import { RepoInput } from './components/repo/RepoIntpu';
import { ReviewPanel } from './components/review/ReviewPanel';
import { Tabs } from './components/ui/Tabs';
import { useReview } from './hooks/useReview';
import { useRepoStore } from './store/useRepoStore';
import { useChatStore } from './store/useChatStore';

export default function Home() {
  const repo = useRepoStore((s) => s.repo);
  const error = useRepoStore((s) => s.error);
  const isSubmitting = useRepoStore((s) => s.isSubmitting);
  const submit = useRepoStore((s) => s.submit);

  const messages = useChatStore((s) => s.messages);
  const isAsking = useChatStore((s) => s.isAsking);
  const ask = useChatStore((s) => s.ask);

  const {
    review,
    error: reviewError,
    isSubmitting: isReviewSubmitting,
    start: startReview,
  } = useReview(repo?.id ?? null);
  const [activeTab, setActiveTab] = useState<'chat' | 'review'>('chat');
  const [tabRepoId, setTabRepoId] = useState<number | null>(repo?.id ?? null);
  if ((repo?.id ?? null) !== tabRepoId) {
    setTabRepoId(repo?.id ?? null);
    setActiveTab('chat');
  }

  const isReady = repo?.status === 'READY';

  return (
    <div className='h-full min-h-0 bg-[#080c10] text-[#cdd9e5] flex flex-col overflow-hidden'>
      <main
        className={`flex-1 min-h-0 flex flex-col w-full mx-auto px-6 py-8 gap-6 transition-[max-width] duration-200 overflow-hidden ${
          isReady && activeTab === 'review' ? 'max-w-6xl' : 'max-w-3xl'
        }`}
      >
        {!isReady && (
          <div className='flex flex-col gap-3'>
            {!repo && (
              <>
                <h1 className='font-mono text-2xl font-medium text-[#cdd9e5] leading-snug'>
                  Ask anything about
                  <br />
                  <span className='text-[#316dca]'>any codebase.</span>
                </h1>
                <p className='font-mono text-sm text-[#768390]'>
                  Point Sentra at a GitHub repo. Ask questions, get answers with
                  cited source files.
                </p>
              </>
            )}

            <RepoInput
              onSubmit={submit}
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
                />
              </div>
            )}

            {activeTab === 'review' && (
              <ReviewPanel
                review={review}
                error={reviewError}
                isSubmitting={isReviewSubmitting}
                onSubmit={startReview}
              />
            )}
          </div>
        )}
      </main>
      <footer className='border-t border-[#2d333b] px-6 py-4 text-xs text-[#768390] flex items-center justify-center'>
        <div className='hover:text-[#316dca] transition-colors cursor-pointer'>
          <a
            href='https://github.com/DavidSoldat'
            target='_blank'
            rel='noopener noreferrer'
          >
            Made with ❤️ by David
          </a>
        </div>
      </footer>
    </div>
  );
}

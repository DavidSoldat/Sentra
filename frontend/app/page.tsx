'use client';

import { useState } from 'react';
import { ChatPanel } from './components/chat/ChatPanel';
import { RepoInput } from './components/repo/RepoIntpu';
import { ReviewPanel } from './components/review/ReviewPanel';
import { Tabs } from './components/ui/Tabs';
import { useChat } from './hooks/useChat';
import { useRepo } from './hooks/useRepo';

export default function Home() {
  const { repo, error, isSubmitting, submit } = useRepo();
  const { messages, isAsking, ask } = useChat(repo?.id ?? null);
  const [activeTab, setActiveTab] = useState<'chat' | 'review'>('chat');

  const [tabRepoId, setTabRepoId] = useState<number | null>(repo?.id ?? null);
  if ((repo?.id ?? null) !== tabRepoId) {
    setTabRepoId(repo?.id ?? null);
    setActiveTab('chat');
  }

  const isReady = repo?.status === 'READY';

  return (
    <div className='min-h-screen bg-[#080c10] text-[#cdd9e5] flex flex-col'>
      <main className='flex-1 flex flex-col max-w-3xl w-full mx-auto px-6 py-8 gap-6'>
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
          <div
            className='flex-1 flex flex-col gap-4'
            style={{ minHeight: 'calc(100vh - 200px)' }}
          >
            <Tabs active={activeTab} onChange={setActiveTab} />

            {activeTab === 'chat' && (
              <div className='flex-1 flex flex-col'>
                <ChatPanel
                  messages={messages}
                  isAsking={isAsking}
                  repoName={repo.name}
                  onAsk={ask}
                />
              </div>
            )}

            {activeTab === 'review' && <ReviewPanel repoId={repo.id} />}
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

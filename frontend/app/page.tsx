'use client';

import { ChatPanel } from './components/chat/ChatPanel';
import { RepoInput } from './components/repo/RepoIntpu';
import { StatusBar } from './components/repo/StatusBar';
import { useChat } from './hooks/useChat';
import { useRepo } from './hooks/useRepo';

export default function Home() {
  const { repo, error, isSubmitting, submit, reset } = useRepo();
  const { messages, isAsking, ask, clear } = useChat(repo?.id ?? null);

  function handleReset() {
    reset();
    clear();
  }

  const isReady = repo?.status === 'READY';

  return (
    <div className='min-h-screen bg-[#080c10] text-[#cdd9e5] flex flex-col'>
      <header className='border-b border-[#2d333b] px-6 py-4 flex items-center gap-4'>
        <div className='flex items-baseline gap-2'>
          <span className='font-mono text-lg font-medium tracking-tight'>
            <span className='text-[#316dca]'>[</span>
            sentra
            <span className='text-[#316dca]'>]</span>
          </span>
          <span className='font-mono text-xs text-[#444c56] uppercase tracking-widest hidden sm:block'>
            codebase intelligence
          </span>
        </div>

        {repo && (
          <div className='ml-auto'>
            <StatusBar repo={repo} onReset={handleReset} />
          </div>
        )}
      </header>

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
          <div className='flex-1' style={{ minHeight: 'calc(100vh - 200px)' }}>
            <ChatPanel
              messages={messages}
              isAsking={isAsking}
              repoName={repo.name}
              onAsk={ask}
            />
          </div>
        )}
      </main>
    </div>
  );
}

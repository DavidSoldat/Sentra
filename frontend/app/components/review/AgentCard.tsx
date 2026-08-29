'use client';

import { api, ApiError, isQuotaExceeded } from '@/app/lib/api';
import { streamSSE } from '@/app/lib/sse';
import { AGENT_META, AgentMessage, AgentResult } from '@/app/types/review';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { FindingsText } from './FindIndexed';
import { SeverityBadge } from './SeverityBadge';
import { ThinkingIndicator } from '../chat/ThinkingIndicator';

interface QuotaExceededBody {
  error: 'quota_exceeded';
  resourceType: 'questions' | 'reviews';
  limit: number;
  resetsAt: string;
}

function StatusDot({ status }: { status: AgentResult['status'] }) {
  if (status === 'RUNNING') {
    return (
      <span className='relative flex h-2 w-2'>
        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D29922] opacity-75' />
        <span className='relative inline-flex h-2 w-2 rounded-full bg-[#D29922]' />
      </span>
    );
  }
  if (status === 'DONE') {
    return <span className='h-2 w-2 rounded-full bg-[#3FB950]' />;
  }
  if (status === 'FAILED') {
    return <span className='h-2 w-2 rounded-full bg-[#F85149]' />;
  }
  return <span className='h-2 w-2 rounded-full bg-[#30363D]' />;
}

function statusLabel(status: AgentResult['status']) {
  switch (status) {
    case 'PENDING':
      return 'queued';
    case 'RUNNING':
      return 'reviewing…';
    case 'DONE':
      return 'done';
    case 'FAILED':
      return 'failed';
  }
}

export function AgentCard({
  result,
  reviewId,
  onRetried,
}: {
  result: AgentResult;
  reviewId: number;
  onRetried: () => void;
}) {
  const meta = AGENT_META[result.agent];
  const isEmpty = result.status === 'PENDING';

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<QuotaExceededBody | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result.status === 'DONE' && !loadedHistory) {
      api
        .getAgentMessages(reviewId, result.agent)
        .then(setMessages)
        .catch(() => {})
        .finally(() => setLoadedHistory(true));
    }
  }, [result.status, reviewId, result.agent, loadedHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  async function handleAsk(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = question.trim();
    if (!q || isAsking) return;

    setError(null);
    setQuotaError(null);
    setIsAsking(true);
    setQuestion('');

    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'USER',
        content: q,
        createdAt: new Date().toISOString(),
      },
      {
        id: assistantMsgId,
        role: 'ASSISTANT',
        content: '',
        createdAt: new Date().toISOString(),
      },
    ]);

    let queue = '';
    let revealed = '';
    let frameId: number | null = null;

    function tick() {
      if (queue.length === 0) {
        frameId = null;
        return;
      }
      const next = queue.slice(0, 2);
      queue = queue.slice(2);
      revealed += next;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: revealed } : m,
        ),
      );
      frameId = requestAnimationFrame(tick);
    }

    try {
      const path = `/api/reviews/${reviewId}/agents/${result.agent}/messages/stream?question=${encodeURIComponent(q)}`;

      await streamSSE(path, {
        onEvent: (eventName, data) => {
          if (eventName === 'token') {
            queue += data;
            if (frameId === null) frameId = requestAnimationFrame(tick);
          }
        },
      });
    } catch (err) {
      if (frameId !== null) cancelAnimationFrame(frameId);
      if (isQuotaExceeded(err)) {
        setQuotaError(err.body);
      } else {
        setError(
          err instanceof ApiError ? err.message : 'Failed to send question.',
        );
      }
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId),
      );
      setQuestion(q);
    } finally {
      setIsAsking(false);
    }
  }

  async function handleRetry() {
    if (isRetrying) return;
    setRetryError(null);
    setIsRetrying(true);
    try {
      await api.retryAgent(reviewId, result.agent);
      onRetried();
    } catch (err) {
      setRetryError(
        err instanceof ApiError ? err.message : 'Failed to retry agent.',
      );
      setIsRetrying(false);
    }
  }

  return (
    <div
      className={`flex flex-col rounded-lg border bg-[#0D1117] md:h-130 transition-colors duration-300 ${
        result.status === 'FAILED' ? 'border-[#F85149]/40' : 'border-[#21262D]'
      }`}
    >
      <div className='flex items-center justify-between border-b border-[#21262D] px-4 py-3 shrink-0'>
        <div className='flex items-center gap-2 font-mono text-sm text-[#E6EDF3]'>
          <span aria-hidden>{meta.icon}</span>
          <span>{meta.label}</span>
        </div>
        {result.status === 'DONE' && result.severity ? (
          <SeverityBadge severity={result.severity} />
        ) : (
          <div className='flex items-center gap-1.5 font-mono text-[11px] text-[#6E7681]'>
            <StatusDot status={result.status} />
            {statusLabel(result.status)}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className='flex-1 md:overflow-y-auto px-4 py-3 flex flex-col gap-4 min-h-24'
      >
        {isEmpty && (
          <p className='font-mono text-[13px] text-[#6E7681]'>
            waiting on {meta.description}…
          </p>
        )}

        {result.status === 'RUNNING' && (
          <p className='font-mono text-[13px] text-[#6E7681]'>
            scanning for {meta.description}…
          </p>
        )}

        {result.status === 'FAILED' && (
          <div className='flex flex-col gap-2'>
            <p className='font-mono text-[13px] text-[#F85149]'>
              This agent hit an error and didn&apos;t finish. The other agents
              aren&apos;t affected.
            </p>
            {retryError && (
              <p className='font-mono text-[11px] text-[#F85149]'>
                {retryError}
              </p>
            )}
            <button
              type='button'
              onClick={handleRetry}
              disabled={isRetrying}
              className='self-start rounded-md border border-[#30363D] px-3 py-1.5 font-mono text-[13px] text-[#CDD9E5] hover:border-[#316DCA] hover:text-[#316DCA] disabled:cursor-not-allowed disabled:opacity-40'
            >
              {isRetrying ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        )}

        {result.status === 'DONE' && (
          <>
            {result.findings ? (
              <FindingsText text={result.findings} />
            ) : (
              <p className='font-mono text-[13px] text-[#6E7681]'>
                No findings — clean pass.
              </p>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === 'USER' ? 'self-end max-w-[85%]' : 'max-w-[85%]'
                }
              >
                <div
                  className={`rounded-md px-3 py-2 ${
                    m.role === 'USER'
                      ? 'bg-[#21262D] text-[#CDD9E5]'
                      : 'bg-[#0D1117] border border-[#21262D] text-[#CDD9E5]'
                  }`}
                >
                  {m.role === 'ASSISTANT' && m.content.length === 0 ? (
                    <ThinkingIndicator />
                  ) : m.role === 'USER' ? (
                    <p className='font-mono text-[13px]'>{m.content}</p>
                  ) : (
                    <FindingsText text={m.content} />
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {result.status === 'DONE' && (
        <div className='shrink-0 border-t border-[#21262D] px-3 py-2 flex flex-col gap-1.5'>
          {quotaError && (
            <p className='font-mono text-[11px] text-[#F85149]'>
              You&apos;ve used all {quotaError.limit} free{' '}
              {quotaError.resourceType} this month.
            </p>
          )}
          {error && (
            <p className='font-mono text-[11px] text-[#F85149]'>{error}</p>
          )}

          <form onSubmit={handleAsk} className='flex gap-2'>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAsking || !!quotaError}
              placeholder='Ask a follow-up…'
              className='flex-1 rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-1.5 font-mono text-[13px] text-[#CDD9E5] placeholder:text-[#484F58] outline-none focus:border-[#316DCA] disabled:opacity-50'
            />
            <button
              type='submit'
              disabled={isAsking || !question.trim() || !!quotaError}
              className='rounded-md bg-[#316DCA] px-3 py-1.5 font-mono text-[13px] text-white hover:bg-[#2b5faf] disabled:cursor-not-allowed disabled:opacity-40'
            >
              {isAsking ? '…' : 'Ask'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

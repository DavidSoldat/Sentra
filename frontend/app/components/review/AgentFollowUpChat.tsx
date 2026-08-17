'use client';

import { useState } from 'react';
import { AgentMessage, AgentType } from '@/app/types/review';
import { api, ApiError, isQuotaExceeded } from '@/app/lib/api';
import { FindingsText } from './FindIndexed';

interface QuotaExceededBody {
  error: 'quota_exceeded';
  resourceType: 'questions' | 'reviews';
  limit: number;
  resetsAt: string;
}

interface AgentFollowUpChatProps {
  reviewId: number;
  agentType: AgentType;
}

export function AgentFollowUpChat({
  reviewId,
  agentType,
}: AgentFollowUpChatProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<QuotaExceededBody | null>(null);

  async function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loadedHistory) {
      setIsLoadingHistory(true);
      try {
        const history = await api.getAgentMessages(reviewId, agentType);
        setMessages(history);
      } catch (e) {
        console.error('Failed to load follow-up history', e);
      } finally {
        setIsLoadingHistory(false);
        setLoadedHistory(true);
      }
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || isAsking) return;

    setError(null);
    setQuotaError(null);
    setIsAsking(true);
    setQuestion('');

    try {
      const updated = await api.postAgentMessage(reviewId, agentType, q);
      setMessages(updated);
    } catch (err) {
      if (isQuotaExceeded(err)) {
        setQuotaError(err.body);
      } else {
        setError(
          err instanceof ApiError ? err.message : 'Failed to send question.',
        );
      }
      setQuestion(q);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className='border-t border-[#21262D]'>
      <button
        type='button'
        onClick={handleToggle}
        className='w-full flex items-center justify-between px-4 py-2 font-mono text-[11px] text-[#6E7681] hover:text-[#CDD9E5] transition-colors'
      >
        <span>Ask a follow-up</span>
        <span>{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className='px-4 pb-3 flex flex-col gap-2'>
          {isLoadingHistory && (
            <p className='font-mono text-[12px] text-[#6E7681]'>Loading…</p>
          )}

          {!isLoadingHistory && messages.length > 0 && (
            <div className='flex flex-col gap-2 max-h-56 overflow-y-auto'>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === 'USER' ? 'text-right' : ''}
                >
                  <div
                    className={`inline-block rounded-md px-3 py-1.5 text-left max-w-[90%] ${
                      m.role === 'USER'
                        ? 'bg-[#21262D] text-[#CDD9E5]'
                        : 'bg-[#0D1117] border border-[#21262D] text-[#CDD9E5]'
                    }`}
                  >
                    {m.role === 'USER' ? (
                      <p className='font-mono text-[13px]'>{m.content}</p>
                    ) : (
                      <FindingsText text={m.content} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {quotaError && (
            <p className='font-mono text-[12px] text-[#F85149]'>
              You&apos;ve used all {quotaError.limit} free{' '}
              {quotaError.resourceType} this month.
            </p>
          )}
          {error && (
            <p className='font-mono text-[12px] text-[#F85149]'>{error}</p>
          )}

          <form onSubmit={handleAsk} className='flex gap-2'>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAsking || !!quotaError}
              placeholder='Ask about these findings…'
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

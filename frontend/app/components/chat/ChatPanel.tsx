'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Message } from '@/app/types';
import { ThinkingIndicator } from './ThinkingIndicator';

const SUGGESTIONS = [
  'What does this project do?',
  'What tech stack and dependencies does it use?',
  "What's the entry point of the application?",
  'Where are environment variables and configuration set up?',
];

interface ChatPanelProps {
  messages: Message[];
  isAsking: boolean;
  repoName: string;
  onAsk: (question: string) => void;
}

export function ChatPanel({
  messages,
  isAsking,
  repoName,
  onAsk,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (messages.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      scrollToBottom('smooth');
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, isAsking]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight);
    setShowScrollToBottom(distanceFromBottom > 160);
  };

  return (
    <div className='flex flex-col h-full min-h-0 border border-[#2d333b] rounded-lg overflow-hidden bg-[#080c10]'>
      <div className='relative flex-1 min-h-0'>
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className='h-full overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-[#2d333b] scrollbar-track-transparent'
        >
          {messages.length === 0 ? (
            <div className='flex flex-col gap-5 h-full justify-center'>
              <div>
                <p className='font-mono text-xs text-[#444c56] uppercase tracking-widest mb-1'>
                  indexed
                </p>
                <p className='font-mono text-sm text-[#768390]'>{repoName}</p>
              </div>

              <div className='border-t border-[#2d333b] pt-5'>
                <p className='font-mono text-xs text-[#444c56] mb-3'>
                  try asking
                </p>
                <div className='flex flex-col gap-2'>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => onAsk(s)}
                      className='
                      text-left font-mono text-sm text-[#768390]
                      bg-[#0e1318] border border-[#2d333b] rounded-md
                      px-4 py-2.5
                      hover:border-[#316dca] hover:text-[#cdd9e5]
                      transition-colors duration-150 cursor-pointer
                    '
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isAsking && <ThinkingIndicator />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {messages.length > 0 && (
          <button
            type='button'
            onClick={() => scrollToBottom('smooth')}
            aria-label='Scroll to bottom'
            className={`absolute bottom-4 cursor-pointer right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#2d333b] bg-[#0e1318]/90 text-[#cdd9e5] shadow-lg transition-all duration-200 ${
              showScrollToBottom
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-2 opacity-0'
            }`}
          >
            <svg
              viewBox='0 0 24 24'
              className='h-5 w-5'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='m6 9 6 6 6-6' />
            </svg>
          </button>
        )}
      </div>

      <ChatInput onAsk={onAsk} isAsking={isAsking} />
    </div>
  );
}

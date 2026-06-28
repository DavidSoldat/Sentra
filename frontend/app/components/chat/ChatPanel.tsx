'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Message } from '@/app/types';
import { ThinkingIndicator } from './ThinkingIndicator';


const SUGGESTIONS = [
  'What tech stack is this project using?',
  'How is authentication handled?',
  'Walk me through the folder structure.',
  'Where are environment variables configured?',
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  return (
    <div className='flex flex-col h-full border border-[#2d333b] rounded-lg overflow-hidden bg-[#080c10]'>
      {/* Messages area */}
      <div className='flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-[#2d333b] scrollbar-track-transparent'>
        {messages.length === 0 ? (
          /* Empty state */
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

      {/* Input */}
      <ChatInput onAsk={onAsk} isAsking={isAsking} />
    </div>
  );
}

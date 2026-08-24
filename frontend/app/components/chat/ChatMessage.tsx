import { Message } from '@/app/types';
import { FindingsText } from '../review/FindIndexed';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className='flex flex-col gap-2'>
      <span
        className={`font-mono text-[10px] font-semibold tracking-widest uppercase ${
          isUser ? 'text-[#316dca]' : 'text-[#3fb950]'
        }`}
      >
        {isUser ? 'you' : 'sentra'}
      </span>

      {!isUser && message.content.length === 0 ? (
        <ThinkingIndicator />
      ) : isUser ? (
        <p className='font-mono text-sm text-[#cdd9e5] leading-relaxed whitespace-pre-wrap'>
          {message.content}
        </p>
      ) : (
        <FindingsText text={message.content} />
      )}

      {message.sources && message.sources.length > 0 && (
        <div className='flex flex-wrap gap-1.5 mt-1'>
          {message.sources.map((src) => (
            <span
              key={src}
              className='
                inline-flex items-center gap-1.5 font-mono text-[11px]
                text-[#768390] bg-[#1c2128] border border-[#2d333b]
                rounded px-2 py-0.5
              '
            >
              <span className='text-[#316dca]'>$</span>
              {src}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

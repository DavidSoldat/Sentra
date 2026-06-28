'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onAsk: (question: string) => void;
  isAsking: boolean;
}

export function ChatInput({ onAsk, isAsking }: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    if (!value.trim() || isAsking) return;
    onAsk(value.trim());
    setValue('');
  }

  return (
    <div className='border-t border-[#2d333b] bg-[#0e1318]'>
      <div className='flex items-center'>
        <span className='px-4 font-mono text-[#3fb950] text-base select-none shrink-0'>
          ?
        </span>
        <input
          ref={inputRef}
          type='text'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder='Ask anything about this codebase…'
          disabled={isAsking}
          className='
            flex-1 bg-transparent outline-none font-mono text-sm
            text-[#cdd9e5] placeholder-[#444c56] py-4
            disabled:opacity-50
          '
        />
        <button
          onClick={handleSubmit}
          disabled={isAsking || !value.trim()}
          className='
            shrink-0 px-5 py-4 font-mono text-sm text-[#316dca] font-medium
            border-l border-[#2d333b]
            hover:text-[#388bfd] hover:bg-[#1c2128]
            disabled:text-[#444c56] disabled:cursor-not-allowed
            transition-colors duration-150 cursor-pointer
          '
        >
          ask
        </button>
      </div>
    </div>
  );
}

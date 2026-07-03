'use client';

import { isValidPrUrl } from '@/app/lib/api';
import { useState } from 'react';

interface PrUrlInputProps {
  onSubmit: (prUrl: string) => void;
  isSubmitting: boolean;
  disabledReason?: string;
}

export function PrUrlInput({ onSubmit, isSubmitting }: PrUrlInputProps) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = isValidPrUrl(value);
  const showError = touched && value.length > 0 && !isValid;

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (isValid) onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <div className='flex-1 flex items-center gap-2 rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 focus-within:border-[#316DCA]'>
          <span className='font-mono text-[#6E7681] text-sm select-none'>
            $
          </span>
          <input
            type='text'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder='https://github.com/owner/repo/pull/123'
            className='flex-1 bg-transparent font-mono text-sm text-[#E6EDF3] placeholder:text-[#484F58] outline-none disabled:opacity-50'
          />
        </div>
        <button
          type='submit'
          disabled={isSubmitting || !value}
          className='rounded-md bg-[#316DCA] px-4 py-2 font-mono text-sm text-white transition-colors hover:bg-[#2B5FAF] disabled:cursor-not-allowed disabled:bg-[#21262D] disabled:text-[#6E7681]'
        >
          {isSubmitting ? 'starting…' : 'Review PR'}
        </button>
      </div>

      {showError && (
        <p className='font-mono text-[12px] text-[#F85149]'>
          That doesn&apos;t look like a GitHub PR URL. Expected format:
          github.com/owner/repo/pull/123
        </p>
      )}
    </form>
  );
}

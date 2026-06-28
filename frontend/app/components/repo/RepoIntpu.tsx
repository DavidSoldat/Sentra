'use client';

import { useState } from 'react';

interface RepoInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

const GITHUB_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;

export function RepoInput({ onSubmit, isLoading, error }: RepoInputProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  function handleSubmit() {
    const trimmed = url.trim();
    if (!GITHUB_RE.test(trimmed)) {
      setValidationError('Enter a valid GitHub repo URL');
      return;
    }
    setValidationError('');
    onSubmit(trimmed);
  }

  const displayError = validationError || error;

  return (
    <div className='w-full'>
      <div
        className={`
          flex items-center bg-[#0e1318] border rounded-lg overflow-hidden
          transition-colors duration-150
          ${displayError ? 'border-[#f85149]' : 'border-[#2d333b] focus-within:border-[#316dca]'}
        `}
      >
        <span className='px-4 font-mono text-[#316dca] text-sm select-none shrink-0'>
          $
        </span>
        <input
          type='text'
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setValidationError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
          placeholder='https://github.com/owner/repo'
          spellCheck={false}
          autoComplete='off'
          className='
            flex-1 bg-transparent outline-none font-mono text-sm
            text-[#cdd9e5] placeholder-[#444c56] py-3 pr-2
          '
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className='
            shrink-0 px-5 py-3 font-mono text-sm font-medium
            bg-[#316dca] text-white
            hover:bg-[#388bfd] disabled:bg-[#1c2128] disabled:text-[#444c56]
            transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed
          '
        >
          {isLoading ? 'indexing…' : 'index →'}
        </button>
      </div>

      {displayError && (
        <p className='mt-2 text-xs font-mono text-[#f85149] pl-1'>
          {displayError}
        </p>
      )}
    </div>
  );
}

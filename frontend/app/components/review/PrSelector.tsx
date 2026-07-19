'use client';

import { useState } from 'react';
import { PrPicker } from './PrPicker';
import { PrUrlInput } from './UrlInput';

interface PrSelectorProps {
  repoId: number;
  isSubmitting: boolean;
  onSubmit: (prUrl: string) => void;
}

export function PrSelector({
  repoId,
  isSubmitting,
  onSubmit,
}: PrSelectorProps) {
  const [mode, setMode] = useState<'picker' | 'manual'>('picker');

  return (
    <div className='flex flex-col gap-2'>
      {mode === 'picker' ? (
        <PrPicker
          repoId={repoId}
          isSubmitting={isSubmitting}
          onSelect={onSubmit}
        />
      ) : (
        <PrUrlInput onSubmit={onSubmit} isSubmitting={isSubmitting} />
      )}

      <button
        type='button'
        onClick={() => setMode((m) => (m === 'picker' ? 'manual' : 'picker'))}
        className='self-start font-mono text-xs text-[#316DCA] hover:underline'
      >
        {mode === 'picker' ? 'or paste a PR URL instead' : '← back to PR list'}
      </button>
    </div>
  );
}

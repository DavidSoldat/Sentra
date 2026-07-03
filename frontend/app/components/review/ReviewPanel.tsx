'use client';

import { useState } from 'react';
import { useReview } from '../../hooks/useReview';
import { PrUrlInput } from './UrlInput';
import { AgentGrid } from './AgentGrid';

function overallLabel(status?: string) {
  switch (status) {
    case 'RUNNING':
      return 'Agents are reviewing the diff…';
    case 'COMPLETED':
      return 'Review complete.';
    case 'FAILED':
      return 'Review failed to complete.';
    default:
      return '';
  }
}

export function ReviewPanel({ repoId }: { repoId: number }) {
  const { review, error, isSubmitting, start, reset } = useReview();

  // Currently ReviewPanel is unmounted whenever the tab isn't 'review' or
  // the repo changes (page.tsx resets activeTab to 'chat' on repo switch),
  // so a fresh useReview() state is already the common case. This guards
  // the same thing directly, in case that unmount behavior ever changes.
  const [lastRepoId, setLastRepoId] = useState(repoId);
  if (repoId !== lastRepoId) {
    setLastRepoId(repoId);
    reset();
  }

  return (
    <div className='flex flex-col gap-6'>
      <PrUrlInput
        onSubmit={(prUrl) => start(repoId, prUrl)}
        isSubmitting={isSubmitting}
      />

      {error && (
        <div className='rounded-md border border-[#F85149]/40 bg-[#3D1418] px-4 py-3 font-mono text-sm text-[#F85149]'>
          {error}
        </div>
      )}

      {review && (
        <>
          <div className='flex items-center justify-between font-mono text-sm'>
            <a
              href={review.prUrl}
              target='_blank'
              rel='noreferrer'
              className='text-[#316DCA] hover:underline'
            >
              {review.prUrl}
            </a>
            <span className='text-[#6E7681]'>
              {overallLabel(review.status)}
            </span>
          </div>
          <AgentGrid agents={review.agents} />
        </>
      )}

      {!review && (
        <p className='font-mono text-sm text-[#6E7681]'>
          Paste a pull request from this repo above to run the four review
          agents against it.
        </p>
      )}
    </div>
  );
}

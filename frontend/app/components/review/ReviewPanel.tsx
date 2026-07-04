'use client';

import { ReviewResponse } from '../../types/review';
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

interface ReviewPanelProps {
  review: ReviewResponse | null;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (prUrl: string) => void;
}

export function ReviewPanel({
  review,
  error,
  isSubmitting,
  onSubmit,
}: ReviewPanelProps) {
  return (
    <div className='flex flex-col gap-6'>
      <PrUrlInput onSubmit={onSubmit} isSubmitting={isSubmitting} />

      {error && (
        <div className='rounded-md border border-[#F85149]/40 bg-[#3D1418] px-4 py-3 font-mono text-sm text-[#F85149]'>
          {error}
        </div>
      )}

      {review && (
        <>
          <div className='flex items-center justify-between font-mono text-sm'>
            <div className='flex space-x-1'>
              <p>Pull request: </p>
              <a
                href={review.prUrl}
                target='_blank'
                rel='noreferrer'
                className='text-[#316DCA] hover:underline'
              >
                {review.prTitle ?? review.prUrl}
              </a>
            </div>
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

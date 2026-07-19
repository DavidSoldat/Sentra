'use client';

import { ReviewResponse } from '../../types/review';
import { AgentGrid } from './AgentGrid';
import { PrSelector } from './PrSelector';

interface QuotaExceededBody {
  error: 'quota_exceeded';
  resourceType: 'questions' | 'reviews';
  limit: number;
  resetsAt: string;
}

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
  repoId: number;
  review: ReviewResponse | null;
  error: string | null;
  quotaError: QuotaExceededBody | null;
  isSubmitting: boolean;
  onSubmit: (prUrl: string) => void;
}

export function ReviewPanel({
  repoId,
  review,
  error,
  quotaError,
  isSubmitting,
  onSubmit,
}: ReviewPanelProps) {
  return (
    <div className='flex flex-col gap-6'>
      {quotaError ? (
        <div className='flex items-center justify-between gap-4 rounded-md border border-[#F85149]/40 bg-[#3D1418] px-4 py-3'>
          <p className='font-mono text-sm text-[#F85149]'>
            You&apos;ve used all {quotaError.limit} free{' '}
            {quotaError.resourceType} this month — resets{' '}
            {new Date(quotaError.resetsAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            .
          </p>
          <button
            type='button'
            disabled
            title='Coming soon'
            className='shrink-0 rounded-md bg-[#316dca]/40 px-3 py-1.5 font-mono text-xs text-white/70 cursor-not-allowed'
          >
            Upgrade
          </button>
        </div>
      ) : (
        <PrSelector
          repoId={repoId}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      )}

      {!quotaError && error && (
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

      {!review && !quotaError && (
        <p className='font-mono text-sm text-[#6E7681]'>
          Paste a pull request from this repo above to run the four review
          agents against it.
        </p>
      )}
    </div>
  );
}

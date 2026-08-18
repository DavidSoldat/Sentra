'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ReviewResponse, ReviewSummary } from '../../types/review';
import { AgentGrid } from './AgentGrid';
import { PrSelector } from './PrSelector';
import { api } from '@/app/lib/api';

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
  onSelectReview: (reviewId: number) => void;
}

export function ReviewPanel({
  repoId,
  review,
  error,
  quotaError,
  isSubmitting,
  onSubmit,
  onSelectReview,
}: ReviewPanelProps) {
  const router = useRouter();
  const [history, setHistory] = useState<ReviewSummary[]>([]);

  useEffect(() => {
    if (!review) {
      api
        .getRepoReviews(repoId)
        .then(setHistory)
        .catch(() => {});
    }
  }, [repoId, review]);

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
            onClick={() => router.push('/pricing')}
            className='shrink-0 rounded-md bg-[#316dca] px-3 py-1.5 font-mono text-xs text-white hover:bg-[#2b5faf] transition-colors'
          >
            Upgrade
          </button>
        </div>
      ) : (
        // <PrSelector
        //   repoId={repoId}
        //   isSubmitting={isSubmitting}
        //   onSubmit={onSubmit}
        // />
        <>
          <PrSelector
            repoId={repoId}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
          {!review && history.length > 0 && (
            <div className='flex flex-col gap-2'>
              <p className='font-mono text-sm text-[#6E7681]'>
                Previously reviewed
              </p>
              {history.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectReview(r.id)}
                  className='w-full flex items-center justify-between rounded-md border border-[#30363D] bg-[#OD1117] px-3 py-2 text-left hover:border-[#316DCA] transition-colors'
                >
                  <span className='font-mono text-sm text-[#CDD9E5] truncate'>
                    {r.prTitle ?? r.prUrl}
                  </span>
                  <span className='font-mono text-[11px] text-[#6E7681] shrink-0 ml-3'>
                    {r.status === 'FAILED'
                      ? 'Failed'
                      : new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
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
          <AgentGrid agents={review.agents} reviewId={review.id} />
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

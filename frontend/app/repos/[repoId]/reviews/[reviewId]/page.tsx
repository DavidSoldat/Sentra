'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useReview } from '../../../../hooks/useReview';
import { AgentGrid } from '../../../../components/review/AgentGrid';
import { AgentResult } from '../../../../types/review';
import Link from 'next/link';

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

const SEVERITY_STYLES: Record<string, string> = {
  HIGH: 'text-[#f85149] border-[#f85149]/30 bg-[#f85149]/10',
  MEDIUM: 'text-[#d29922] border-[#d29922]/30 bg-[#d29922]/10',
  LOW: 'text-[#3fb950] border-[#3fb950]/30 bg-[#3fb950]/10',
  NONE: 'text-[#6e7681] border-[#30363d] bg-transparent',
};

function overallSeverity(agents: AgentResult[]): string | null {
  const order = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];
  const done = agents.filter((a) => a.status === 'DONE' && a.severity);
  for (const level of order) {
    if (done.some((a) => a.severity === level)) return level;
  }
  return null;
}

export default function ReviewDetailPage() {
  const params = useParams<{ repoId: string; reviewId: string }>();
  const router = useRouter();
  const repoId = Number(params.repoId);
  const reviewId = Number(params.reviewId);

  const { review, error, loadReview, reset } = useReview(repoId);

  useEffect(() => {
    if (!Number.isNaN(reviewId)) loadReview(reviewId);

    return () => {
      reset();
      console.log('reset called');
    };
  }, [reviewId, loadReview, reset]);

  const severity = review ? overallSeverity(review.agents) : null;

  return (
    <div className='h-full min-h-0 overflow-y-auto bg-[#080c10] text-[#cdd9e5]'>
      <div className='max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6'>
        <button
          type='button'
          onClick={() => router.push(`/repos/${repoId}?tab=review`)}
          className='self-start font-mono text-xs text-[#316DCA] hover:underline'
        >
          ← Back to PR list
        </button>

        {error && (
          <div className='rounded-md border border-[#F85149]/40 bg-[#3D1418] px-4 py-3 font-mono text-sm text-[#F85149]'>
            {error}
          </div>
        )}

        {review && (
          <>
            <div className='flex items-center justify-between font-mono text-sm flex-wrap gap-2'>
              <div className='flex items-center gap-2'>
                <p className='text-[#6E7681]'>Pull request:</p>
                <Link
                  href={review.prUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-[#316DCA] hover:underline text-base'
                >
                  {review.prTitle ?? review.prUrl}
                </Link>
              </div>
              <div className='flex items-center gap-2'>
                {review.status === 'COMPLETED' && severity && (
                  <span
                    className={`font-mono text-[11px] uppercase tracking-widest rounded-full border px-2 py-0.5 ${SEVERITY_STYLES[severity]}`}
                  >
                    {severity} risk
                  </span>
                )}
                <span className='text-[#6E7681]'>
                  {overallLabel(review.status)}
                </span>
              </div>
            </div>

            <AgentGrid agents={review.agents} reviewId={review.id} />
          </>
        )}

        {!review && !error && (
          <p className='font-mono text-sm text-[#6E7681]'>Loading review…</p>
        )}
      </div>
    </div>
  );
}

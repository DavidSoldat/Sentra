'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/app/lib/api';
import { AGENT_META, PublicReviewResponse } from '@/app/types/review';
import { FindingsText } from '@/app/components/review/FindIndexed';
import { SEVERITY_STYLES } from '../../lib/helpers';

export default function SharedReviewPage() {
  const params = useParams<{ token: string }>();
  const [review, setReview] = useState<PublicReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicReview(params.token)
      .then(setReview)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? 'This share link is no longer valid.'
            : 'Failed to load review.',
        ),
      );
  }, [params.token]);

  return (
    <div className='h-full min-h-0 overflow-y-auto bg-[#080c10] text-[#cdd9e5]'>
      <div className='max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6'>
        <div className='font-mono text-xs text-[#484f58]'>
          Shared via <span className='text-[#316dca]'>Sentra</span> — read-only
        </div>

        {error && (
          <div className='rounded-md border border-[#F85149]/40 bg-[#3D1418] px-4 py-3 font-mono text-sm text-[#F85149]'>
            {error}
          </div>
        )}

        {review && (
          <>
            <div className='flex items-center gap-2 font-mono text-sm'>
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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-start'>
              {review.agents.map((agent) => {
                const meta = AGENT_META[agent.agent];
                return (
                  <div
                    key={agent.agent}
                    className='flex flex-col rounded-lg border border-[#21262D] bg-[#0D1117] md:h-130'
                  >
                    <div className='flex items-center justify-between border-b border-[#21262D] px-4 py-3 shrink-0'>
                      <div className='flex items-center gap-2 font-mono text-sm text-[#E6EDF3]'>
                        <span aria-hidden>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </div>
                      {agent.severity && (
                        <span
                          className={`font-mono text-[11px] uppercase tracking-widest rounded-full border px-2 py-0.5 ${SEVERITY_STYLES[agent.severity] ?? ''}`}
                        >
                          {agent.severity}
                        </span>
                      )}
                    </div>
                    <div className='flex-1 md:overflow-y-auto px-4 py-3'>
                      {agent.findings ? (
                        <FindingsText text={agent.findings} />
                      ) : (
                        <p className='font-mono text-[13px] text-[#6E7681]'>
                          {agent.status === 'DONE'
                            ? 'No findings — clean pass.'
                            : 'This agent did not complete.'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!review && !error && (
          <p className='font-mono text-sm text-[#6E7681]'>Loading…</p>
        )}
      </div>
    </div>
  );
}

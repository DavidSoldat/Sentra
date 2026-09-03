'use client';

import {
  api,
  exportReviewMarkdown,
  isPrivateRepoConfirmationRequired,
  postReviewToGithub,
} from '@/app/lib/api';
import {
  overallLabel,
  overallSeverity,
  SEVERITY_STYLES,
} from '@/app/lib/helpers';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AgentGrid } from '../../../../components/review/AgentGrid';
import { useReview } from '../../../../hooks/useReview';

export default function ReviewDetailPage() {
  const params = useParams<{ repoId: string; reviewId: string }>();
  const router = useRouter();
  const repoId = Number(params.repoId);
  const reviewId = Number(params.reviewId);

  const { review, error, loadReview, reset, resumeStream } = useReview(repoId);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [localReview, setLocalReview] = useState<typeof review>(null);
  const [prevReview, setPrevReview] = useState(review);

  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [needsPrivateConfirm, setNeedsPrivateConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isNaN(reviewId)) loadReview(reviewId);

    return () => {
      reset();
      console.log('reset called');
    };
  }, [reviewId, loadReview, reset]);

  if (review !== prevReview) {
    setPrevReview(review);
    setLocalReview(review);
  }

  async function handlePostToGithub() {
    if (!localReview) return;
    setIsPosting(true);
    setPostError(null);
    try {
      const updated = await postReviewToGithub(localReview.id);
      setLocalReview(updated);
    } catch (err) {
      setPostError(
        err instanceof Error ? err.message : 'Failed to post to GitHub.',
      );
    } finally {
      setIsPosting(false);
    }
  }

  async function handleShare(confirm = false) {
    if (!localReview) return;
    setIsSharing(true);
    setShareError(null);
    try {
      const updated = await api.shareReview(localReview.id, confirm);
      setLocalReview(updated);
      setNeedsPrivateConfirm(false);
    } catch (err) {
      if (isPrivateRepoConfirmationRequired(err)) {
        setNeedsPrivateConfirm(true);
      } else {
        setShareError(
          err instanceof Error ? err.message : 'Failed to create share link.',
        );
      }
    } finally {
      setIsSharing(false);
    }
  }

  async function handleUnshare() {
    if (!localReview) return;
    setIsSharing(true);
    setShareError(null);
    try {
      await api.unshareReview(localReview.id);
      setLocalReview({ ...localReview, shareToken: null });
    } catch (err) {
      setShareError(
        err instanceof Error ? err.message : 'Failed to revoke share link.',
      );
    } finally {
      setIsSharing(false);
    }
  }

  async function handleCopyLink() {
    if (!localReview?.shareToken) return;
    const url = `${window.location.origin}/share/${localReview.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExport() {
    if (!localReview) return;
    setIsExporting(true);
    setExportError(null);
    try {
      await exportReviewMarkdown(localReview.id);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Failed to export review.',
      );
    } finally {
      setIsExporting(false);
    }
  }

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
                {localReview?.status === 'COMPLETED' && severity && (
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

            {review.status === 'COMPLETED' && (
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-3 flex-wrap'>
                  {localReview?.githubCommentUrl ? (
                    <Link
                      href={localReview.githubCommentUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1.5 font-mono text-xs text-[#3fb950] hover:underline'
                    >
                      ✓ Posted to GitHub
                    </Link>
                  ) : (
                    <button
                      type='button'
                      onClick={handlePostToGithub}
                      disabled={isPosting}
                      className='rounded-md border border-[#2d333b] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] hover:bg-[#161b22] disabled:opacity-50 transition-colors'
                    >
                      {isPosting ? 'Posting…' : 'Post to GitHub'}
                    </button>
                  )}

                  {localReview?.shareToken ? (
                    <>
                      <button
                        type='button'
                        onClick={handleCopyLink}
                        className='rounded-md border border-[#2d333b] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] hover:bg-[#161b22] transition-colors'
                      >
                        {copied ? 'Copied!' : 'Copy share link'}
                      </button>
                      <button
                        type='button'
                        onClick={handleUnshare}
                        disabled={isSharing}
                        className='font-mono text-xs text-[#6e7681] hover:text-[#f85149] disabled:opacity-50'
                      >
                        Revoke
                      </button>
                    </>
                  ) : (
                    <button
                      type='button'
                      onClick={() => handleShare(false)}
                      disabled={isSharing}
                      className='rounded-md border border-[#2d333b] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] hover:bg-[#161b22] disabled:opacity-50 transition-colors'
                    >
                      {isSharing ? 'Creating link…' : 'Share'}
                    </button>
                  )}

                  <button
                    type='button'
                    onClick={handleExport}
                    disabled={isExporting}
                    className='rounded-md border border-[#2d333b] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] hover:bg-[#161b22] disabled:opacity-50 transition-colors'
                  >
                    {isExporting ? 'Exporting…' : 'Export as Markdown'}
                  </button>
                </div>

                {needsPrivateConfirm && (
                  <div className='flex items-center gap-3 rounded-md border border-[#d29922]/40 bg-[#2d2410] px-4 py-3'>
                    <p className='font-mono text-xs text-[#d29922] flex-1'>
                      This repo is private. Anyone with the share link will be
                      able to view this review&apos;s findings, including code
                      context, without logging in.
                    </p>
                    <button
                      type='button'
                      onClick={() => handleShare(true)}
                      className='shrink-0 rounded-md border border-[#d29922]/50 px-3 py-1.5 font-mono text-xs text-[#d29922] hover:bg-[#d29922]/10 transition-colors'
                    >
                      Share anyway
                    </button>
                    <button
                      type='button'
                      onClick={() => setNeedsPrivateConfirm(false)}
                      className='shrink-0 font-mono text-xs text-[#6e7681] hover:text-[#cdd9e5]'
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {(postError || shareError || exportError) && (
                  <span className='font-mono text-xs text-[#f85149]'>
                    {postError || shareError || exportError}
                  </span>
                )}
              </div>
            )}

            <AgentGrid
              agents={review.agents}
              reviewId={review.id}
              onRetried={() => resumeStream(review.id)}
            />
          </>
        )}

        {!review && !error && (
          <p className='font-mono text-sm text-[#6E7681]'>Loading review…</p>
        )}
      </div>
    </div>
  );
}

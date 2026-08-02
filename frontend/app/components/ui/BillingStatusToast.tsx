'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBillingStore } from '../../store/useBillingStore';

const AUTO_DISMISS_MS = 5000;

export function BillingStatusToast() {
  const status = useBillingStore((s) => s.upgradeStatus);
  const reset = useBillingStore((s) => s.resetUpgradeStatus);

  useEffect(() => {
    if (status !== 'confirmed') return;
    const timer = setTimeout(reset, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [status, reset]);

  if (status === 'idle') return null;

  return createPortal(
    <div className='fixed top-4 left-1/2 z-50 -translate-x-1/2 px-4'>
      {status === 'processing' && (
        <div className='flex items-center gap-3 rounded-lg border border-[#2d333b] bg-[#0d1117] px-4 py-3 shadow-xl'>
          <span className='h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-[#316dca] border-t-transparent' />
          <p className='font-mono text-xs text-[#cdd9e5]'>
            Payment received — activating your Pro plan…
          </p>
        </div>
      )}

      {status === 'confirmed' && (
        <div className='flex items-center gap-3 rounded-lg border border-[#3fb950]/30 bg-[#0d1117] px-4 py-3 shadow-xl'>
          <span className='h-2 w-2 shrink-0 rounded-full bg-[#3fb950]' />
          <p className='font-mono text-xs text-[#cdd9e5]'>
            You&apos;re now on Sentra Pro. Enjoy the extra headroom.
          </p>
          <button
            onClick={reset}
            aria-label='Dismiss'
            className='ml-2 text-[#6e7681] hover:text-[#cdd9e5]'
          >
            ✕
          </button>
        </div>
      )}

      {status === 'timed_out' && (
        <div className='flex items-center gap-3 rounded-lg border border-[#d29922]/30 bg-[#0d1117] px-4 py-3 shadow-xl'>
          <span className='h-2 w-2 shrink-0 rounded-full bg-[#d29922]' />
          <p className='font-mono text-xs text-[#cdd9e5]'>
            Payment received — Pro access is taking a bit longer than usual to
            activate. It should be ready shortly.
          </p>
          <button
            onClick={reset}
            aria-label='Dismiss'
            className='ml-2 text-[#6e7681] hover:text-[#cdd9e5]'
          >
            ✕
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

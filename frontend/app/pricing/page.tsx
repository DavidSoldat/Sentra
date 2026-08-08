'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/useAuthStore';
import { useBillingStore } from '../store/useBillingStore';

const FREE_FEATURES = [
  '3 repositories',
  '40 questions / month',
  '3 PR reviews / month',
  'Full chat history & sidebar',
  'Unlimited repo indexing',
];

const PRO_FEATURES = [
  '10 repositories',
  '1,000 questions / month',
  '50 PR reviews / month',
  'Full chat history & sidebar', 
  'Unlimited repo indexing',
  'Priority support',
];

export default function PricingPage() {
  const user = useAuthStore((s) => s.user);
  const openUpgradeCheckout = useBillingStore((s) => s.openUpgradeCheckout);

  const isPro = user?.tier === 'PRO';

  return (
    <div className='min-h-screen bg-[#080c10] text-[#cdd9e5] px-4 sm:px-6 py-16'>
      <div className='max-w-3xl mx-auto text-center mb-12'>
        <h1 className='font-mono text-3xl font-medium tracking-tight mb-3'>
          <span className='text-[#316dca]'>[</span>
          pricing
          <span className='text-[#316dca]'>]</span>
        </h1>
        <p className='text-sm text-[#768390]'>
          Start free. Upgrade when you need more repos, questions, or reviews.
        </p>
      </div>

      <div className='max-w-3xl mx-auto grid md:grid-cols-2 gap-6'>
        <div className='border border-[#2d333b] rounded-md p-8 flex flex-col bg-[#0d1117]'>
          <h2 className='font-mono text-sm uppercase tracking-widest text-[#768390] mb-2'>
            Free
          </h2>
          <p className='text-3xl font-mono font-medium mb-6'>
            $0<span className='text-sm font-normal text-[#768390]'>/mo</span>
          </p>
          <ul className='space-y-3 mb-8 flex-1'>
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                className='flex items-start gap-2 text-sm text-[#adbac7]'
              >
                <span className='text-[#316dca] mt-0.5 font-mono'>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            disabled
            className='w-full py-2.5 rounded-md border border-[#2d333b] text-[#768390] text-sm font-mono cursor-default'
          >
            {isPro ? 'Downgrade via portal' : 'Current plan'}
          </button>
        </div>

        <div className='border border-[#316dca] rounded-md p-8 flex flex-col relative bg-[#0d1117]'>
          <span className='absolute -top-3 left-8 bg-[#316dca] text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full text-white'>
            Recommended
          </span>
          <h2 className='font-mono text-sm uppercase tracking-widest text-[#768390] mb-2'>
            Pro
          </h2>
          <p className='text-3xl font-mono font-medium mb-6'>
            $12<span className='text-sm font-normal text-[#768390]'>/mo</span>
          </p>
          <ul className='space-y-3 mb-8 flex-1'>
            {PRO_FEATURES.map((f) => (
              <li
                key={f}
                className='flex items-start gap-2 text-sm text-[#adbac7]'
              >
                <span className='text-[#316dca] mt-0.5 font-mono'>✓</span>
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <Link
              href='/'
              className='w-full text-center py-2.5 rounded-md bg-[#316dca] hover:bg-[#2b5faf] transition-colors text-sm font-mono font-medium text-white'
            >
              You&apos;re on Pro
            </Link>
          ) : (
            <button
              onClick={() => user && openUpgradeCheckout(user.id)}
              className='w-full py-2.5 rounded-md bg-[#316dca] hover:bg-[#2b5faf] transition-colors text-sm font-mono font-medium text-white'
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

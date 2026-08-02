'use client';
import Image from 'next/image';
import { StatusBar } from '../repo/StatusBar';
import Link from 'next/link';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useChatStore } from '@/app/store/useChatStore';
import { useRepoStore } from '@/app/store/useRepoStore';
import { useUIStore } from '@/app/store/useUiStore';
import { useBillingStore } from '@/app/store/useBillingStore';
import TierBadge from './TierBadge';

export default function Nav() {
  const repo = useRepoStore((s) => s.repo);
  const reset = useRepoStore((s) => s.reset);
  const clear = useChatStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const openUpgradeCheckout = useBillingStore((s) => s.openUpgradeCheckout);

  return (
    <header className='border-b border-[#2d333b] px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4 bg-[#080c10] text-[#cdd9e5]'>
      <button
        onClick={toggleSidebar}
        aria-label='Toggle repo sidebar'
        className='md:hidden -ml-1 flex h-8 w-8 items-center justify-center rounded-md text-[#768390] hover:bg-[#161b22] hover:text-[#cdd9e5]'
      >
        <svg
          viewBox='0 0 24 24'
          className='h-5 w-5'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M4 6h16M4 12h16M4 18h16' />
        </svg>
      </button>

      <Link href='/' className='flex items-baseline gap-2'>
        <span className='font-mono text-lg font-medium tracking-tight'>
          <span className='text-[#316dca]'>[</span>
          sentra
          <span className='text-[#316dca]'>]</span>
        </span>
        <span className='font-mono text-xs text-[#444c56] uppercase tracking-widest hidden sm:block'>
          codebase intelligence
        </span>
      </Link>

      <div className='ml-auto flex items-center gap-3'>
        {repo && (
          <div className='hidden md:block'>
            <StatusBar
              repo={repo}
              onReset={() => {
                reset();
                clear();
              }}
            />
          </div>
        )}
        {user && (
          <>
            <TierBadge tier={user.tier} cancelAt={user.cancelAt} />
            {user.tier === 'FREE' && (
              <button
                onClick={() => openUpgradeCheckout(user.id)}
                className='hidden sm:inline-flex rounded-md bg-[#316dca] px-3 py-1 font-mono text-xs font-medium text-white transition-colors hover:bg-[#2b5faf]'
              >
                Upgrade
              </button>
            )}
            {user.avatarUrl && (
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={24}
                height={24}
                className='h-6 w-6 rounded-full'
              />
            )}
            <span className='font-mono text-xs text-[#768390] hidden sm:inline'>
              {user.username}
            </span>
          </>
        )}
      </div>
    </header>
  );
}

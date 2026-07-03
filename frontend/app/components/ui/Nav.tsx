'use client';
import { useChat } from '@/app/hooks/useChat';
import { useRepo } from '@/app/hooks/useRepo';
import Link from 'next/link';
import { StatusBar } from '../repo/StatusBar';

export default function Nav() {
  const { repo, reset } = useRepo();
  const { clear } = useChat(repo?.id ?? null);

  function handleReset() {
    reset();
    clear();
  }

  return (
    <header className='border-b border-[#2d333b] px-6 py-4 flex items-center gap-4 bg-[#080c10] text-[#cdd9e5]'>
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

      {repo && (
        <div className='ml-auto'>
          <StatusBar repo={repo} onReset={handleReset} />
        </div>
      )}
    </header>
  );
}

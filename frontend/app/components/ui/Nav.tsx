'use client';
import { useRepoStore } from '../../store/useRepoStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StatusBar } from '../repo/StatusBar';
import Link from 'next/link';
import Image from 'next/image';

export default function Nav() {
  const repo = useRepoStore((s) => s.repo);
  const reset = useRepoStore((s) => s.reset);
  const clear = useChatStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

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

      <div className='ml-auto flex items-center gap-3'>
        {repo && (
          <StatusBar
            repo={repo}
            onReset={() => {
              reset();
              clear();
            }}
          />
        )}
        {user && (
          <>
            {user.avatarUrl && (
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={24}
                height={24}
                className='h-6 w-6 rounded-full'
              />
            )}
            <span className='font-mono text-xs text-[#768390]'>
              {user.username}
            </span>
          </>
        )}
      </div>
    </header>
  );
}

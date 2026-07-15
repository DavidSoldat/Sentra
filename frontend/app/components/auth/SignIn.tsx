'use client';

import { useAuthStore } from '../../store/useAuthStore';

export function SignInScreen() {
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;

  return (
    <div className='min-h-screen flex flex-col items-center justify-center gap-6 bg-[#080c10] text-[#cdd9e5] px-6'>
      <span className='font-mono text-2xl font-medium tracking-tight'>
        <span className='text-[#316dca]'>[</span>
        sentra
        <span className='text-[#316dca]'>]</span>
      </span>
      <p className='font-mono text-sm text-[#768390] max-w-sm text-center'>
        {sessionExpired
          ? 'Your session expired. Sign in again to continue.'
          : 'Sign in with GitHub to index repos, ask questions, and run PR reviews.'}
      </p>
      <a
        href={`${backendUrl}/oauth2/authorization/github`}
        className='flex items-center gap-2 rounded-md bg-[#21262d] border border-[#30363d] px-4 py-2 font-mono text-sm text-[#e6edf3] hover:bg-[#30363d] transition-colors'
      >
        Sign in with GitHub
      </a>
    </div>
  );
}

import { Repo, RepoStatus } from '@/app/types';

interface StatusBarProps {
  repo: Repo;
  onReset: () => void;
}

const STATUS_CONFIG: Record<
  RepoStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  PENDING: {
    label: 'queued',
    dotClass: 'bg-[#768390]',
    textClass: 'text-[#768390]',
  },
  INDEXING: {
    label: 'reading files…',
    dotClass: 'bg-[#d29922] animate-pulse',
    textClass: 'text-[#d29922]',
  },
  READY: {
    label: 'ready',
    dotClass: 'bg-[#3fb950]',
    textClass: 'text-[#3fb950]',
  },
  FAILED: {
    label: 'failed',
    dotClass: 'bg-[#f85149]',
    textClass: 'text-[#f85149]',
  },
};

export function StatusBar({ repo, onReset }: StatusBarProps) {
  const config = STATUS_CONFIG[repo.status];

  return (
    <div className='flex items-center gap-3 px-4 py-2.5 bg-[#0e1318] border border-[#2d333b] rounded-lg'>
      <span className={`shrink-0 w-2 h-2 rounded-full ${config.dotClass}`} />

      <span className='font-mono text-sm text-[#cdd9e5] font-medium truncate'>
        {repo.name}
      </span>

      <span className={`font-mono text-xs ${config.textClass} shrink-0`}>
        {config.label}
      </span>

      {repo.status === 'READY' && repo.indexedAt && (
        <span className='font-mono text-xs text-[#444c56] ml-1 shrink-0'>
          {new Date(repo.indexedAt).toLocaleTimeString()}
        </span>
      )}

      <button
        onClick={onReset}
        className='ml-auto font-mono text-xs text-[#444c56] hover:text-[#768390] transition-colors cursor-pointer shrink-0'
      >
        ✕
      </button>
    </div>
  );
}

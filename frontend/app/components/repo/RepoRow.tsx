'use client';

import { useEffect, useRef, useState } from 'react';
import { Repo, RepoStatus } from '../../types';

const STATUS_DOT: Record<RepoStatus, string> = {
  PENDING: 'bg-[#768390] animate-pulse',
  INDEXING: 'bg-[#d29922] animate-pulse',
  READY: 'bg-[#3fb950]',
  FAILED: 'bg-[#f85149]',
};

const LONG_PRESS_MS = 450;

interface RepoRowProps {
  repo: Repo;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function RepoRow({ repo, isActive, onSelect, onDelete }: RepoRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function startLongPress() {
    pressTimer.current = setTimeout(() => setMenuOpen(true), LONG_PRESS_MS);
  }
  function cancelLongPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function handleDelete() {
    setMenuOpen(false);
    if (
      window.confirm(
        `Delete "${repo.name}"? This removes its chat history and reviews too.`,
      )
    ) {
      onDelete();
    }
  }

  return (
    <div className='group relative'>
      <button
        onClick={onSelect}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        className={`w-full flex items-center gap-2 rounded-md pl-2 pr-8 py-2 text-left transition-colors ${
          isActive
            ? 'bg-[#161b22] text-[#e6edf3]'
            : 'text-[#768390] hover:bg-[#161b22] hover:text-[#cdd9e5]'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[repo.status]}`}
        />
        <span className='font-mono text-xs truncate'>{repo.name}</span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        aria-label='Repo options'
        className='absolute right-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-[#6e7681] opacity-0 group-hover:opacity-100 hover:bg-[#21262d] hover:text-[#cdd9e5] md:opacity-0'
      >
        <svg viewBox='0 0 20 20' className='h-3.5 w-3.5' fill='currentColor'>
          <circle cx='4' cy='10' r='1.5' />
          <circle cx='10' cy='10' r='1.5' />
          <circle cx='16' cy='10' r='1.5' />
        </svg>
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          className='absolute right-1 top-full z-10 mt-1 w-32 rounded-md border border-[#2d333b] bg-[#0d1117] py-1 shadow-lg'
        >
          <button
            disabled
            title='Coming soon'
            className='w-full px-3 py-1.5 text-left font-mono text-xs text-[#484f58] cursor-not-allowed'
          >
            Rename
          </button>
          <button
            onClick={handleDelete}
            className='w-full px-3 py-1.5 text-left font-mono text-xs text-[#f85149] hover:bg-[#f85149]/10'
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

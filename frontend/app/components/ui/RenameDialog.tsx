'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface RenameDialogProps {
  open: boolean;
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function RenameDialog({
  open,
  initialName,
  onConfirm,
  onCancel,
}: RenameDialogProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setName(initialName);
  }

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 255;
  const isUnchanged = trimmed === initialName;

  function handleSubmit() {
    if (!isValid || isUnchanged) return;
    onConfirm(trimmed);
  }

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='rename-dialog-title'
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4'
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='w-full max-w-sm rounded-lg border border-[#2d333b] bg-[#0d1117] p-5 shadow-xl'
      >
        <h2
          id='rename-dialog-title'
          className='font-mono text-sm font-medium text-[#e6edf3]'
        >
          Rename repository
        </h2>

        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          maxLength={255}
          className='mt-3 w-full rounded-md border border-[#2d333b] bg-[#0d1117] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] outline-none focus:border-[#316dca]'
        />

        <div className='mt-5 flex justify-end gap-2'>
          <button
            onClick={onCancel}
            className='rounded-md border border-[#2d333b] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] hover:bg-[#161b22]'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isUnchanged}
            className='rounded-md bg-[#316dca] px-3 py-1.5 font-mono text-xs font-medium text-white transition-colors hover:bg-[#2b5faf] disabled:cursor-not-allowed disabled:opacity-40'
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

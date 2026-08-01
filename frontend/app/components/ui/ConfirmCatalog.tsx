'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    confirmRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='confirm-dialog-title'
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4'
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='w-full max-w-sm rounded-lg border border-[#2d333b] bg-[#0d1117] p-5 shadow-xl'
      >
        <h2
          id='confirm-dialog-title'
          className='font-mono text-sm font-medium text-[#e6edf3]'
        >
          {title}
        </h2>
        <p className='mt-2 font-mono text-xs text-[#768390]'>{description}</p>

        <div className='mt-5 flex justify-end gap-2'>
          <button
            onClick={onCancel}
            className='rounded-md border border-[#2d333b] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] hover:bg-[#161b22]'
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
              danger
                ? 'bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/20 hover:bg-[#f85149]/20'
                : 'bg-[#316dca] text-white hover:bg-[#2b5faf]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

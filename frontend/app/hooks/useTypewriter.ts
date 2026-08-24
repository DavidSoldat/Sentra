import { useCallback, useEffect, useRef } from 'react';

const CHARS_PER_FRAME = 2;

export function useTypewriter(onUpdate: (text: string) => void) {
  const queueRef = useRef('');
  const revealedRef = useRef('');
  const frameRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    tickRef.current = () => {
      const queue = queueRef.current;
      if (queue.length === 0) {
        frameRef.current = null;
        return;
      }
      const next = queue.slice(0, CHARS_PER_FRAME);
      queueRef.current = queue.slice(CHARS_PER_FRAME);
      revealedRef.current = next;
      onUpdate(revealedRef.current);
      frameRef.current = requestAnimationFrame(() => tickRef.current());
    };
  });

  const push = useCallback((token: string) => {
    queueRef.current += token;
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => tickRef.current());
    }
  }, []);

  const reset = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    queueRef.current = '';
    revealedRef.current = '';
  }, []);

  return { push, reset };
}

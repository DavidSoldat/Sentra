import { ApiError } from './api';
import { notifyUnauthorized } from './authEvents';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface SseHandlers {
  onEvent: (eventName: string, data: string) => void;
}

export async function streamSSE(
  path: string,
  { onEvent }: SseHandlers,
): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let body: unknown = undefined;
    try {
      body = await res.json();
      if (body && typeof body === 'object' && 'message' in body) {
        message = (body as { message?: string }).message ?? message;
      }
    } catch {}

    if (res.status === 401) notifyUnauthorized();
    throw new ApiError(message, res.status, body);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new ApiError('No response body to stream');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      let eventName = 'message';
      const dataLines: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          let value = line.slice(5);
          if (value.startsWith(' ')) value = value.slice(1);
          dataLines.push(value);
        }
      }
      if (dataLines.length > 0) onEvent(eventName, dataLines.join('\n'));
    }
  }
}

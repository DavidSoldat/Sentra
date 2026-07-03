import { AskResponse, Repo } from '../types';
import { ReviewResponse, SubmitReviewRequest } from '../types/review';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  submitRepo: (url: string) =>
    request<Repo>('/api/repos', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  getRepo: (id: number) => request<Repo>(`/api/repos/${id}`),

  ask: (repoId: number, question: string) =>
    request<AskResponse>(`/api/repos/${repoId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};

export class ReviewApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ReviewApiError';
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {}
    throw new ReviewApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export async function submitReview(
  req: SubmitReviewRequest,
): Promise<ReviewResponse> {
  const res = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return handle<ReviewResponse>(res);
}

export async function getReview(id: number): Promise<ReviewResponse> {
  const res = await fetch(`${BASE_URL}/api/reviews/${id}`, {
    cache: 'no-store',
  });
  return handle<ReviewResponse>(res);
}

const PR_URL_PATTERN =
  /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+\/?$/;

export function isValidPrUrl(url: string): boolean {
  return PR_URL_PATTERN.test(url.trim());
}

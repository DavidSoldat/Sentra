import { AskResponse, QuestionResponse, Repo, User } from '../types';
import { ReviewResponse, SubmitReviewRequest } from '../types/review';
import { notifyUnauthorized } from './authEvents';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface QuotaExceededBody {
  error: 'quota_exceeded';
  resourceType: 'questions' | 'reviews';
  limit: number;
  resetsAt: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let body: unknown = undefined;
    try {
      body = await res.json();
      if (body && typeof body === 'object' && 'message' in body) {
        message = (body as { message?: string }).message ?? message;
      }
    } catch {}

    if (res.status === 401 && path !== '/api/auth/me') {
      notifyUnauthorized();
    }

    throw new ApiError(message, res.status, body);
  }
  if (res.status === 204) return undefined as T;
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

  listRepos: () => request<Repo[]>('/api/repos'),

  getPullRequests: async (repoId: number) => {
    const raw = await request<
      Array<{
        number: number;
        title: string;
        state: 'open' | 'closed';
        html_url: string;
        created_at: string;
      }>
    >(`/api/repos/${repoId}/pull-requests`);

    return raw.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      htmlUrl: pr.html_url,
      createdAt: pr.created_at,
    }));
  },

  getQuestions: (repoId: number) =>
    request<QuestionResponse[]>(`/api/repos/${repoId}/questions`),

  deleteRepo: (id: number) =>
    request<void>(`/api/repos/${id}`, { method: 'DELETE' }),

  getMe: () => request<User>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
};

export async function submitReview(
  req: SubmitReviewRequest,
): Promise<ReviewResponse> {
  return request<ReviewResponse>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function getReview(id: number): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/api/reviews/${id}`, {
    cache: 'no-store',
  });
}

export function isQuotaExceeded(
  e: unknown,
): e is ApiError & { body: QuotaExceededBody } {
  return (
    e instanceof ApiError &&
    e.status === 429 &&
    typeof e.body === 'object' &&
    e.body !== null &&
    (e.body as { error?: string }).error === 'quota_exceeded'
  );
}

const PR_URL_PATTERN =
  /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+\/?$/;

export function isValidPrUrl(url: string): boolean {
  return PR_URL_PATTERN.test(url.trim());
}

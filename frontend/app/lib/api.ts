import {
  AiModelOption,
  GitHubRepoPickerItem,
  QuestionResponse,
  Repo,
  User,
} from '../types';
import {
  ActivityFeed,
  AgentMessage,
  AgentType,
  PublicReviewResponse,
  ReviewResponse,
  ReviewSummary,
  SubmitReviewRequest,
} from '../types/review';
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

  listRepos: () => request<Repo[]>('/api/repos'),

  listGithubRepos: () => request<GitHubRepoPickerItem[]>('/api/github/repos'),

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
  getBillingPortalUrl: () => request<{ url: string }>('/api/billing/portal'),

  getQuestions: (repoId: number) =>
    request<QuestionResponse[]>(`/api/repos/${repoId}/questions`),

  deleteRepo: (id: number) =>
    request<void>(`/api/repos/${id}`, { method: 'DELETE' }),

  renameRepo: (id: number, name: string) =>
    request<Repo>(`/api/repos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  deleteAccount: () => request<void>('/api/auth/me', { method: 'DELETE' }),

  getUsage: () =>
    request<{
      questionsUsed: number;
      questionsLimit: number;
      reviewsUsed: number;
      reviewsLimit: number;
      periodStart: string;
      resetsAt: string;
    }>('/api/settings/usage'),

  getMe: () => request<User>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  getModels: () => request<AiModelOption[]>('/api/settings/models'),

  updateModelPreference: (preferredModel: string) =>
    request<void>('/api/settings/model', {
      method: 'PUT',
      body: JSON.stringify({ preferredModel }),
    }),

  getRepoReviews: (repoId: number) =>
    request<ReviewSummary[]>(`/api/repos/${repoId}/reviews`),

  getAgentMessages: (reviewId: number, agentType: AgentType) =>
    request<AgentMessage[]>(
      `/api/reviews/${reviewId}/agents/${agentType}/messages`,
    ),

  getActivity: () => request<ActivityFeed>('/api/activity'),

  markActivitySeen: () =>
    request<void>('/api/activity/mark-seen', { method: 'POST' }),

  shareReview: (id: number, confirm = false) =>
    request<ReviewResponse>(`/api/reviews/${id}/share?confirm=${confirm}`, {
      method: 'POST',
    }),

  unshareReview: (id: number) =>
    request<void>(`/api/reviews/${id}/share`, { method: 'DELETE' }),

  getPublicReview: (token: string) =>
    request<PublicReviewResponse>(`/api/public/reviews/${token}`),

  postAgentMessage: (
    reviewId: number,
    agentType: AgentType,
    question: string,
  ) =>
    request<AgentMessage[]>(
      `/api/reviews/${reviewId}/agents/${agentType}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ question }),
      },
    ),

  retryAgent: (reviewId: number, agentType: AgentType) =>
    request<ReviewResponse>(
      `/api/reviews/${reviewId}/agents/${agentType}/retry`,
      { method: 'POST' },
    ),
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

export async function postReviewToGithub(id: number): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/api/reviews/${id}/post-to-github`, {
    method: 'POST',
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

export function isPrivateRepoConfirmationRequired(
  e: unknown,
): e is ApiError & { body: { error: string } } {
  return (
    e instanceof ApiError &&
    e.status === 409 &&
    typeof e.body === 'object' &&
    e.body !== null &&
    (e.body as { error?: string }).error ===
      'private_repo_confirmation_required'
  );
}

export async function exportReviewMarkdown(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/reviews/${id}/export`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new ApiError(`Failed to export review (${res.status})`, res.status);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : `sentra-review-${id}.md`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

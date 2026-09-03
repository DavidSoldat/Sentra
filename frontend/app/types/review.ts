export type ReviewStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type AgentType = 'SECURITY' | 'ARCHITECTURE' | 'PERFORMANCE' | 'DOCS';

export type AgentResultStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export const AGENT_ORDER: AgentType[] = [
  'SECURITY',
  'ARCHITECTURE',
  'PERFORMANCE',
  'DOCS',
];

export interface AgentResult {
  agent: AgentType;
  status: AgentResultStatus;
  findings: string | null;
  severity: Severity | null;
  completedAt: string | null;
}

export interface ReviewResponse {
  id: number;
  prUrl: string;
  prTitle: string | null;
  prNumber: number;
  status: ReviewStatus;
  createdAt: string;
  completedAt: string | null;
  githubCommentUrl: string | null;
  shareToken: string | null;
  agents: AgentResult[];
}

export interface PublicReviewResponse {
  prUrl: string;
  prTitle: string | null;
  prNumber: number;
  status: ReviewStatus;
  completedAt: string | null;
  agents: AgentResult[];
}

export interface SubmitReviewRequest {
  repoId: number;
  prUrl: string;
}

export interface PullRequestSummary {
  number: number;
  title: string;
  state: 'open' | 'closed';
  htmlUrl: string;
  createdAt: string;
}

export interface ReviewSummary {
  id: number;
  prUrl: string;
  prTitle: string | null;
  prNumber: number;
  status: ReviewStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface ActivityItem {
  reviewId: number;
  repoId: number;
  repoName: string;
  prTitle: string | null;
  prNumber: number;
  prUrl: string;
  status: ReviewStatus;
  severity: Severity | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ActivityFeed {
  lastViewedAt: string | null;
  items: ActivityItem[];
}

export const AGENT_META: Record<
  AgentType,
  { label: string; icon: string; description: string }
> = {
  SECURITY: {
    label: 'Security',
    icon: '\u{1F512}',
    description: 'auth, injection, secrets, unsafe input handling',
  },
  ARCHITECTURE: {
    label: 'Architecture',
    icon: '\u{1F3D7}',
    description: 'coupling, layering, module boundaries',
  },
  PERFORMANCE: {
    label: 'Performance',
    icon: '\u26A1',
    description: 'N+1s, blocking calls, allocation hot paths',
  },
  DOCS: {
    label: 'Docs',
    icon: '\u{1F4DD}',
    description: 'comments, README drift, public API docs',
  },
};

export interface AgentMessage {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

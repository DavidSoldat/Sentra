export type RepoStatus = 'PENDING' | 'INDEXING' | 'READY' | 'FAILED';
export type AiModelId =
  | 'CLAUDE_HAIKU'
  | 'GPT_4O_MINI'
  | 'CLAUDE_SONNET'
  | 'GPT_4O';
export type ModelBand = 'EFFICIENT' | 'PREMIUM';

export interface Repo {
  id: number;
  url: string;
  name: string;
  status: RepoStatus;
  indexedAt: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
}

export interface QuestionResponse {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
}

export interface AiModelOption {
  id: AiModelId;
  displayName: string;
  provider: string;
  band: ModelBand;
}

export interface User {
  id: number;
  username: string;
  avatarUrl: string;
  tier: 'FREE' | 'PRO';
  cancelAt: string | null;
  preferredModel: AiModelId;
}

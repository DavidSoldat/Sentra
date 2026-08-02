export type RepoStatus = 'PENDING' | 'INDEXING' | 'READY' | 'FAILED';

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

export interface AskResponse {
  answer: string;
  sources: string[];
}

export interface QuestionResponse {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  avatarUrl: string;
  tier: 'FREE' | 'PRO';
  cancelAt: string | null;
}

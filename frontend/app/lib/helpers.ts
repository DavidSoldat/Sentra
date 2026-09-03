import { AgentResult, Severity } from '../types/review';

export const SEVERITY_STYLES: Record<Severity, string> = {
  HIGH: 'bg-[#3D1418] text-[#F85149] border-[#F85149]/40',
  MEDIUM: 'bg-[#3D2E12] text-[#D29922] border-[#D29922]/40',
  LOW: 'bg-[#0F2440] text-[#58A6FF] border-[#58A6FF]/40',
  NONE: 'bg-[#0F2B1C] text-[#3FB950] border-[#3FB950]/40',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'clear',
};

export function overallLabel(status?: string) {
  switch (status) {
    case 'RUNNING':
      return 'Agents are reviewing the diff…';
    case 'COMPLETED':
      return 'Review complete.';
    case 'FAILED':
      return 'Review failed to complete.';
    default:
      return '';
  }
}

export function overallSeverity(agents: AgentResult[]): Severity | null {
  const order: Severity[] = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];
  const done = agents.filter((a) => a.status === 'DONE' && a.severity);
  for (const level of order) {
    if (done.some((a) => a.severity === level)) return level;
  }
  return null;
}

import { AGENT_ORDER, AgentResult, AgentType } from '@/app/types/review';
import { AgentCard } from './AgentCard';


function placeholder(agent: AgentType): AgentResult {
  return { agent, status: "PENDING", findings: null, severity: null, completedAt: null };
}

export function AgentGrid({ agents }: { agents: AgentResult[] }) {
  const byType = new Map(agents.map((a) => [a.agent, a]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {AGENT_ORDER.map((type) => (
        <AgentCard key={type} result={byType.get(type) ?? placeholder(type)} />
      ))}
    </div>
  );
}
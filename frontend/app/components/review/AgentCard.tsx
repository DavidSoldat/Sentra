import { AGENT_META, AgentResult } from '@/app/types/review';
import { SeverityBadge } from './SeverityBadge';
import { FindingsText } from './FindIndexed';

function StatusDot({ status }: { status: AgentResult['status'] }) {
  if (status === 'RUNNING') {
    return (
      <span className='relative flex h-2 w-2'>
        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D29922] opacity-75' />
        <span className='relative inline-flex h-2 w-2 rounded-full bg-[#D29922]' />
      </span>
    );
  }
  if (status === 'DONE') {
    return <span className='h-2 w-2 rounded-full bg-[#3FB950]' />;
  }
  if (status === 'FAILED') {
    return <span className='h-2 w-2 rounded-full bg-[#F85149]' />;
  }
  return <span className='h-2 w-2 rounded-full bg-[#30363D]' />;
}

function statusLabel(status: AgentResult['status']) {
  switch (status) {
    case 'PENDING':
      return 'queued';
    case 'RUNNING':
      return 'reviewing…';
    case 'DONE':
      return 'done';
    case 'FAILED':
      return 'failed';
  }
}

export function AgentCard({ result }: { result: AgentResult }) {
  const meta = AGENT_META[result.agent];
  const isEmpty = result.status === 'PENDING';

  return (
    <div
      className={`flex flex-col rounded-lg border bg-[#0D1117] md:max-h-120 transition-colors duration-300 ${
        result.status === 'FAILED' ? 'border-[#F85149]/40' : 'border-[#21262D]'
      }`}
    >
      <div className='flex items-center justify-between border-b border-[#21262D] px-4 py-3'>
        <div className='flex items-center gap-2 font-mono text-sm text-[#E6EDF3]'>
          <span aria-hidden>{meta.icon}</span>
          <span>{meta.label}</span>
        </div>
        {result.status === 'DONE' && result.severity ? (
          <SeverityBadge severity={result.severity} />
        ) : (
          <div className='flex items-center gap-1.5 font-mono text-[11px] text-[#6E7681]'>
            <StatusDot status={result.status} />
            {statusLabel(result.status)}
          </div>
        )}
      </div>

      <div className='px-4 py-3 min-h-24 md:overflow-y-auto flex-1'>
        {isEmpty && (
          <p className='font-mono text-[13px] text-[#6E7681]'>
            waiting on {meta.description}…
          </p>
        )}

        {result.status === 'RUNNING' && (
          <p className='font-mono text-[13px] text-[#6E7681]'>
            scanning for {meta.description}…
          </p>
        )}

        {result.status === 'FAILED' && (
          <p className='font-mono text-[13px] text-[#F85149]'>
            This agent hit an error and didn&apos;t finish. The other agents
            aren&apos;t affected.
          </p>
        )}

        {result.status === 'DONE' &&
          (result.findings ? (
            <FindingsText text={result.findings} />
          ) : (
            <p className='font-mono text-[13px] text-[#6E7681]'>
              No findings — clean pass.
            </p>
          ))}
      </div>
    </div>
  );
}

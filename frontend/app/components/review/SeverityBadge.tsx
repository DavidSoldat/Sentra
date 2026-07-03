import { SEVERITY_LABEL, SEVERITY_STYLES } from '@/app/lib/helpers';
import { Severity } from '@/app/types/review';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] uppercase tracking-wider font-mono ${SEVERITY_STYLES[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

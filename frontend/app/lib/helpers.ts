import { Severity } from '../types/review';

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

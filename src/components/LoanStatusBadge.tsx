import { LOAN_STATUSES } from '@/lib/constants';
import type { LoanStatus } from '@/lib/types';

export default function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const s = LOAN_STATUSES.find(ls => ls.value === status);
  if (!s) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      {s.label}
    </span>
  );
}

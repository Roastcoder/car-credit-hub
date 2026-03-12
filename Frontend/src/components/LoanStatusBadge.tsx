import { LoanStatus, LOAN_STATUSES } from '@/lib/mock-data';

export default function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const s = LOAN_STATUSES.find(ls => ls.value === status);
  if (!s) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      {s.label}
    </span>
  );
}

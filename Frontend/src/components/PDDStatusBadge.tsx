type PDDStatus = 'pending' | 'pending_approval' | 'approved' | 'rejected' | string | undefined;

const PDD_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
};

const formatLabel = (status?: PDDStatus) => {
  if (!status) return 'PDD Pending';
  return `PDD ${String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`;
};

export default function PDDStatusBadge({ status }: { status?: PDDStatus }) {
  const badgeClass = PDD_STATUS_STYLES[String(status || 'pending')] || PDD_STATUS_STYLES.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
      {formatLabel(status)}
    </span>
  );
}

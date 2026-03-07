import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const statusIcon = (status: string) => {
  if (status === 'completed') return <CheckCircle2 size={16} className="text-success" />;
  if (status === 'overdue') return <AlertTriangle size={16} className="text-destructive" />;
  return <Clock size={16} className="text-warning" />;
};

export default function PDDTracking() {
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['pdd-loans'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans?status=disbursed`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) return [];
      return await response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">PDD Tracking</h1>
      <p className="text-sm text-muted-foreground mb-6">Post Disbursement Documents status</p>

      <div className="space-y-4">
        {loans.length === 0 ? (
          <div className="stat-card text-center py-8 text-muted-foreground">
            No disbursed loans found
          </div>
        ) : (
          loans.map((loan: any) => {
            const docs = [
              { name: 'RC Copy', status: loan.rc_front ? 'completed' : 'pending' },
              { name: 'Insurance Copy', status: loan.insurance ? 'completed' : 'pending' },
              { name: 'NACH', status: loan.cheque ? 'completed' : 'pending' },
              { name: 'Bank Statement', status: loan.bank_statement ? 'completed' : 'pending' },
              { name: 'Income Proof', status: loan.income_proof ? 'completed' : 'pending' },
            ];
            
            return (
              <div key={loan.id} className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="mono text-xs text-accent font-medium">{loan.loan_number}</span>
                    <p className="font-medium text-foreground">{loan.applicant_name}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {docs.filter(d => d.status === 'completed').length}/{docs.length} completed
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {docs.map(doc => (
                    <div key={doc.name} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      {statusIcon(doc.status)}
                      <span className="text-sm text-foreground">{doc.name}</span>
                      <span className={`ml-auto text-xs font-medium capitalize ${
                        doc.status === 'completed' ? 'text-success' : 'text-warning'
                      }`}>{doc.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

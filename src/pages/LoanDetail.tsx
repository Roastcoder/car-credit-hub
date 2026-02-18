import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_LOANS, formatCurrency, LOAN_STATUSES } from '@/lib/mock-data';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import { ArrowLeft, User, Car, IndianRupee, Building2, Calendar, FileText } from 'lucide-react';

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loan = MOCK_LOANS.find(l => l.id === id);

  if (!loan) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Loan not found</p>
        <button onClick={() => navigate('/loans')} className="mt-4 text-accent hover:underline text-sm">← Back to loans</button>
      </div>
    );
  }

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accent">{icon}</span>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );

  // Status timeline
  const currentIdx = LOAN_STATUSES.findIndex(s => s.value === loan.status);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/loans')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Applications
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{loan.id}</h1>
            <LoanStatusBadge status={loan.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{loan.applicantName} • {loan.carMake} {loan.carModel}</p>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="stat-card mb-6 overflow-x-auto">
        <h3 className="font-semibold text-foreground mb-4">Status Pipeline</h3>
        <div className="flex items-center gap-1 min-w-max">
          {LOAN_STATUSES.filter(s => s.value !== 'cancelled').map((s, i) => {
            const isActive = i <= currentIdx && loan.status !== 'rejected' && loan.status !== 'cancelled';
            const isCurrent = s.value === loan.status;
            return (
              <div key={s.value} className="flex items-center gap-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent ? 'bg-accent text-accent-foreground' : isActive ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-accent-foreground' : isActive ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                  {s.label}
                </div>
                {i < LOAN_STATUSES.length - 2 && (
                  <div className={`w-6 h-0.5 ${isActive && i < currentIdx ? 'bg-accent' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Applicant Details" icon={<User size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" value={loan.applicantName} />
            <Field label="Mobile" value={loan.mobile} />
            <Field label="PAN" value={loan.pan} />
            <Field label="Aadhaar" value={loan.aadhaar} />
            <div className="col-span-2"><Field label="Address" value={loan.address} /></div>
          </div>
        </Section>

        <Section title="Car Details" icon={<Car size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Make" value={loan.carMake} />
            <Field label="Model" value={loan.carModel} />
            <Field label="Variant" value={loan.carVariant} />
            <Field label="On-Road Price" value={formatCurrency(loan.onRoadPrice)} />
            <Field label="Dealer" value={loan.dealerName} />
          </div>
        </Section>

        <Section title="Loan Details" icon={<IndianRupee size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Loan Amount" value={formatCurrency(loan.loanAmount)} />
            <Field label="Down Payment" value={formatCurrency(loan.downPayment)} />
            <Field label="Tenure" value={`${loan.tenure} months`} />
            <Field label="Interest Rate" value={`${loan.interestRate}%`} />
            <Field label="Monthly EMI" value={formatCurrency(loan.emi)} />
          </div>
        </Section>

        <Section title="Assignment & Dates" icon={<Building2 size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assigned Bank" value={loan.assignedBank} />
            <Field label="Assigned Broker" value={loan.assignedBroker} />
            <Field label="Created" value={loan.createdAt} />
            <Field label="Last Updated" value={loan.updatedAt} />
          </div>
        </Section>
      </div>
    </div>
  );
}

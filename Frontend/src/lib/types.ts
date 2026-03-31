export type LoanStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'disbursed'
  | 'sent_back'
  | 'rejected'
  | 'cancelled';

export type LoanStatusFilter = 'all' | 'draft' | 'under_review' | 'approved' | 'disbursed' | 'sent_back' | 'rejected' | 'cancelled';

export interface WorkflowAuditLog {
  id: string;
  loan_id: string;
  user_id: string;
  user_role: string;
  action: string;
  from_status: string;
  to_status: string;
  timestamp: string;
  remarks?: string;
}

export interface LoanApplication {
  id: string;
  loan_number?: string;
  application_id?: string;
  applicantName: string;
  mobile: string;
  pan: string;
  aadhaar: string;
  address: string;
  carMake: string;
  carModel: string;
  carVariant: string;
  onRoadPrice: number;
  dealerName: string;
  loanAmount: number;
  downPayment: number;
  tenure: number;
  interestRate: number;
  emi: number;
  status: LoanStatus;
  assignedBank: string;
  assignedBroker: string;
  fcAmount?: string;
  fcDate?: string;
  createdAt: string;
  updatedAt: string;
  created_by?: number;
  branch_id?: number;
  owner_role?: string;
}

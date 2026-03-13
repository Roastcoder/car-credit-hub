export type LoanStatus =
  | 'draft'
  | 'submitted'
  | 'manager_review'
  | 'manager_approved'
  | 'admin_approved'
  | 'disbursed'
  | 'sent_back_employee'
  | 'sent_back_manager'
  | 'sent_back_admin'
  | 'rejected'
  | 'cancelled'
  | 'under_review'
  | 'approved';

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
  createdAt: string;
  updatedAt: string;
  created_by?: number;
  branch_id?: number;
  owner_role?: string;
}

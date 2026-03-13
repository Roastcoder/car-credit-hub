export type LoanStatus = 'draft' | 'submitted' | 'manager_review' | 'manager_approved' | 'admin_approved' | 'disbursed' | 'sent_back_employee' | 'sent_back_manager' | 'sent_back_admin' | 'rejected' | 'cancelled' | 'under_review' | 'approved';

export const LOAN_STATUSES: { value: LoanStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'status-draft' },
  { value: 'submitted', label: 'Submitted', color: 'status-submitted' },
  { value: 'manager_review', label: 'Manager Review', color: 'status-review' },
  { value: 'manager_approved', label: 'Manager Approved', color: 'status-approved' },
  { value: 'admin_approved', label: 'Admin Approved', color: 'status-approved' },
  { value: 'disbursed', label: 'Disbursed', color: 'status-disbursed' },
  { value: 'sent_back_employee', label: 'Sent Back (Emp)', color: 'status-sent-back' },
  { value: 'sent_back_manager', label: 'Sent Back (Mgr)', color: 'status-sent-back' },
  { value: 'sent_back_admin', label: 'Sent Back (Adm)', color: 'status-sent-back' },
  { value: 'rejected', label: 'Rejected', color: 'status-rejected' },
  { value: 'cancelled', label: 'Cancelled', color: 'status-cancelled' },
  // Keep legacy for compatibility during migration
  { value: 'under_review', label: 'Under Review', color: 'status-review' },
  { value: 'approved', label: 'Approved', color: 'status-approved' },
];

// Workflow configuration with forward and back actions
export const WORKFLOW_CONFIG = {
  employee: {
    initialStatus: 'submitted',
    initialOwner: 'employee',
    canCreate: true,
    actions: [
      { action: 'send_to_manager', nextStatus: 'manager_review', nextOwner: 'manager', label: 'Send to Manager', type: 'forward' }
    ]
  },
  manager: {
    canCreate: false,
    actions: [
      { action: 'send_to_admin', nextStatus: 'manager_approved', nextOwner: 'admin', label: 'Send to Admin', type: 'forward' },
      { action: 'send_back_employee', nextStatus: 'sent_back_employee', nextOwner: 'employee', label: 'Send Back to Employee', type: 'back', requiresRemarks: true }
    ]
  },
  admin: {
    canCreate: false,
    actions: [
      { action: 'send_to_super_admin', nextStatus: 'admin_approved', nextOwner: 'super_admin', label: 'Send to Super Admin', type: 'forward' },
      { action: 'send_back_manager', nextStatus: 'sent_back_manager', nextOwner: 'manager', label: 'Send Back to Manager', type: 'back', requiresRemarks: true }
    ]
  },
  super_admin: {
    canCreate: false,
    actions: [
      { action: 'disburse', nextStatus: 'disbursed', nextOwner: 'super_admin', label: 'Disburse', type: 'approve' },
      { action: 'send_back_admin', nextStatus: 'sent_back_admin', nextOwner: 'admin', label: 'Send Back to Admin', type: 'back', requiresRemarks: true }
    ]
  }
};

// Status to owner role mapping
export const STATUS_OWNER_MAP: Record<LoanStatus, string> = {
  'draft': 'employee',
  'submitted': 'employee',
  'manager_review': 'manager',
  'manager_approved': 'admin',
  'admin_approved': 'super_admin',
  'disbursed': 'super_admin',
  'sent_back_employee': 'employee',
  'sent_back_manager': 'manager',
  'sent_back_admin': 'admin',
  'rejected': 'employee',
  'cancelled': 'employee',
  'under_review': 'manager',
  'approved': 'admin'
};

// Workflow steps for progress tracking
export const WORKFLOW_STEPS = [
  { status: 'submitted', label: 'Submitted', description: 'Application created by employee', role: 'Employee' },
  { status: 'manager_review', label: 'Under Review', description: 'Being reviewed by manager', role: 'Manager' },
  { status: 'manager_approved', label: 'Manager Approved', description: 'Approved by manager', role: 'Manager' },
  { status: 'admin_approved', label: 'Admin Approved', description: 'Approved by admin', role: 'Admin' },
  { status: 'disbursed', label: 'Disbursed', description: 'Final disbursement', role: 'Super Admin' }
];

// Workflow audit log interface
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

export const MOCK_LOANS: LoanApplication[] = [
  {
    id: 'CL-2025-001',
    loan_number: 'CL-2025-001',
    applicantName: 'Arjun Mehta',
    mobile: '9876543210',
    pan: 'ABCPM1234K',
    aadhaar: '1234-5678-9012',
    address: 'Mumbai, Maharashtra',
    carMake: 'Maruti Suzuki',
    carModel: 'Brezza',
    carVariant: 'ZXi+',
    onRoadPrice: 1450000,
    dealerName: 'Nexa Andheri',
    loanAmount: 1100000,
    downPayment: 350000,
    tenure: 60,
    interestRate: 8.5,
    emi: 22567,
    status: 'disbursed',
    assignedBank: 'HDFC Bank',
    assignedBroker: 'Vikram Singh',
    createdAt: '2025-01-15',
    updatedAt: '2025-02-10',
    owner_role: 'super_admin'
  },
  {
    id: 'CL-2025-002',
    loan_number: 'CL-2025-002',
    applicantName: 'Sneha Reddy',
    mobile: '9812345678',
    pan: 'DEFPR5678L',
    aadhaar: '2345-6789-0123',
    address: 'Hyderabad, Telangana',
    carMake: 'Hyundai',
    carModel: 'Creta',
    carVariant: 'SX(O)',
    onRoadPrice: 1850000,
    dealerName: 'Hyundai Jubilee Hills',
    loanAmount: 1400000,
    downPayment: 450000,
    tenure: 48,
    interestRate: 9.0,
    emi: 34839,
    status: 'approved',
    assignedBank: 'ICICI Bank',
    assignedBroker: 'Vikram Singh',
    createdAt: '2025-01-28',
    updatedAt: '2025-02-15',
    owner_role: 'admin'
  },
  {
    id: 'CL-2025-003',
    loan_number: 'CL-2025-003',
    applicantName: 'Rahul Joshi',
    mobile: '9988776655',
    pan: 'GHIJK9012M',
    aadhaar: '3456-7890-1234',
    address: 'Pune, Maharashtra',
    carMake: 'Tata',
    carModel: 'Nexon',
    carVariant: 'XZ+ Dark',
    onRoadPrice: 1350000,
    dealerName: 'Tata Motors Kothrud',
    loanAmount: 1000000,
    downPayment: 350000,
    tenure: 60,
    interestRate: 8.75,
    emi: 20625,
    status: 'under_review',
    assignedBank: 'SBI',
    assignedBroker: 'Vikram Singh',
    createdAt: '2025-02-05',
    updatedAt: '2025-02-12',
    owner_role: 'manager'
  },
  {
    id: 'CL-2025-004',
    loan_number: 'CL-2025-004',
    applicantName: 'Kavita Nair',
    mobile: '9654321098',
    pan: 'LMNOP3456N',
    aadhaar: '4567-8901-2345',
    address: 'Bangalore, Karnataka',
    carMake: 'Kia',
    carModel: 'Seltos',
    carVariant: 'HTX+',
    onRoadPrice: 1700000,
    dealerName: 'Kia Whitefield',
    loanAmount: 1300000,
    downPayment: 400000,
    tenure: 72,
    interestRate: 9.25,
    emi: 23471,
    status: 'submitted',
    assignedBank: 'Axis Bank',
    assignedBroker: 'Vikram Singh',
    createdAt: '2025-02-10',
    updatedAt: '2025-02-10',
    owner_role: 'employee'
  },
  {
    id: 'CL-2025-005',
    loan_number: 'CL-2025-005',
    applicantName: 'Deepak Verma',
    mobile: '9123456789',
    pan: 'QRSTU7890P',
    aadhaar: '5678-9012-3456',
    address: 'Delhi NCR',
    carMake: 'MG',
    carModel: 'Hector',
    carVariant: 'Sharp Pro',
    onRoadPrice: 2100000,
    dealerName: 'MG Dwarka',
    loanAmount: 1600000,
    downPayment: 500000,
    tenure: 60,
    interestRate: 8.9,
    emi: 33104,
    status: 'sent_back_employee',
    assignedBank: '',
    assignedBroker: 'Vikram Singh',
    createdAt: '2025-02-14',
    updatedAt: '2025-02-14',
    owner_role: 'employee'
  },
  {
    id: 'CL-2025-006',
    loan_number: 'CL-2025-006',
    applicantName: 'Pooja Desai',
    mobile: '9876512345',
    pan: 'VWXYZ1234Q',
    aadhaar: '6789-0123-4567',
    address: 'Ahmedabad, Gujarat',
    carMake: 'Toyota',
    carModel: 'Urban Cruiser Hyryder',
    carVariant: 'V Hybrid',
    onRoadPrice: 1920000,
    dealerName: 'Toyota SG Highway',
    loanAmount: 1500000,
    downPayment: 420000,
    tenure: 48,
    interestRate: 8.6,
    emi: 37092,
    status: 'approved',
    assignedBank: 'Kotak Mahindra Bank',
    assignedBroker: 'Vikram Singh',
    createdAt: '2025-01-20',
    updatedAt: '2025-02-08',
    owner_role: 'super_admin'
  },
];

export const BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra Bank', 'Yes Bank', 'IndusInd Bank', 'Bajaj Finserv'];

export const FINANCERS = [
  'Kogta Financial',
  'SK Finance', 
  'Cholamandalam Investment',
  'ITI Finance',
  'Singhi Finance',
  'HDB Finance',
  'MAS Finance',
  'Status Leasing Finance',
  'Sundram Finance',
  'Kisan Finance',
  'IKF Finance',
  'MMFSL',
  'AU Small Finance Bank',
  'Ambit Finvest',
  'Bajaj Finance',
  'Tata Capital',
  'Kotak Mahindra',
  'Kamal Finserve'
];

export const CAR_MAKES = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'MG', 'Toyota', 'Honda', 'Mahindra', 'Skoda', 'Volkswagen'];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function calculateEMI(principal: number, rate: number, tenure: number): number {
  const monthlyRate = rate / 12 / 100;
  if (monthlyRate === 0) return principal / tenure;
  return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1));
}

import type { LoanStatus } from './types';

export const LOAN_STATUSES: { value: LoanStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'status-draft' },
  { value: 'under_review', label: 'Under Review', color: 'status-review' },
  { value: 'approved', label: 'Approved', color: 'status-approved' },
  { value: 'disbursed', label: 'Disbursed', color: 'status-disbursed' },
  { value: 'sent_back', label: 'Sent Back', color: 'status-sent-back' },
  { value: 'rejected', label: 'Rejected', color: 'status-rejected' },
  { value: 'cancelled', label: 'Cancelled', color: 'status-cancelled' },
];

export const WORKFLOW_STEPS = [
  { status: 'submitted', label: 'Submitted', description: 'Application created by employee', role: 'Employee' },
  { status: 'under_review', label: 'Admin Review', description: 'Admin is reviewing application', role: 'Admin' },
  { status: 'approved', label: 'Approved', description: 'Ready for disbursement', role: 'Admin' },
  { status: 'disbursed', label: 'Disbursed', description: 'Final disbursement by Admin', role: 'Admin' },
];

export const WORKFLOW_CONFIG = {
  employee: {
    initialStatus: 'draft',
    initialOwner: 'employee',
    canCreate: true,
    actions: [
      { action: 'send_forward', nextStatus: 'under_review', nextOwner: 'admin', label: 'Submit to Admin', type: 'forward', requiresRemarks: true },
    ],
  },
  manager: {
    canCreate: true,
    actions: [],
  },
  admin: {
    canCreate: false,
    actions: [
      { action: 'approve', nextStatus: 'approved', nextOwner: 'admin', label: 'Approve', type: 'forward', requiresRemarks: true },
      { action: 'disburse', nextStatus: 'disbursed', nextOwner: 'admin', label: 'Mark as Disbursed', type: 'forward', requiresRemarks: true },
      { action: 'send_back', nextStatus: 'sent_back', nextOwner: 'employee', label: 'Send Back to Employee', type: 'back', requiresRemarks: true },
      { action: 'reject', nextStatus: 'rejected', nextOwner: 'employee', label: 'Reject Application', type: 'back', requiresRemarks: true },
    ],
  },
  super_admin: {
    canCreate: false,
    actions: [
      { action: 'disburse', nextStatus: 'disbursed', nextOwner: 'admin', label: 'Disburse', type: 'forward', requiresRemarks: true },
      { action: 'send_back', nextStatus: 'sent_back', nextOwner: 'employee', label: 'Send Back', type: 'back', requiresRemarks: true },
    ],
  },
};

export const STATUS_OWNER_MAP: Record<LoanStatus, string> = {
  draft: 'employee',
  under_review: 'admin',
  approved: 'admin',
  disbursed: 'admin',
  sent_back: 'employee',
  rejected: 'employee',
  cancelled: 'employee',
};

export const BANKS = [
  'HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra Bank',
  'Yes Bank', 'IndusInd Bank', 'Bajaj Finserv',
];

export const FINANCERS = [
  'Kogta Financial', 'SK Finance', 'Cholamandalam Investment', 'ITI Finance',
  'Singhi Finance', 'HDB Finance', 'MAS Finance', 'Status Leasing Finance',
  'Sundram Finance', 'Kisan Finance', 'IKF Finance', 'MMFSL',
  'AU Small Finance Bank', 'Ambit Finvest', 'Bajaj Finance', 'Tata Capital',
  'Kotak Mahindra', 'Kamal Finserve',
];

export const CAR_MAKES = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'MG', 'Toyota',
  'Honda', 'Mahindra', 'Skoda', 'Volkswagen',
];

export const VERTICALS = [
  'LCV', 'HCV', 'Car', 'Tractor', 'CE', 'Two Wheeler', 'Three Wheeler'
];

export const SCHEMES = [
  'Purchase', 'BT', 'Purchase & BT', 'Refinance', 'SHSV/SHOV'
];

export const LOAN_TYPES = [
  'New Vehicle Loan', 'Used Vehicle Loan'
];

export const INSURANCE_MADE_BY_OPTIONS = [
  'In House', 'Financier', 'Customer', 'Seller', 'By Me', 'Bank Recommended', 'Broker Recommended', 'Customer Choice'
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

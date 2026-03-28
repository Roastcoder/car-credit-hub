import type { LoanStatus } from './types';

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
  { value: 'under_review', label: 'Under Review', color: 'status-review' },
  { value: 'approved', label: 'Approved', color: 'status-approved' },
];

export const WORKFLOW_STEPS = [
  { status: 'submitted', label: 'Submitted', description: 'Application created by employee', role: 'Employee' },
  { status: 'manager_review', label: 'Under Review', description: 'Being reviewed by manager', role: 'Manager' },
  { status: 'manager_approved', label: 'Manager Approved', description: 'Approved by manager', role: 'Manager' },
  { status: 'admin_approved', label: 'Admin Approved', description: 'Approved by admin', role: 'Admin' },
  { status: 'disbursed', label: 'Disbursed', description: 'Final disbursement', role: 'Super Admin' },
];

export const WORKFLOW_CONFIG = {
  employee: {
    initialStatus: 'submitted',
    initialOwner: 'employee',
    canCreate: true,
    actions: [
      { action: 'send_forward', nextStatus: 'manager_review', nextOwner: 'manager', label: 'Send to Manager', type: 'forward', requiresRemarks: true },
    ],
  },
  manager: {
    canCreate: false,
    actions: [
      { action: 'send_forward', nextStatus: 'manager_approved', nextOwner: 'admin', label: 'Send to Admin', type: 'forward', requiresRemarks: true },
      { action: 'send_back', nextStatus: 'sent_back_employee', nextOwner: 'employee', label: 'Send Back to Employee', type: 'back', requiresRemarks: true },
    ],
  },
  admin: {
    canCreate: false,
    actions: [
      { action: 'send_forward', nextStatus: 'admin_approved', nextOwner: 'super_admin', label: 'Send to Super Admin', type: 'forward', requiresRemarks: true },
      { action: 'send_back', nextStatus: 'sent_back_manager', nextOwner: 'manager', label: 'Send Back to Manager', type: 'back', requiresRemarks: true },
    ],
  },
  super_admin: {
    canCreate: false,
    actions: [
      { action: 'disburse', nextStatus: 'disbursed', nextOwner: 'super_admin', label: 'Disburse', type: 'approve', requiresRemarks: true },
      { action: 'send_back', nextStatus: 'sent_back_admin', nextOwner: 'admin', label: 'Send Back to Admin', type: 'back', requiresRemarks: true },
    ],
  },
};

export const STATUS_OWNER_MAP: Record<LoanStatus, string> = {
  draft: 'employee',
  submitted: 'employee',
  manager_review: 'manager',
  manager_approved: 'admin',
  admin_approved: 'super_admin',
  disbursed: 'super_admin',
  sent_back_employee: 'employee',
  sent_back_manager: 'manager',
  sent_back_admin: 'admin',
  rejected: 'employee',
  cancelled: 'employee',
  under_review: 'manager',
  approved: 'admin',
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

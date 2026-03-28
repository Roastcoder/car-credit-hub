import { WORKFLOW_CONFIG, STATUS_OWNER_MAP } from './constants';
import type { LoanStatus, WorkflowAuditLog } from './types';

export interface WorkflowAction {
  action: string;
  nextStatus: LoanStatus;
  nextOwner: string;
  label: string;
  type?: string;
  requiresRemarks?: boolean;
}

export class WorkflowService {
  static getOwnerRole(status: LoanStatus): string {
    return STATUS_OWNER_MAP[status] || 'employee';
  }

  static getAvailableActions(userRole: string): WorkflowAction[] {
    const config = WORKFLOW_CONFIG[userRole as keyof typeof WORKFLOW_CONFIG];
    return (config?.actions as WorkflowAction[]) || [];
  }

  static canCreateLoan(userRole: string): boolean {
    const config = WORKFLOW_CONFIG[userRole as keyof typeof WORKFLOW_CONFIG];
    return config?.canCreate || false;
  }

  static getInitialStatus(): LoanStatus {
    return 'submitted';
  }

  static getInitialOwner(): string {
    return 'employee';
  }

  static canPerformAction(userRole: string, currentStatus: LoanStatus, action: string): boolean {
    const ownerRole = this.getOwnerRole(currentStatus);
    
    // Broaden authorization:
    // 1. Owners can always act.
    // 2. Super Admins can act at any stage.
    // 3. Managers can act on 'submitted' files (to pull/forward them).
    const isAuthorized = 
      userRole === ownerRole || 
      userRole === 'super_admin';

    if (!isAuthorized) return false;

    // Check if action is available for this role
    const availableActions = this.getAvailableActions(userRole);
    return availableActions.some(a => a.action === action);
  }

  static getNextStatusAndOwner(userRole: string, action: string): { status: LoanStatus; owner: string } | null {
    const availableActions = this.getAvailableActions(userRole);
    const actionConfig = availableActions.find(a => a.action === action);
    
    if (!actionConfig) return null;
    
    return {
      status: actionConfig.nextStatus,
      owner: actionConfig.nextOwner
    };
  }

  static async performWorkflowAction(
    loanId: string,
    userId: string,
    userRole: string,
    currentStatus: LoanStatus,
    action: string,
    remarks?: string
  ): Promise<{ success: boolean; newStatus?: LoanStatus; newOwner?: string; error?: string }> {
    try {
      // Validate action
      if (!this.canPerformAction(userRole, currentStatus, action)) {
        return { success: false, error: 'Action not allowed for current role and status' };
      }

      const result = this.getNextStatusAndOwner(userRole, action);
      if (!result) {
        return { success: false, error: 'Invalid action' };
      }

      // Log the workflow action
      const auditLog: WorkflowAuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        loan_id: loanId,
        user_id: userId,
        user_role: userRole,
        action,
        from_status: currentStatus,
        to_status: result.status,
        timestamp: new Date().toISOString(),
        remarks
      };

      // Store audit log
      this.storeAuditLog(auditLog);

      return { 
        success: true, 
        newStatus: result.status,
        newOwner: result.owner
      };
    } catch (error) {
      return { success: false, error: 'Failed to perform workflow action' };
    }
  }

  private static storeAuditLog(auditLog: WorkflowAuditLog): void {
    const existingLogs = JSON.parse(localStorage.getItem('workflow_audit_logs') || '[]');
    existingLogs.push(auditLog);
    localStorage.setItem('workflow_audit_logs', JSON.stringify(existingLogs));
  }

  static getAuditLogs(loanId?: string): WorkflowAuditLog[] {
    const rawLogs = localStorage.getItem('workflow_audit_logs');
    let logs: WorkflowAuditLog[] = [];
    try {
      logs = JSON.parse(rawLogs || '[]');
      if (!Array.isArray(logs)) logs = [];
    } catch (e) {
      logs = [];
    }
    return loanId ? logs.filter((log: WorkflowAuditLog) => log.loan_id === loanId) : logs;
  }

  static shouldShowLoanToUser(loan: any, userRole: string, currentUserId?: number | string, currentBranchId?: number | string): boolean {
    const ownerRole = this.getOwnerRole(loan.status);
    
    if (userRole === 'super_admin') return true;
    if (userRole === ownerRole) return true;

    // Brokers should see their assigned loans regardless of status
    if (userRole === 'broker' && currentUserId !== undefined) {
      const uid = Number(currentUserId);
      if (Number(loan.broker_id) === uid || Number(loan.assigned_broker_id) === uid) return true;
    }

    // Disbursed files still need to remain visible for creator and branch manager for PDD work.
    if (loan.status === 'disbursed') {
      if (userRole === 'employee' && currentUserId !== undefined && Number(loan.created_by) === Number(currentUserId)) return true;
      if (userRole === 'manager' && currentBranchId !== undefined && Number(loan.branch_id) === Number(currentBranchId)) return true;
      if (userRole === 'admin') return true;
    }
    
    // Check for sent back to this role
    if (loan.status?.startsWith('sent_back_')) {
      const sentBackRole = loan.status.replace('sent_back_', '');
      if (userRole === sentBackRole) return true;
    }
    
    // Also allow viewing if they have acted on it previously (audit logs) or if it is in their stage
    const visibleStatuses = this.getVisibleLoansForRole(userRole);
    if (visibleStatuses.includes(loan.status)) return true;

    return false;
  }

  static getVisibleLoansForRole(userRole: string): string[] {
    switch (userRole) {
      case 'employee':
        return ['draft', 'submitted', 'sent_back_employee', 'rejected', 'cancelled', 'disbursed'];
      case 'manager':
        return ['submitted', 'manager_review', 'under_review', 'sent_back_manager', 'disbursed'];
      case 'admin':
        return ['manager_approved', 'approved', 'sent_back_admin', 'disbursed'];
      case 'broker':
        // Broker sees all statuses for their assigned loans (handled in shouldShowLoanToUser)
        return ['submitted', 'manager_review', 'manager_approved', 'admin_approved', 'disbursed', 'sent_back_employee', 'sent_back_manager', 'sent_back_admin', 'under_review', 'approved'];
      case 'super_admin':
        return ['submitted', 'manager_review', 'manager_approved', 'admin_approved', 'disbursed', 'sent_back_employee', 'sent_back_manager', 'sent_back_admin', 'under_review', 'approved'];
      default:
        return [];
    }
  }

  static getNextLoanId(currentLoanId: string, loans: any[], userRole: string, currentUserId?: number | string, currentBranchId?: number | string): string | null {
    if (!Array.isArray(loans)) return null;
    const visibleLoans = loans.filter(loan => this.shouldShowLoanToUser(loan, userRole, currentUserId, currentBranchId));
    const currentIndex = visibleLoans.findIndex(loan => loan.id === currentLoanId || loan.loan_number === currentLoanId);
    
    if (currentIndex >= 0 && currentIndex < visibleLoans.length - 1) {
      return visibleLoans[currentIndex + 1].loan_number || visibleLoans[currentIndex + 1].id;
    }
    return null;
  }

  static getPreviousLoanId(currentLoanId: string, loans: any[], userRole: string, currentUserId?: number | string, currentBranchId?: number | string): string | null {
    if (!Array.isArray(loans)) return null;
    const visibleLoans = loans.filter(loan => this.shouldShowLoanToUser(loan, userRole, currentUserId, currentBranchId));
    const currentIndex = visibleLoans.findIndex(loan => loan.id === currentLoanId || loan.loan_number === currentLoanId);
    
    if (currentIndex > 0) {
      return visibleLoans[currentIndex - 1].loan_number || visibleLoans[currentIndex - 1].id;
    }
    return null;
  }

  static getWorkflowSteps(): Array<{ status: LoanStatus; label: string; role: string }> {
    return [
      { status: 'submitted', label: 'Submitted', role: 'Employee' },
      { status: 'manager_review', label: 'Under Review', role: 'Manager' },
      { status: 'manager_approved', label: 'Manager Approved', role: 'Admin' },
      { status: 'admin_approved', label: 'Admin Approved', role: 'Super Admin' },
      { status: 'disbursed', label: 'Disbursed', role: 'Complete' }
    ];
  }

  static getStatusProgress(currentStatus: LoanStatus): number {
    const progressMap: Record<LoanStatus, number> = {
      'draft': 5,
      'submitted': 20,
      'manager_review': 40,
      'manager_approved': 60,
      'admin_approved': 80,
      'disbursed': 100,
      'sent_back_employee': 15,
      'sent_back_manager': 35,
      'sent_back_admin': 55,
      'rejected': 0,
      'cancelled': 0,
      'under_review': 40,
      'approved': 60
    };
    
    return progressMap[currentStatus] || 0;
  }

  static canEditLoan(userRole: string, loanStatus: LoanStatus): boolean {
    const ownerRole = this.getOwnerRole(loanStatus);
    
    // Allow edit if:
    // 1. User is the current owner
    // 2. AND (Status is NOT disburse/rejected/cancelled)
    
    const terminalStatuses = ['disbursed', 'rejected', 'cancelled'];
    if (terminalStatuses.includes(loanStatus)) return false;
    
    return userRole === ownerRole;
  }
}

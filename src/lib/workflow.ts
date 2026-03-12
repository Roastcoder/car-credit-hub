import { WORKFLOW_CONFIG, LoanStatus, WorkflowAuditLog, STATUS_OWNER_MAP } from './mock-data';

export interface WorkflowAction {
  action: string;
  nextStatus: LoanStatus;
  nextOwner: string;
  label: string;
}

export class WorkflowService {
  static getOwnerRole(status: LoanStatus): string {
    return STATUS_OWNER_MAP[status] || 'employee';
  }

  static getAvailableActions(userRole: string): WorkflowAction[] {
    const config = WORKFLOW_CONFIG[userRole as keyof typeof WORKFLOW_CONFIG];
    return config?.actions || [];
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
    // Check if current user is the owner of the loan
    const ownerRole = this.getOwnerRole(currentStatus);
    if (userRole !== ownerRole) {
      return false;
    }

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
    const logs = JSON.parse(localStorage.getItem('workflow_audit_logs') || '[]');
    return loanId ? logs.filter((log: WorkflowAuditLog) => log.loan_id === loanId) : logs;
  }

  static shouldShowLoanToUser(loan: any, userRole: string): boolean {
    // Get the owner role based on current status
    const ownerRole = this.getOwnerRole(loan.status);
    
    // Only show loan if user role matches owner role
    return userRole === ownerRole;
  }

  static getWorkflowSteps(): Array<{ status: LoanStatus; label: string; role: string }> {
    return [
      { status: 'submitted', label: 'Submitted', role: 'Employee' },
      { status: 'manager_review', label: 'Manager Review', role: 'Manager' },
      { status: 'manager_approved', label: 'Manager Approved', role: 'Admin' },
      { status: 'admin_approved', label: 'Admin Approved', role: 'Super Admin' },
      { status: 'disbursed', label: 'Disbursed', role: 'Super Admin' }
    ];
  }

  static getStatusProgress(currentStatus: LoanStatus): number {
    const progressMap: Record<LoanStatus, number> = {
      'submitted': 20,
      'manager_review': 40,
      'manager_approved': 60,
      'admin_approved': 80,
      'disbursed': 100,
      'sent_back_employee': 10,
      'sent_back_manager': 30,
      'sent_back_admin': 50,
      'rejected': 0,
      'cancelled': 0
    };
    
    return progressMap[currentStatus] || 0;
  }

  static canEditLoan(userRole: string, loanStatus: LoanStatus): boolean {
    const ownerRole = this.getOwnerRole(loanStatus);
    return userRole === ownerRole && userRole === 'employee';
  }
}
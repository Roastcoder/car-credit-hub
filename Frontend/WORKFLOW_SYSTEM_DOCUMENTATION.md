# Ownership-Based Loan Workflow System

## Overview
A comprehensive role-based loan workflow system where loan files are only visible to the current workflow owner, ensuring proper access control and workflow management.

## System Roles
1. **Employee** - Creates loan applications
2. **Manager** - Reviews and approves/rejects employee submissions
3. **Admin** - Reviews manager-approved loans
4. **Super Admin** - Final approval and disbursement

## Workflow States & Ownership

### 1. Employee Stage
- **Status**: `submitted`
- **Owner**: `employee`
- **Actions**: 
  - Create loan application
  - Send to Manager (`send_to_manager` → `manager_review`)
- **Visibility**: Only sees loans they created with status `submitted` or `sent_back_employee`

### 2. Manager Stage
- **Status**: `manager_review`
- **Owner**: `manager`
- **Actions**:
  - Approve (`approve` → `manager_approved`, owner becomes `admin`)
  - Send Back (`send_back` → `sent_back_employee`, owner becomes `employee`)
- **Visibility**: Only sees loans with status `manager_review` or `sent_back_manager`

### 3. Admin Stage
- **Status**: `manager_approved`
- **Owner**: `admin`
- **Actions**:
  - Approve (`approve` → `admin_approved`, owner becomes `super_admin`)
  - Send Back (`send_back` → `sent_back_manager`, owner becomes `manager`)
- **Visibility**: Only sees loans with status `manager_approved` or `sent_back_admin`

### 4. Super Admin Stage
- **Status**: `admin_approved`
- **Owner**: `super_admin`
- **Actions**:
  - Disburse (`approve` → `disbursed`)
  - Send Back (`send_back` → `sent_back_admin`, owner becomes `admin`)
- **Visibility**: Only sees loans with status `admin_approved` or `disbursed`

## Database Schema Changes

### Loans Table Updates
```sql
-- Add owner_role column
ALTER TABLE loans ADD COLUMN owner_role VARCHAR(20) DEFAULT 'employee';

-- Update status constraint to include new workflow statuses
ALTER TABLE loans DROP CONSTRAINT loans_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_status_check 
CHECK (status::text = ANY (ARRAY[
  'submitted', 'manager_review', 'manager_approved', 'admin_approved', 
  'disbursed', 'sent_back_employee', 'sent_back_manager', 'sent_back_admin',
  'rejected', 'cancelled', 'closed', 'pending', 'draft'
]::text[]));
```

### Workflow History Table
```sql
CREATE TABLE loan_workflow_history (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  remarks TEXT,
  performed_by INTEGER NOT NULL REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  from_role VARCHAR(20),
  to_role VARCHAR(20)
);
```

## Backend Implementation

### Updated Loan Controller
- **Ownership-based filtering**: `getAllLoans()` filters loans based on user role and ownership
- **Access control**: `getLoanById()` checks ownership before returning loan data
- **Workflow actions**: `performWorkflowAction()` handles state transitions with validation
- **Audit logging**: All workflow actions are logged in `loan_workflow_history`

### New API Endpoints
- `POST /loans/:id/workflow` - Perform workflow actions
- `GET /loans/:id/audit-logs` - Get workflow history for a loan

### Workflow Configuration
```javascript
const WORKFLOW_CONFIG = {
  employee: {
    initialStatus: 'submitted',
    initialOwner: 'employee',
    canCreate: true,
    actions: [
      { action: 'send_to_manager', nextStatus: 'manager_review', nextOwner: 'manager' }
    ]
  },
  manager: {
    actions: [
      { action: 'approve', nextStatus: 'manager_approved', nextOwner: 'admin' },
      { action: 'send_back', nextStatus: 'sent_back_employee', nextOwner: 'employee' }
    ]
  },
  // ... similar for admin and super_admin
};
```

## Frontend Implementation

### WorkflowService
- **Ownership validation**: `shouldShowLoanToUser()` determines loan visibility
- **Action validation**: `canPerformAction()` checks if user can perform specific actions
- **Status mapping**: `getOwnerRole()` maps status to owner role

### WorkflowActions Component
- Dynamic action buttons based on user role and current status
- Remarks modal for send-back actions
- Integration with new API endpoints

### Updated Filtering
- Loans page now filters based on ownership using `WorkflowService`
- Only shows loans where user is the current owner

## Key Features

### 1. Strict Ownership Control
- Users can only see loans they currently own
- Ownership transfers automatically with workflow actions
- No cross-role visibility

### 2. Complete Audit Trail
- All workflow actions logged with user, timestamp, and remarks
- Full history of status changes and ownership transfers
- Audit logs accessible via API

### 3. Role-based Actions
- Each role has specific actions available
- Actions automatically determine next status and owner
- Validation prevents unauthorized actions

### 4. Seamless Integration
- Backward compatible with existing loan management
- Mock data support for development
- Real-time updates with React Query

## Configuration Files Updated

### Database
- `.env` - Updated with PostgreSQL connection string
- `workflow_migration.js` - Database migration script
- `src/config/database.js` - Connection configuration

### Frontend
- `src/lib/mock-data.ts` - Updated loan statuses and workflow config
- `src/lib/workflow.ts` - Workflow service implementation
- `src/lib/api.ts` - API endpoints and mock data handling
- `src/components/WorkflowActions.tsx` - Workflow action buttons
- `src/pages/Loans.tsx` - Updated filtering logic

### Backend
- `src/controllers/loanController.js` - Ownership-based filtering and workflow actions
- `src/routes/loans.js` - New workflow endpoints
- `migrations/add_ownership_workflow.sql` - Database schema updates

## Usage Examples

### Creating a Loan (Employee)
```javascript
// Loan is created with status='submitted' and owner_role='employee'
const newLoan = await loansAPI.create(loanData);
```

### Sending to Manager (Employee)
```javascript
// Changes status to 'manager_review' and owner_role to 'manager'
await loansAPI.performWorkflowAction(loanId, 'send_to_manager');
```

### Manager Approval
```javascript
// Changes status to 'manager_approved' and owner_role to 'admin'
await loansAPI.performWorkflowAction(loanId, 'approve');
```

### Send Back with Remarks
```javascript
// Changes status to 'sent_back_employee' and owner_role to 'employee'
await loansAPI.performWorkflowAction(loanId, 'send_back', 'Please provide additional documents');
```

## Security Benefits
- **Data Isolation**: Users only see relevant loans
- **Access Control**: Role-based action permissions
- **Audit Compliance**: Complete workflow history
- **State Validation**: Prevents invalid status transitions

## Migration Status
✅ Database schema updated
✅ Backend controllers implemented
✅ Frontend components updated
✅ API endpoints configured
✅ Mock data support added
✅ Workflow validation implemented

The system is now fully operational with ownership-based visibility and workflow management.
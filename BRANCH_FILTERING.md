# Branch-Wise Filtering Implementation

## Overview
Implemented a complete branch-wise filtering system where:
- All users are assigned to specific branches
- All loan applications are filtered by branch
- Each branch has different employees
- Only admins can see data across all branches

## Changes Made

### 1. Database Migration (`20260222000000_add_branch_filtering.sql`)
- Added `branch_id` column to `profiles` table
- Added `branch_id` column to `loans` table
- Created indexes for better query performance
- Updated RLS policies to filter by branch:
  - Users can only see profiles from their branch (except admins)
  - Users can only see loans from their branch (except admins)
  - Loans automatically inherit branch_id from creator
- Added trigger to auto-assign branch_id when creating loans

### 2. Authentication Context (`AuthContext.tsx`)
- Added `branch_id` field to `AppUser` interface
- Updated user profile fetching to include branch information

### 3. Dashboard (`Dashboard.tsx`)
- Filters loans by user's branch (unless admin)
- Displays branch name and code in header
- Shows branch-specific statistics

### 4. Loans Page (`Loans.tsx`)
- Filters loan applications by branch
- Only shows loans from user's assigned branch
- Admins can see all loans across branches

### 5. User Management (`UserManagement.tsx`)
- Filters users by branch
- Displays branch information in user table
- Only shows users from same branch (unless admin)

### 6. Role Assignment Modal (`RoleAssignModal.tsx`)
- Added branch selection dropdown
- Allows assigning users to specific branches
- Loads active branches from database
- Updates both role and branch assignment

### 7. Branch Management (`BranchManagement.tsx`)
- Already exists - manages branch creation and editing
- Branches have: name, code, address, manager, etc.

## How It Works

### For Regular Users (Employee, Manager, Broker, Bank)
- Can only see users and loans from their assigned branch
- Cannot access data from other branches
- Branch is automatically assigned to new loans they create

### For Admins (Admin, Super Admin)
- Can see all users and loans across all branches
- Can assign users to any branch
- Can manage all branches

### Branch Assignment Flow
1. Super Admin creates branches via Branch Management
2. Super Admin assigns users to branches via User Management
3. When users create loans, branch_id is automatically set
4. All queries filter by branch_id based on user's role

## Database Schema

### profiles table
```sql
- id (UUID, PK)
- branch_id (UUID, FK to branches)
- full_name, email, phone, etc.
```

### loans table
```sql
- id (TEXT, PK)
- branch_id (UUID, FK to branches)
- applicant_name, loan_amount, etc.
```

### branches table
```sql
- id (UUID, PK)
- name, code, address
- city, state, pincode
- manager_name, phone, email
- is_active (boolean)
```

## Security

### Row Level Security (RLS)
- Profiles: Users can only view profiles from their branch
- Loans: Users can only view loans from their branch
- Admins bypass all branch restrictions
- Automatic branch assignment prevents cross-branch data leaks

### Triggers
- `set_loan_branch_id`: Automatically assigns creator's branch to new loans
- Prevents manual branch_id manipulation

## Testing

To test the implementation:
1. Run the migration: `supabase db push`
2. Create multiple branches via Branch Management
3. Assign users to different branches via User Management
4. Login as different users and verify they only see their branch data
5. Login as admin and verify they see all data

## Future Enhancements
- Branch-wise reports and analytics
- Branch transfer functionality
- Branch-wise commission tracking
- Multi-branch user support (if needed)

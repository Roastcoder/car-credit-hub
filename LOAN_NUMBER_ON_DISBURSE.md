# Final Implementation: Loan Number Generation on Disburse

## Overview
Loan numbers are generated automatically when a loan's status changes to **"disbursed"** based on the **Financier Team Vertical** selection.

## Key Features

### 1. Financier Team Vertical Dropdown
- **Options**: LCV, HCV, Car, Tractor, CE
- **User Selection**: Required field in loan form
- **Purpose**: Determines the loan number prefix when disbursed

### 2. Loan Number Generation
- **Trigger**: When loan status changes to "disbursed"
- **Format**: `MEH{VERTICAL}{NUMBER}` 
- **Examples**:
  - Car: `MEHCAR0001`, `MEHCAR0002`, `MEHCAR0003`...
  - LCV: `MEHLCV0001`, `MEHLCV0002`, `MEHLCV0003`...
  - HCV: `MEHHCV0001`, `MEHHCV0002`, `MEHHCV0003`...
  - Tractor: `MEHTRACTOR0001`, `MEHTRACTOR0002`...
  - CE: `MEHCE0001`, `MEHCE0002`, `MEHCE0003`...

### 3. Sequential Numbering
- Each vertical maintains its own number series
- Numbers continue sequentially within each vertical type
- No gaps in numbering

## Workflow Process

### Step 1: Loan Creation
- User fills loan form
- Selects **Financier Team Vertical** (LCV/HCV/Car/Tractor/CE)
- **Loan Number field**: Shows "Generated on disburse"
- Loan is created with temporary identifier

### Step 2: Loan Processing
- Loan goes through workflow stages:
  - submitted → manager_review → manager_approved → admin_approved
- **Loan Number**: Still empty during processing

### Step 3: Disburse Action
- When Super Admin clicks **"Disburse"**
- System automatically:
  1. Checks the loan's **Financier Team Vertical**
  2. Finds the last loan number for that vertical
  3. Generates next sequential number
  4. Updates loan status to "disbursed"
  5. Assigns the generated loan number

## Implementation Details

### Backend Changes

#### 1. Workflow Action (`performWorkflowAction`)
```javascript
// When status changes to 'disbursed'
if (newStatus === 'disbursed') {
  // Get loan's financier_team_vertical
  const vertical = currentLoan.financier_team_vertical;
  const prefix = vertical ? `MEH${vertical.toUpperCase()}` : 'MEH';
  
  // Find last loan number for this vertical
  // Generate next sequential number
  // Update loan with new number
}
```

#### 2. Database Query
```sql
SELECT loan_number FROM loans 
WHERE loan_number LIKE 'MEHCAR%' 
AND loan_number NOT LIKE 'TEMP-%'
ORDER BY CAST(SUBSTRING(loan_number FROM 7) AS INTEGER) DESC 
LIMIT 1
```

### Frontend Changes

#### 1. Form Behavior
- **Financier Team Vertical**: Normal dropdown (LCV, HCV, Car, Tractor, CE)
- **Loan Number**: Read-only field showing "Generated on disburse"
- **No Auto-Generation**: Numbers only generated on disburse action

#### 2. User Interface
```jsx
<select value={form.financierTeamVertical}>
  <option value="">Select Team Vertical</option>
  <option value="LCV">LCV</option>
  <option value="HCV">HCV</option>
  <option value="Car">Car</option>
  <option value="Tractor">Tractor</option>
  <option value="CE">CE</option>
</select>

<input 
  value={form.loanNumber} 
  placeholder="Generated on disburse"
  readOnly 
/>
```

## Example Scenarios

### Scenario 1: First Car Loan
1. User creates loan, selects **Financier Team Vertical: "Car"**
2. Loan goes through approval workflow
3. Super Admin clicks **"Disburse"**
4. System generates: `MEHCAR0001`

### Scenario 2: Multiple Verticals
1. **Car Loan**: Disbursed → `MEHCAR0001`
2. **LCV Loan**: Disbursed → `MEHLCV0001` 
3. **Car Loan**: Disbursed → `MEHCAR0002`
4. **Tractor Loan**: Disbursed → `MEHTRACTOR0001`
5. **Car Loan**: Disbursed → `MEHCAR0003`

### Scenario 3: Workflow States
- **Created**: Loan Number = empty
- **Manager Review**: Loan Number = empty  
- **Admin Approved**: Loan Number = empty
- **Disbursed**: Loan Number = `MEHCAR0001` (auto-generated)

## Benefits

1. **Clean Workflow**: Numbers only assigned when actually disbursed
2. **No Gaps**: Sequential numbering without unused numbers
3. **Organized**: Each vertical has its own series
4. **Automatic**: No manual intervention required
5. **Consistent**: MEH prefix with vertical identifier

This implementation ensures loan numbers are only generated when loans are actually disbursed, maintaining clean sequential numbering based on the selected Financier Team Vertical.
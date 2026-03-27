# Final Loan Number Implementation - MEH + Vertical Series

## Overview
Implemented loan number generation system where:
- **Financier Team Vertical** is fixed as "MEH"
- **Vertical** field determines the loan number prefix
- **Number series** continues sequentially based on vertical type

## Loan Number Format Examples
- **Car loans**: `MEHCAR0001`, `MEHCAR0002`, `MEHCAR0003`...
- **LCV loans**: `MEHLCV0001`, `MEHLCV0002`, `MEHLCV0003`...
- **HCV loans**: `MEHHCV0001`, `MEHHCV0002`, `MEHHCV0003`...
- **Tractor loans**: `MEHTRACTOR0001`, `MEHTRACTOR0002`...
- **CE loans**: `MEHCE0001`, `MEHCE0002`, `MEHCE0003`...

## Key Features

### 1. Fixed Financier Team Vertical
- **Field**: Always shows "MEH" (read-only)
- **Database**: Always stores "MEH" 
- **UI**: Grayed out input field with "Fixed value" note

### 2. Dynamic Loan Numbers
- **Prefix**: `MEH` + `{VERTICAL}` (e.g., MEHCAR, MEHLCV)
- **Numbering**: Sequential 4-digit numbers (0001, 0002, etc.)
- **Separate Series**: Each vertical maintains its own number sequence

### 3. Auto-Generation Logic
- When user selects **Vertical** → System fetches last loan number for that vertical
- Generates next sequential number automatically
- Updates loan number field in real-time

## Implementation Details

### Backend Changes (`/backend-fix/`)

#### 1. `src/controllers/loanController.js`
```javascript
// Updated getLastLoanNumber to accept vertical parameter
export const getLastLoanNumber = async (req, res) => {
  const { vertical } = req.query;
  const prefix = vertical ? `MEH${vertical.toUpperCase()}` : 'MEH';
  // Query for last loan number with specific prefix
};

// Updated createLoan to generate numbers based on vertical
const vertical = req.body.vertical || req.body.financier_team_vertical;
const prefix = vertical ? `MEH${vertical.toUpperCase()}` : 'MEH';
```

#### 2. API Endpoint
```
GET /api/loans/last-number?vertical=Car
Response: { "loan_number": "MEHCAR0123" }
```

### Frontend Changes (`/Mehar/`)

#### 1. `src/lib/utils.ts`
```javascript
export function generateLoanNumber(vertical: string, lastLoanNumber?: string): string {
  const prefix = vertical ? `MEH${vertical.toUpperCase()}` : 'MEH';
  // Generate next sequential number
}
```

#### 2. `src/pages/CreateLoan.tsx`
- **Fixed MEH Field**: `<input value="MEH" readOnly />`
- **Dynamic Query**: Fetches last loan number based on selected vertical
- **Auto-Update**: Loan number updates when vertical selection changes

## User Experience Flow

1. **User opens loan creation form**
   - Financier Team Vertical shows "MEH" (fixed)
   - Loan Number field is empty

2. **User selects Vertical (e.g., "Car")**
   - System fetches last MEHCAR loan number
   - Generates next number (e.g., MEHCAR0124)
   - Auto-populates Loan Number field

3. **User changes Vertical (e.g., to "LCV")**
   - System fetches last MEHLCV loan number
   - Generates next number (e.g., MEHLCV0056)
   - Updates Loan Number field automatically

4. **User submits form**
   - Loan is created with generated number
   - Database stores "MEH" as financier_team_vertical
   - Number series continues for next loan of same vertical

## Database Schema

### Loans Table
```sql
loan_number VARCHAR(20)           -- e.g., "MEHCAR0001"
vertical VARCHAR(20)              -- e.g., "Car", "LCV", "HCV"
financier_team_vertical VARCHAR(20) -- Always "MEH"
```

### Query for Last Number
```sql
SELECT loan_number FROM loans 
WHERE loan_number LIKE 'MEHCAR%' 
ORDER BY CAST(SUBSTRING(loan_number FROM 7) AS INTEGER) DESC 
LIMIT 1
```

## Benefits

1. **Organized Numbering**: Each vehicle type has its own series
2. **Easy Identification**: Loan number immediately shows vehicle type
3. **Scalable**: Can easily add new verticals
4. **Sequential**: No gaps in numbering within each vertical
5. **User Friendly**: Automatic generation reduces errors

## Example Scenarios

### Scenario 1: First Car Loan
- User selects Vertical: "Car"
- No existing MEHCAR loans found
- Generated: `MEHCAR0001`

### Scenario 2: 50th LCV Loan
- User selects Vertical: "LCV" 
- Last MEHLCV loan: `MEHLCV0049`
- Generated: `MEHLCV0050`

### Scenario 3: Switching Verticals
- User initially selects "Car" → Shows `MEHCAR0124`
- User changes to "Tractor" → Shows `MEHTRACTOR0008`
- User changes back to "Car" → Shows `MEHCAR0124` (unchanged)

This implementation ensures that each vertical type maintains its own sequential numbering while keeping the MEH prefix consistent across all loans.
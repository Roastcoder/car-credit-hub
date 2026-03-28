# Loan Number Display Updates

## Overview
Updated the loan list and loan details pages to properly display loan numbers and distinguish between loan numbers and application IDs.

## Changes Made

### 1. Loan List Page (`/src/pages/Loans.tsx`)

#### Desktop Table View
- **Header**: Changed from "Loan ID" to "Loan Number" for clarity
- **Display**: Enhanced loan number column to show:
  - Loan number in bold accent color when available
  - "ID: {id}" when no loan number exists
  - Small label indicating "Loan Number" vs "Application ID"

#### Mobile Card View
- **Enhanced Display**: 
  - Loan number shown in bold accent color
  - Added "DISBURSED" badge when loan number exists
  - Clear distinction between loan numbers and application IDs

#### Search Functionality
- **Updated Search**: Now searches through loan numbers in addition to names, IDs, and car models
- **Placeholder**: Updated to "Search name, loan number, ID, or car..."

### 2. Loan Details Page (`/src/pages/LoanDetail.tsx`)

#### Header Section
- **Title**: Shows loan number prominently when available, otherwise shows "Application ID: {id}"
- **Status Indicator**: Added green checkmark "✓ Loan Number Assigned" when loan has a number
- **Clear Distinction**: Visual difference between loans with numbers vs application IDs

#### Loan Information Section
- **Added Fields**:
  - "Loan Number": Shows actual loan number or "Not assigned yet"
  - "Application ID": Always shows the internal application ID
- **Separation**: Clear distinction between the two identifiers

#### Email Functionality
- **Enhanced Email**: Includes both loan number and application ID in email body
- **Subject Line**: Uses loan number when available, falls back to application ID

## User Experience Improvements

### Visual Indicators
1. **Loan Numbers**: Displayed in accent color (blue) and bold font
2. **Application IDs**: Shown in muted color with "ID:" prefix
3. **Status Badges**: "DISBURSED" badge appears when loan has a number
4. **Assignment Status**: Green checkmark shows when loan number is assigned

### Search Enhancement
- Users can now search by loan number (e.g., "MEHCAR0001")
- Search works across all identifier types
- Improved discoverability of loans

### Information Clarity
- **Before**: Only showed one identifier (confusing which was which)
- **After**: Shows both loan number and application ID with clear labels
- **Context**: Users understand the difference between temporary IDs and final loan numbers

## Expected Behavior

### New Loans (Not Disbursed)
- **List View**: Shows "ID: 123" in muted color
- **Detail View**: Shows "Application ID: 123" as title
- **Loan Number Field**: Shows "Not assigned yet"

### Disbursed Loans
- **List View**: Shows "MEHCAR0001" in bold blue with "DISBURSED" badge
- **Detail View**: Shows "MEHCAR0001" as title with green checkmark
- **Loan Number Field**: Shows actual loan number (e.g., "MEHCAR0001")

### Search Functionality
- Search "MEHCAR" → finds all disbursed Car loans
- Search "0001" → finds first loan of any vertical
- Search "ID: 123" → finds application by ID
- Search customer name → works as before

## Benefits

1. **Clear Identification**: Users can easily distinguish between temporary application IDs and permanent loan numbers
2. **Status Awareness**: Visual indicators show which loans have been disbursed and assigned numbers
3. **Better Search**: Enhanced search functionality helps users find loans by any identifier
4. **Professional Display**: Loan numbers are prominently displayed when available
5. **Workflow Understanding**: Users can see the progression from application to disbursed loan

The loan number display system now provides clear visual feedback about the loan status and makes it easy for users to identify and search for loans using either application IDs or loan numbers.
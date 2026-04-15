# Aadhaar Mobile Number Verification Feature

## Overview
This feature automatically verifies if the last 3 digits of the Aadhaar number match the last 3 digits of the entered mobile number in two places:
1. **Lead Creation** - Simple last 3 digits match verification
2. **Payment Application** - Advanced Aadhaar verification with OTP via Surepass API

## Implementation Details

### 1. Lead Creation Verification

#### How It Works
- Real-time verification when both Aadhaar (12 digits) and Mobile (10 digits) are complete
- Compares last 3 digits of Aadhaar with last 3 digits of mobile number
- Visual feedback shows match/no match status

#### Backend API
- **Endpoint**: `POST /api/aadhaar/verify-mobile`
- **Authentication**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "aadhar_number": "123456789012",
    "mobile": "9876543012"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "match": true,
    "message": "Last 3 digits match successfully"
  }
  ```

#### Frontend Integration (AddLead.tsx)
- Real-time verification triggers automatically
- Visual feedback:
  - **Checking**: Blue spinner with "Verifying..." message
  - **Success**: Green checkmark with success message
  - **Error**: Red X with error message

### 2. Payment Application Verification

#### How It Works
- Advanced verification using Surepass Aadhaar Validation API
- Validates Aadhaar number with government database
- Sends OTP to registered mobile for confirmation
- Two-step process: Initiate verification → Verify OTP

#### Backend APIs

**Initiate Aadhaar Verification**
- **Endpoint**: `POST /api/payments/:id/aadhaar/initiate`
- **Authentication**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "aadhaar_number": "123456789012"
  }
  ```
- **Process**:
  1. Calls Surepass Aadhaar Validation API
  2. Retrieves last 3 digits of Aadhaar-linked mobile
  3. Compares with applicant's mobile number
  4. Generates and sends OTP via SMS
- **Response**:
  ```json
  {
    "message": "Aadhaar validated and OTP sent to customer mobile",
    "phone": "******012"
  }
  ```

**Verify OTP**
- **Endpoint**: `POST /api/payments/:id/aadhaar/verify-otp`
- **Authentication**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "otp": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Aadhaar and OTP verification successful"
  }
  ```

### 3. Account Department - Direct UTR Entry

#### How It Works
- Account department (accountant role) can directly add UTR number
- No Aadhaar verification required for account department
- Automatically updates payment status to 'payment_released'
- Updates linked loan status to 'disbursed'

#### Backend API
- **Endpoint**: `POST /api/payments/:id/utr`
- **Authentication**: Required (Bearer token)
- **Authorization**: Only super_admin, admin, accountant roles
- **Request Body**:
  ```json
  {
    "utr_number": "UTR123456789012"
  }
  ```
- **Response**:
  ```json
  {
    "message": "UTR number added successfully",
    "application": { ... }
  }
  ```

## Files Modified/Created

### Backend
1. **Created**: `backend/src/controllers/aadhaarController.js`
   - Simple verification logic for lead creation

2. **Created**: `backend/src/routes/aadhaar.js`
   - Route for lead Aadhaar verification

3. **Modified**: `backend/src/server.js`
   - Added Aadhaar route

4. **Existing**: `backend/src/controllers/paymentApplicationController.js`
   - Contains advanced Aadhaar verification with Surepass API
   - Contains OTP verification logic
   - Contains direct UTR entry for account department

### Frontend
1. **Modified**: `Frontend/src/pages/AddLead.tsx`
   - Added real-time Aadhaar verification
   - Added visual feedback UI

2. **Existing**: Payment application pages already have verification UI

## Validation Rules

### Lead Creation
- Aadhaar number must be exactly 12 digits
- Mobile number must be exactly 10 digits
- Verification compares last 3 digits of both numbers
- Match result is displayed in real-time

### Payment Application
- Aadhaar number validated against government database via Surepass
- Last 3 digits of Aadhaar-linked mobile must match applicant mobile
- OTP expires in 10 minutes
- OTP is 6 digits

### Account Department
- No Aadhaar verification required
- Can directly add UTR number
- Must have accountant, admin, or super_admin role
- Payment application must be in 'voucher_created' status

## Usage Examples

### Lead Creation
When a user enters:
- Aadhaar: `123456789012` (last 3: `012`)
- Mobile: `9876543012` (last 3: `012`)

The system will show: ✓ Last 3 digits match successfully

### Payment Application
1. User initiates Aadhaar verification
2. System validates Aadhaar with Surepass API
3. System checks if last 3 digits match
4. OTP sent to customer mobile
5. User enters OTP to complete verification

### Account Department
1. Accountant opens approved payment application
2. Directly enters UTR number
3. System updates status to 'payment_released'
4. Linked loan status updated to 'disbursed'

## Testing
Run the test script to verify the logic:
```bash
cd backend
node test_aadhaar_verification.js
```

## Security Notes
- All APIs require authentication
- Payment application verification uses Surepass API (government-approved)
- OTP verification adds extra security layer
- Account department has special privileges for direct UTR entry
- No sensitive data is stored during verification
- Results are only displayed to authenticated users

## Environment Variables Required

For Payment Application Aadhaar verification:
```
SUREPASS_API_TOKEN=your_surepass_api_token
SUREPASS_AADHAAR_URL=https://kyc-api.surepass.io/api/v1/aadhaar-validation/aadhaar-validation
```

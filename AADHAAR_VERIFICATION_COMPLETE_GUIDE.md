# Aadhaar Verification Implementation - Complete Guide

## Overview
Aadhaar verification is implemented in two places with different levels of verification:

1. **Lead Creation** - Simple last 3 digits match verification
2. **Payment Application** - Advanced inline verification with OTP

## DLT SMS Template Used

### LOAN_SANCTION_OTP Template
**Template ID**: `1707177564921877323`

**Pattern**: 
```
Hello, We have sanctioned a loan amount of ₹{#var#}/- from this amount ₹{#var#}/- 
We are transferring to {#var#}. By sharing this {#var#}, you are providing your 
consent for the transaction. - MEHAR ADVISORY
```

**Variables**:
1. Loan Amount (payment_amount)
2. Transfer Amount (payment_amount)
3. Recipient Name (applicant_name)
4. OTP Code (6-digit OTP)

**Usage in Code**:
```javascript
await smsService.sendLoanSanctionOTP(
  phone,
  payment_amount,
  payment_amount,
  applicant_name,
  otp
);
```

## 1. Lead Creation - Simple Verification

### How It Works
- Real-time verification when both Aadhaar (12 digits) and Mobile (10 digits) are complete
- Compares last 3 digits of Aadhaar with last 3 digits of mobile number
- Visual inline feedback shows match/no match status

### Backend API
- **Endpoint**: `POST /api/aadhaar/verify-mobile`
- **Authentication**: Required (Bearer token)
- **Request**:
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

### Frontend (AddLead.tsx)
- Automatic verification on field completion
- Visual states: Checking → Success/Error
- Non-blocking (user can still submit)

## 2. Payment Application - Advanced Verification with OTP

### Complete Flow

#### Step 1: User Fills Payment Application Form
- All loan and payment details filled
- Applicant mobile number required

#### Step 2: Aadhaar Verification (Inline)
- User enters 12-digit Aadhaar number
- System verifies last 3 digits match mobile number
- If match: OTP is sent to applicant's mobile
- If no match: Error shown, user can retry

#### Step 3: OTP Verification (Inline)
- User enters 6-digit OTP received via SMS
- System verifies OTP
- On success: Verification complete
- On failure: User can resend OTP

#### Step 4: Submit Application
- Application can only be submitted after Aadhaar verification
- Draft can be saved without verification
- Submitted applications go to RBM for approval

#### Step 5: RBM Approval
- RBM reviews the application
- Can Approve, Reject, or Send Back with remarks
- Approved applications visible to Account Department

#### Step 6: Account Department Processing
- Account department sees only approved applications
- Can directly add UTR number (no Aadhaar verification needed)
- Adding UTR updates status to 'payment_released'
- Linked loan status updated to 'disbursed'

### Backend APIs

#### Send OTP
- **Endpoint**: `POST /api/payments/send-otp`
- **Authentication**: Required
- **Request**:
  ```json
  {
    "phone": "9876543012",
    "applicant_name": "John Doe",
    "payment_amount": "50000"
  }
  ```
- **Response**:
  ```json
  {
    "message": "OTP sent successfully",
    "phone": "******012"
  }
  ```
- **SMS Template**: PAYMENT_OTP
- **Template Variables**: [applicant_name, payment_amount, otp]

#### Verify OTP
- **Endpoint**: `POST /api/payments/verify-otp`
- **Authentication**: Required
- **Request**:
  ```json
  {
    "phone": "9876543012",
    "otp": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "message": "OTP verified successfully"
  }
  ```

#### Add UTR (Account Department Only)
- **Endpoint**: `POST /api/payments/applications/:id/utr`
- **Authentication**: Required
- **Authorization**: accountant, admin, super_admin roles only
- **Request**:
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
- **Side Effects**:
  - Payment application status → 'payment_released'
  - Linked loan status → 'disbursed'
  - Loan number generated if temporary

### Frontend (PaymentApplicationForm.tsx)

#### Aadhaar Verification Section (Section 11)
Located before action buttons, includes:

1. **Idle State**
   - Input for 12-digit Aadhaar number
   - "Verify Aadhaar" button
   - Disabled until Aadhaar and mobile are valid

2. **Verifying State**
   - Loading spinner
   - "Verifying Aadhaar..." message

3. **OTP Sent State**
   - Success message with masked phone
   - Input for 6-digit OTP
   - "Verify OTP" button
   - "Resend" button

4. **Verified State**
   - Green success banner
   - Checkmark icon
   - "Verification Successful!" message

5. **Error State**
   - Red error banner
   - Error message
   - "Try Again" button

#### Submit Button Logic
```typescript
// Draft: Can save without verification
// Submit: Requires aadhaarVerificationStatus === 'verified'
if (status === 'submitted' && aadhaarVerificationStatus !== 'verified') {
  toast.error('Please complete Aadhaar verification before submitting');
  return;
}
```

## 3. Account Department - Direct UTR Entry

### How It Works
- Account department bypasses Aadhaar verification
- Can directly add UTR number to approved applications
- No OTP or verification required
- Streamlined process for payment release

### Access Control
- Only roles: `accountant`, `admin`, `super_admin`
- Can only see applications with status: `manager_approved`
- Cannot modify applications in other statuses

### UI Flow
1. View approved payment applications
2. Click on application to view details
3. Enter UTR number in dedicated field
4. Submit UTR
5. Application status updated to 'payment_released'
6. Loan automatically marked as 'disbursed'

## Database Schema Updates

### Payment Applications Table
```sql
ALTER TABLE payment_applications ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);
ALTER TABLE payment_applications ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE;
```

### OTP Verifications Table
```sql
CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(10) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL,
  expiry TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_phone_purpose ON otp_verifications(phone, purpose);
```

## SMS Templates Required

### Using Existing LOAN_SANCTION_OTP Template
**Template ID**: `1707177564921877323`

**Pattern**:
```
Hello, We have sanctioned a loan amount of ₹{#var#}/- from this amount ₹{#var#}/- 
We are transferring to {#var#}. By sharing this {#var#}, you are providing your 
consent for the transaction. - MEHAR ADVISORY
```

**Variables Mapping**: 
1. {#var#} = payment_amount (Loan Amount)
2. {#var#} = payment_amount (Transfer Amount)
3. {#var#} = applicant_name (Recipient)
4. {#var#} = otp (6-digit OTP)

**Code Implementation**:
```javascript
await smsService.sendLoanSanctionOTP(
  phone,
  payment_amount,
  payment_amount,
  applicant_name,
  otp
);
```

## Security Features

1. **OTP Expiry**: 10 minutes
2. **OTP Length**: 6 digits
3. **Rate Limiting**: Prevent OTP spam
4. **Single Use**: OTP deleted after successful verification
5. **Role-Based Access**: Account department has special privileges
6. **Audit Trail**: All actions logged in payment_application_logs

## Testing Checklist

### Lead Creation
- [ ] Enter 12-digit Aadhaar
- [ ] Enter 10-digit mobile
- [ ] Verify last 3 digits match
- [ ] Verify last 3 digits don't match
- [ ] Check visual feedback

### Payment Application
- [ ] Fill all required fields
- [ ] Enter Aadhaar number
- [ ] Verify Aadhaar (should send OTP)
- [ ] Enter correct OTP
- [ ] Enter wrong OTP
- [ ] Resend OTP
- [ ] Try to submit without verification
- [ ] Submit after verification
- [ ] Save as draft without verification

### RBM Approval
- [ ] View submitted applications
- [ ] Approve application
- [ ] Reject application
- [ ] Send back with remarks

### Account Department
- [ ] View only approved applications
- [ ] Add UTR number
- [ ] Verify loan status updated
- [ ] Verify payment status updated

## Error Handling

### Common Errors
1. **Invalid Aadhaar**: "Please enter a valid 12-digit Aadhaar number"
2. **Invalid Mobile**: "Please enter a valid 10-digit mobile number"
3. **No Match**: "Last 3 digits of Aadhaar do not match mobile number"
4. **OTP Failed**: "Failed to send OTP. Please try again."
5. **Invalid OTP**: "Invalid or expired OTP"
6. **Not Verified**: "Please complete Aadhaar verification before submitting"

## Files Modified/Created

### Backend
1. `backend/src/controllers/aadhaarController.js` - Lead verification
2. `backend/src/routes/aadhaar.js` - Lead verification routes
3. `backend/src/controllers/paymentApplicationController.js` - Added sendPaymentOTP, verifyPaymentOTP
4. `backend/src/routes/paymentApplications.js` - Added OTP routes
5. `backend/src/server.js` - Added Aadhaar routes

### Frontend
1. `Frontend/src/pages/AddLead.tsx` - Inline Aadhaar verification
2. `Frontend/src/pages/PaymentApplicationForm.tsx` - Complete Aadhaar + OTP flow

### Database
1. Migration for aadhaar_number and aadhaar_verified columns
2. OTP verifications table

## Environment Variables

```env
# SMS Service (required for OTP)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=MEHFIN
SMS_TEMPLATE_ID_PAYMENT_OTP=your_template_id
```

## Workflow Summary

```
Lead Creation
└─> Simple Aadhaar verification (last 3 digits)
    └─> Lead created

Payment Application
└─> Fill form
    └─> Aadhaar verification (inline)
        └─> OTP sent
            └─> OTP verified
                └─> Submit application
                    └─> RBM approval
                        ├─> Approved → Account Department
                        ├─> Rejected → End
                        └─> Send Back → User fixes → Resubmit
                            
Account Department
└─> View approved applications
    └─> Add UTR directly (no verification)
        └─> Payment released
            └─> Loan disbursed
```

## Support & Troubleshooting

### OTP Not Received
1. Check SMS service configuration
2. Verify template is approved
3. Check phone number format
4. Review SMS service logs

### Verification Fails
1. Ensure Aadhaar is 12 digits
2. Ensure mobile is 10 digits
3. Check last 3 digits match
4. Verify OTP table has entry

### Account Department Issues
1. Verify user role is accountant/admin
2. Check application status is 'manager_approved'
3. Ensure UTR format is valid

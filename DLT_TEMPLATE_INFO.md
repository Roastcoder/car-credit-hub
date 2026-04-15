# DLT Template for Payment Application OTP

## Template Being Used

We are using the **existing LOAN_SANCTION_OTP** template that is already approved and configured in your system.

### Template Details

**Template Name**: LOAN_SANCTION_OTP  
**Template ID**: `1707177564921877323`  
**Sender ID**: MEADPL (from your SMS configuration)

### Template Message

```
Hello, We have sanctioned a loan amount of ₹{#var#}/- from this amount ₹{#var#}/- 
We are transferring to {#var#}. By sharing this {#var#}, you are providing your 
consent for the transaction. - MEHAR ADVISORY
```

### Variable Mapping for Payment Application

When sending OTP for payment application verification:

| Variable Position | Value | Example |
|------------------|-------|---------|
| {#var#} (1st) | Payment Amount | 50000 |
| {#var#} (2nd) | Payment Amount | 50000 |
| {#var#} (3rd) | Applicant Name | John Doe |
| {#var#} (4th) | OTP Code | 123456 |

### Example SMS Sent

```
Hello, We have sanctioned a loan amount of ₹50000/- from this amount ₹50000/- 
We are transferring to John Doe. By sharing this 123456, you are providing your 
consent for the transaction. - MEHAR ADVISORY
```

### Code Implementation

**Location**: `backend/src/controllers/paymentApplicationController.js`

```javascript
// In sendPaymentOTP function
const smsResult = await smsService.sendLoanSanctionOTP(
  phone,                    // Mobile number
  payment_amount || '0',    // Loan amount (1st variable)
  payment_amount || '0',    // Transfer amount (2nd variable)
  applicant_name || 'Customer', // Recipient name (3rd variable)
  otp                       // OTP code (4th variable)
);
```

### Why This Template?

1. **Already Approved**: No need to wait for new DLT approval
2. **Contextually Appropriate**: Mentions loan sanction and transfer
3. **Includes OTP**: Has placeholder for OTP code
4. **Consent Language**: Mentions "providing consent" which is appropriate for verification

### No New Template Required

✅ **No action needed** - We're using your existing approved template  
✅ **No DLT registration** - Template already registered  
✅ **No waiting period** - Ready to use immediately  

### Alternative Template Available

If needed, you also have **LOAN_SANCTION_OTP_RS** template:

**Template ID**: `1707177571455785179`

```
Hello, We have sanctioned a loan amount of Rs{#var#}/- from this amount Rs{#var#}/- 
We are transferring to {#var#}. By sharing this {#var#}, you are providing your 
consent for the transaction. - MEHAR ADVISORY
```

This is identical but uses "Rs" instead of "₹" symbol.

### Configuration Check

Ensure these environment variables are set in your `.env` file:

```env
SMS_USER=your_sms_username
SMS_PASSWORD=your_sms_password
SMS_SENDER_ID=MEADPL
SMS_ENTITY_ID=1701177530636533436
```

### Testing

To test the OTP flow:

1. Create a payment application
2. Enter Aadhaar number
3. Click "Verify Aadhaar"
4. Check mobile for SMS with OTP
5. Enter OTP to complete verification

The SMS will be sent using the LOAN_SANCTION_OTP template with your payment details and OTP.

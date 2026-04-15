# Database Updates - Aadhaar Verification

## Migration Completed Successfully ✅

**Date**: January 15, 2026  
**Migration File**: `20260115_add_aadhaar_verification.sql`

## Changes Applied

### 1. Payment Applications Table
Added new columns to support Aadhaar verification:

```sql
ALTER TABLE payment_applications 
ADD COLUMN aadhaar_number VARCHAR(12),
ADD COLUMN aadhaar_verified BOOLEAN DEFAULT FALSE;
```

**Columns Added**:
- `aadhaar_number` - Stores 12-digit Aadhaar number
- `aadhaar_verified` - Boolean flag indicating if Aadhaar was verified with OTP

### 2. OTP Verifications Table
Ensured table exists with proper structure:

```sql
CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(10) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL,
  expiry TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose Values**:
- `payment_verification` - For payment application OTP
- `forgot_password` - For password reset OTP
- `login` - For login OTP
- `signup` - For signup OTP

### 3. Indexes Created
For optimal query performance:

```sql
CREATE INDEX idx_payment_applications_aadhaar ON payment_applications(aadhaar_number);
CREATE INDEX idx_otp_phone_purpose ON otp_verifications(phone, purpose);
CREATE INDEX idx_otp_expiry ON otp_verifications(expiry);
```

## Database Connection

**Current Configuration**:
```
Host: 187.77.187.120
Port: 5431
Database: meh
Username: mehar
```

## Verification

To verify the changes were applied:

```sql
-- Check payment_applications columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_applications' 
AND column_name IN ('aadhaar_number', 'aadhaar_verified');

-- Check otp_verifications table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'otp_verifications';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('payment_applications', 'otp_verifications');
```

## Rollback (If Needed)

If you need to rollback these changes:

```sql
-- Remove columns from payment_applications
ALTER TABLE payment_applications 
DROP COLUMN IF EXISTS aadhaar_number,
DROP COLUMN IF EXISTS aadhaar_verified;

-- Drop indexes
DROP INDEX IF EXISTS idx_payment_applications_aadhaar;
DROP INDEX IF EXISTS idx_otp_phone_purpose;
DROP INDEX IF EXISTS idx_otp_expiry;

-- Optionally drop otp_verifications table
-- DROP TABLE IF EXISTS otp_verifications;
```

## Next Steps

1. ✅ Database updated
2. ✅ Backend APIs created
3. ✅ Frontend UI implemented
4. ⏳ Test the complete flow
5. ⏳ Deploy to production

## Testing Queries

```sql
-- Test inserting a payment application with Aadhaar
INSERT INTO payment_applications (
  loan_id, applicant_name, applicant_phone, 
  aadhaar_number, aadhaar_verified, 
  payment_amount, status, created_by
) VALUES (
  1, 'Test User', '9876543210', 
  '123456789012', true, 
  50000, 'draft', 1
);

-- Test OTP insertion
INSERT INTO otp_verifications (phone, otp_code, purpose, expiry)
VALUES ('9876543210', '123456', 'payment_verification', NOW() + INTERVAL '10 minutes');

-- Query OTPs
SELECT * FROM otp_verifications 
WHERE phone = '9876543210' 
AND purpose = 'payment_verification' 
AND expiry > NOW();
```

## Maintenance

### Clean Expired OTPs
Run periodically to clean up expired OTPs:

```sql
DELETE FROM otp_verifications WHERE expiry < NOW();
```

Consider setting up a cron job or scheduled task to run this daily.

## Status

✅ **All database updates completed successfully**  
✅ **Ready for testing**  
✅ **No errors during migration**

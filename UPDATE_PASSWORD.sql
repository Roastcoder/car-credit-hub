-- Update password for ops.hanumangarh@meharadvisory.com
-- Note: This needs to be run in Supabase Dashboard -> Authentication -> Users
-- Find the user and click "Reset Password" or use the SQL below

-- Get user ID
SELECT id, email FROM auth.users WHERE email = 'ops.hanumangarh@meharadvisory.com';

-- To update password, you need to use Supabase Dashboard:
-- 1. Go to Authentication -> Users
-- 2. Find ops.hanumangarh@meharadvisory.com
-- 3. Click the three dots menu
-- 4. Select "Reset Password"
-- 5. Set new password: Mani@2003

-- OR use this SQL (requires admin privileges):
-- UPDATE auth.users 
-- SET encrypted_password = crypt('Mani@2003', gen_salt('bf'))
-- WHERE email = 'ops.hanumangarh@meharadvisory.com';

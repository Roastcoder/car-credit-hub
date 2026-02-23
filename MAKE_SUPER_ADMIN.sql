-- Make yogendra6378@gmail.com a super admin

-- Check current role
SELECT p.email, p.full_name, ur.role, b.name as branch
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN branches b ON b.id = p.branch_id
WHERE p.email = 'yogendra6378@gmail.com';

-- Delete existing role
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'yogendra6378@gmail.com');

-- Insert super_admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM profiles
WHERE email = 'yogendra6378@gmail.com';

-- Verify the change
SELECT p.email, p.full_name, ur.role, b.name as branch
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN branches b ON b.id = p.branch_id
WHERE p.email = 'yogendra6378@gmail.com';

-- Update nidhi.goyal@meharadvisory.com to manager role

-- First, check current role
SELECT p.email, p.full_name, ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'nidhi.goyal@meharadvisory.com';

-- Delete existing role if any
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'nidhi.goyal@meharadvisory.com');

-- Insert manager role
INSERT INTO user_roles (user_id, role)
SELECT id, 'manager'::app_role
FROM profiles
WHERE email = 'nidhi.goyal@meharadvisory.com';

-- Verify the change
SELECT p.email, p.full_name, ur.role, b.name as branch
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN branches b ON b.id = p.branch_id
WHERE p.email = 'nidhi.goyal@meharadvisory.com';

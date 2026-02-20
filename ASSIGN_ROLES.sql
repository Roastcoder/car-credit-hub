-- ============================================================
-- ASSIGN EMPLOYEE ROLE TO ALL USERS WITHOUT ROLES
-- ============================================================

-- First, let's see who doesn't have a role
SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role IS NULL;

-- Assign employee role to all users without a role
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'employee'::app_role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify all users now have roles
SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role,
  b.name as branch_name
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN branches b ON b.id = p.branch_id
ORDER BY p.created_at DESC;

-- Database Update Script for Account Department Role Management
-- Run this script to update the existing database with accountant role support

-- 1. Update the users table role enum to include 'accountant'
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'manager', 'bank', 'broker', 'employee', 'accountant') DEFAULT 'employee';

-- 2. Create a function to safely update user roles (if needed)
DELIMITER //
CREATE PROCEDURE UpdateUserRole(
    IN user_id INT,
    IN new_role VARCHAR(20),
    IN branch_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Update user role and branch
    UPDATE users 
    SET role = new_role, 
        branch_id = CASE WHEN branch_id IS NOT NULL THEN branch_id ELSE users.branch_id END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id;
    
    -- Log the role change in audit trail (if audit_trail table exists)
    INSERT INTO audit_trail (table_name, record_id, action, new_values, user_id, created_at)
    VALUES ('users', user_id, 'UPDATE', JSON_OBJECT('role', new_role, 'branch_id', branch_id), user_id, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP;
    
    COMMIT;
END //
DELIMITER ;

-- 3. Create indexes for better performance on role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_role_branch ON users(role, branch_id);

-- 4. Insert sample accountant user (optional - remove if not needed)
-- INSERT INTO users (full_name, email, password, role, status, created_at) 
-- VALUES ('Account Manager', 'accountant@meharfinance.com', '$2b$10$example_hashed_password', 'accountant', 'active', NOW())
-- ON DUPLICATE KEY UPDATE role = 'accountant';

-- 5. Update any existing permissions or role-based configurations
-- Add any additional role-specific configurations here

-- 6. Verify the changes
SELECT 
    'Role Update Verification' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'accountant' THEN 1 END) as accountant_users,
    COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admin_users
FROM users;

-- 7. Show current role distribution
SELECT 
    role,
    COUNT(*) as user_count,
    GROUP_CONCAT(DISTINCT full_name ORDER BY full_name SEPARATOR ', ') as users
FROM users 
WHERE role IS NOT NULL
GROUP BY role
ORDER BY 
    CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'manager' THEN 3
        WHEN 'accountant' THEN 4
        WHEN 'bank' THEN 5
        WHEN 'broker' THEN 6
        WHEN 'employee' THEN 7
        ELSE 8
    END;
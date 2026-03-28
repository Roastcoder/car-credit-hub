#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

async function checkEmployeePassword() {
  const client = new Client({
    connectionString: 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh'
  });

  try {
    await client.connect();
    console.log('=== CHECKING EMPLOYEE PASSWORD ISSUE ===\n');
    
    // 1. Check employee details
    console.log('1. Employee Details:\n');
    
    const employeeQuery = `
      SELECT id, name, email, role, branch_id, status, password, created_at
      FROM users 
      WHERE id = 30
    `;
    
    const employeeResult = await client.query(employeeQuery);
    
    if (employeeResult.rows.length > 0) {
      const employee = employeeResult.rows[0];
      console.log(`Name: ${employee.name}`);
      console.log(`Email: ${employee.email}`);
      console.log(`Role: ${employee.role}`);
      console.log(`Branch ID: ${employee.branch_id}`);
      console.log(`Status: ${employee.status}`);
      console.log(`Password Hash: ${employee.password ? 'Present' : 'Missing'}`);
      console.log(`Created: ${employee.created_at}`);
      
      if (!employee.password) {
        console.log('\n❌ PROBLEM: Employee has no password set!');
        console.log('This explains why login fails.');
      } else {
        console.log('\n✅ Employee has password hash in database');
        console.log('The issue might be:');
        console.log('- Password hashing mismatch between frontend and backend');
        console.log('- Backend login logic not working correctly');
        console.log('- Password was changed and we don\'t know the current one');
      }
    } else {
      console.log('❌ Employee not found in database!');
      return;
    }
    
    // 2. Check if we can reset the password
    console.log('\n2. Password Reset Options:\n');
    
    // Option A: Set a known password
    const newPassword = 'employee123'; // Plain text - backend should hash it
    console.log(`Attempting to set password to: ${newPassword}`);
    
    try {
      // Note: This assumes the backend uses bcrypt or similar hashing
      // We'll set a plain password and let the backend hash it on next login attempt
      const updateQuery = `
        UPDATE users 
        SET password = $1, updated_at = NOW()
        WHERE id = 30
        RETURNING name, email
      `;
      
      // For now, let's just show what should be done
      console.log('SQL to reset password:');
      console.log(`UPDATE users SET password = '$2a$10$...' WHERE id = 30;`);
      console.log('(Password should be properly hashed with bcrypt)');
      
    } catch (error) {
      console.log(`Error updating password: ${error.message}`);
    }
    
    // 3. Check other employees' passwords for comparison
    console.log('\n3. Other Employees Password Status:\n');
    
    const otherEmployeesQuery = `
      SELECT id, name, email, password IS NOT NULL as has_password
      FROM users 
      WHERE role = 'employee' AND id != 30
      LIMIT 5
    `;
    
    const otherResult = await client.query(otherEmployeesQuery);
    
    otherResult.rows.forEach(emp => {
      console.log(`${emp.name} (${emp.email}): ${emp.has_password ? 'Has password' : 'No password'}`);
    });
    
    // 4. Check admin/manager passwords
    console.log('\n4. Admin/Manager Password Status:\n');
    
    const adminQuery = `
      SELECT id, name, email, role, password IS NOT NULL as has_password
      FROM users 
      WHERE role IN ('admin', 'super_admin', 'manager')
      LIMIT 5
    `;
    
    const adminResult = await client.query(adminQuery);
    
    adminResult.rows.forEach(user => {
      console.log(`${user.name} (${user.role}): ${user.has_password ? 'Has password' : 'No password'}`);
    });
    
    console.log('\n5. IMMEDIATE SOLUTIONS:\n');
    
    console.log('A) BACKEND DEVELOPER ACTIONS:');
    console.log('   1. Check if employee password exists in database');
    console.log('   2. Reset employee password to a known value');
    console.log('   3. Ensure login endpoint properly hashes and compares passwords');
    console.log('   4. Test login endpoint with Postman/curl');
    console.log('');
    console.log('B) TEMPORARY WORKAROUND:');
    console.log('   1. Login as admin/manager to verify system works');
    console.log('   2. Use admin account to reset employee password');
    console.log('   3. Or manually update password in database');
    console.log('');
    console.log('C) PASSWORD RESET SQL (for backend developer):');
    console.log('   -- Set password to "employee123" (properly hashed)');
    console.log('   UPDATE users SET password = $bcrypt_hash WHERE id = 30;');
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkEmployeePassword();
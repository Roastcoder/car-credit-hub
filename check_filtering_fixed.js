#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

async function checkRoleBasedFiltering() {
  const client = new Client({
    connectionString: 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh'
  });

  try {
    await client.connect();
    console.log('=== ROLE-BASED FILTERING VERIFICATION ===\n');
    
    // 1. Check employee Pawan khangarot (ID: 30)
    console.log('1. EMPLOYEE FILTERING TEST');
    console.log('Employee: Pawan khangarot (ID: 30)');
    console.log('Rule: Employees should only see loans they created (created_by = 30)\n');
    
    const employeeLoansQuery = `
      SELECT 
        loan_number, applicant_name, created_by, branch_id, status
      FROM loans 
      WHERE created_by = 30
      ORDER BY created_at DESC
    `;
    
    const employeeResult = await client.query(employeeLoansQuery);
    console.log(`✅ Employee should see ${employeeResult.rows.length} loans:`);
    employeeResult.rows.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Branch: ${loan.branch_id || 'None'})`);
    });
    
    // 2. Check managers in the same branch as employee
    console.log('\n2. MANAGER FILTERING TEST');
    
    // First, get employee's branch
    const employeeDetailsQuery = `SELECT branch_id FROM users WHERE id = 30`;
    const employeeDetails = await client.query(employeeDetailsQuery);
    const employeeBranchId = employeeDetails.rows[0]?.branch_id;
    
    console.log(`Employee's Branch ID: ${employeeBranchId || 'None'}`);
    
    // Find managers in the same branch
    const managersQuery = `
      SELECT id, name, email, branch_id 
      FROM users 
      WHERE role = 'manager' AND branch_id = $1
    `;
    
    const managersResult = await client.query(managersQuery, [employeeBranchId]);
    
    if (managersResult.rows.length > 0) {
      console.log(`\nManagers in branch ${employeeBranchId}:`);
      
      for (const manager of managersResult.rows) {
        console.log(`\nManager: ${manager.name} (ID: ${manager.id})`);
        console.log(`Rule: Managers should see all loans from their branch (branch_id = ${manager.branch_id})`);
        
        const managerLoansQuery = `
          SELECT 
            loan_number, applicant_name, created_by, branch_id, status
          FROM loans 
          WHERE branch_id = $1
          ORDER BY created_at DESC
        `;
        
        const managerResult = await client.query(managerLoansQuery, [manager.branch_id]);
        console.log(`✅ Manager should see ${managerResult.rows.length} loans from branch ${manager.branch_id}:`);
        
        managerResult.rows.forEach((loan, index) => {
          const isEmployeeLoan = loan.created_by === 30 ? ' (Employee loan)' : '';
          console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Created by: ${loan.created_by})${isEmployeeLoan}`);
        });
      }
    } else {
      console.log(`\n❌ No managers found in branch ${employeeBranchId}`);
      
      // Show all managers
      const allManagersQuery = `SELECT id, name, email, branch_id FROM users WHERE role = 'manager'`;
      const allManagers = await client.query(allManagersQuery);
      
      console.log('\nAll managers in system:');
      allManagers.rows.forEach(manager => {
        console.log(`   ${manager.name} (ID: ${manager.id}, Branch: ${manager.branch_id})`);
      });
    }
    
    // 3. Check the specific issue with loan CL-2026-5486
    console.log('\n3. SPECIFIC LOAN VISIBILITY TEST');
    console.log('Checking loan CL-2026-5486 visibility rules:\n');
    
    const specificLoanQuery = `
      SELECT 
        l.loan_number, l.applicant_name, l.created_by, l.branch_id, l.status,
        u.name as creator_name, u.role as creator_role
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.loan_number = 'CL-2026-5486'
    `;
    
    const specificResult = await client.query(specificLoanQuery);
    
    if (specificResult.rows.length > 0) {
      const loan = specificResult.rows[0];
      console.log(`Loan: ${loan.loan_number} - ${loan.applicant_name}`);
      console.log(`Created by: ${loan.creator_name} (ID: ${loan.created_by}, Role: ${loan.creator_role})`);
      console.log(`Branch: ${loan.branch_id || 'None'}`);
      console.log(`Status: ${loan.status}`);
      
      console.log('\nVisibility Rules:');
      console.log(`✅ Employee ${loan.creator_name} (ID: ${loan.created_by}) should see this loan (they created it)`);
      
      if (loan.branch_id) {
        console.log(`✅ Managers in branch ${loan.branch_id} should see this loan`);
      } else {
        console.log(`⚠️  Loan has no branch_id - managers won't see it unless branch is assigned`);
      }
      
      console.log(`✅ Admins and Super Admins should see this loan (they see all loans)`);
    }
    
    // 4. Check if loans need branch assignment
    console.log('\n4. BRANCH ASSIGNMENT CHECK');
    const loansWithoutBranchQuery = `
      SELECT loan_number, applicant_name, created_by, branch_id
      FROM loans 
      WHERE branch_id IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const loansWithoutBranch = await client.query(loansWithoutBranchQuery);
    console.log(`Found ${loansWithoutBranch.rows.length} loans without branch assignment:`);
    
    loansWithoutBranch.rows.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Created by: ${loan.created_by})`);
    });
    
    if (loansWithoutBranch.rows.length > 0) {
      console.log('\n⚠️  These loans need branch_id assignment for managers to see them');
    }
    
    console.log('\n5. BACKEND API REQUIREMENTS');
    console.log('The backend /loans endpoint should implement this filtering logic:\n');
    
    console.log('For employees: SELECT * FROM loans WHERE created_by = current_user_id;');
    console.log('For managers: SELECT * FROM loans WHERE branch_id = current_user_branch_id;');
    console.log('For admin/super_admin: SELECT * FROM loans;');
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkRoleBasedFiltering();
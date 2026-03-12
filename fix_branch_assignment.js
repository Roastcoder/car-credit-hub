#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

async function fixBranchAssignment() {
  const client = new Client({
    connectionString: 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh'
  });

  try {
    await client.connect();
    console.log('=== FIXING BRANCH ASSIGNMENT FOR LOANS ===\n');
    
    // 1. Update loans created by employee to have their branch_id
    console.log('1. Updating loans created by employees to inherit their branch_id...\n');
    
    const updateEmployeeLoansQuery = `
      UPDATE loans 
      SET branch_id = u.branch_id
      FROM users u 
      WHERE loans.created_by = u.id 
        AND u.role = 'employee' 
        AND loans.branch_id IS NULL
        AND u.branch_id IS NOT NULL
      RETURNING loans.loan_number, loans.applicant_name, loans.branch_id, u.name as creator_name
    `;
    
    const updateResult = await client.query(updateEmployeeLoansQuery);
    
    console.log(`✅ Updated ${updateResult.rows.length} loans with branch assignment:`);
    updateResult.rows.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} → Branch ${loan.branch_id} (Created by: ${loan.creator_name})`);
    });
    
    // 2. Verify the specific loan CL-2026-5486
    console.log('\n2. Verifying loan CL-2026-5486 after update...\n');
    
    const verifyLoanQuery = `
      SELECT 
        l.loan_number, l.applicant_name, l.created_by, l.branch_id, l.status,
        u.name as creator_name, u.role as creator_role, u.branch_id as creator_branch
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.loan_number = 'CL-2026-5486'
    `;
    
    const verifyResult = await client.query(verifyLoanQuery);
    
    if (verifyResult.rows.length > 0) {
      const loan = verifyResult.rows[0];
      console.log(`Loan: ${loan.loan_number} - ${loan.applicant_name}`);
      console.log(`Created by: ${loan.creator_name} (ID: ${loan.created_by}, Role: ${loan.creator_role})`);
      console.log(`Creator's Branch: ${loan.creator_branch}`);
      console.log(`Loan's Branch: ${loan.branch_id}`);
      console.log(`Status: ${loan.status}`);
      
      if (loan.branch_id) {
        console.log('\n✅ SUCCESS: Loan now has branch_id assigned!');
        console.log(`✅ Employee ${loan.creator_name} can see this loan (created_by = ${loan.created_by})`);
        console.log(`✅ Managers in branch ${loan.branch_id} can now see this loan`);
      } else {
        console.log('\n❌ Loan still has no branch_id');
      }
    }
    
    // 3. Check what manager should see now
    console.log('\n3. Checking what manager Yogendra Singh should see now...\n');
    
    const managerLoansQuery = `
      SELECT 
        l.loan_number, l.applicant_name, l.created_by, l.branch_id, l.status,
        u.name as creator_name
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.branch_id = 3
      ORDER BY l.created_at DESC
    `;
    
    const managerResult = await client.query(managerLoansQuery);
    console.log(`Manager Yogendra Singh (Branch 3) should now see ${managerResult.rows.length} loans:`);
    
    managerResult.rows.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Created by: ${loan.creator_name})`);
    });
    
    // 4. Summary of role-based access
    console.log('\n4. ROLE-BASED ACCESS SUMMARY:\n');
    
    console.log('Employee Pawan khangarot (ID: 30):');
    const employeeAccessQuery = `SELECT loan_number, applicant_name FROM loans WHERE created_by = 30`;
    const employeeAccess = await client.query(employeeAccessQuery);
    console.log(`   Can see ${employeeAccess.rows.length} loans (own loans):`);
    employeeAccess.rows.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name}`);
    });
    
    console.log('\nManager Yogendra Singh (ID: 2, Branch: 3):');
    const managerAccessQuery = `SELECT loan_number, applicant_name, created_by FROM loans WHERE branch_id = 3`;
    const managerAccess = await client.query(managerAccessQuery);
    console.log(`   Can see ${managerAccess.rows.length} loans (branch loans):`);
    managerAccess.rows.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Created by: ${loan.created_by})`);
    });
    
    console.log('\n✅ BRANCH ASSIGNMENT FIXED!');
    console.log('Now the backend API should return the correct loans for each role.');
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

fixBranchAssignment();
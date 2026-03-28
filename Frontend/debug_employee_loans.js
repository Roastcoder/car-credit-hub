#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

async function debugEmployeeLoans() {
  const client = new Client({
    connectionString: 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh'
  });

  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    const employeeId = 30; // Pawan khangarot's user ID
    const employeeEmail = 'pawankhangarot533@gmail.com';
    
    console.log(`\n=== DEBUGGING EMPLOYEE VISIBILITY ISSUE ===`);
    console.log(`Employee ID: ${employeeId}`);
    console.log(`Employee Email: ${employeeEmail}`);
    
    // 1. Check employee details
    console.log('\n1. Employee Details:');
    const userQuery = `SELECT id, name, email, role, branch_id, status FROM users WHERE id = $1`;
    const userResult = await client.query(userQuery, [employeeId]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Branch ID: ${user.branch_id}`);
      console.log(`   Status: ${user.status}`);
    } else {
      console.log('   Employee not found!');
      return;
    }
    
    // 2. Check all loans created by this employee
    console.log('\n2. All Loans Created by This Employee:');
    const loansQuery = `
      SELECT 
        id, loan_number, applicant_name, status, created_by, branch_id, created_at
      FROM loans 
      WHERE created_by = $1 
      ORDER BY created_at DESC
    `;
    const loansResult = await client.query(loansQuery, [employeeId]);
    
    console.log(`   Found ${loansResult.rows.length} loans created by this employee:`);
    loansResult.rows.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Status: ${loan.status})`);
      console.log(`      Created: ${loan.created_at}, Branch: ${loan.branch_id}`);
    });
    
    // 3. Check the specific loan CL-2026-5486
    console.log('\n3. Specific Loan CL-2026-5486:');
    const specificLoanQuery = `
      SELECT 
        id, loan_number, applicant_name, status, created_by, branch_id, created_at
      FROM loans 
      WHERE loan_number = 'CL-2026-5486'
    `;
    const specificResult = await client.query(specificLoanQuery);
    
    if (specificResult.rows.length > 0) {
      const loan = specificResult.rows[0];
      console.log(`   Loan exists in database:`);
      console.log(`   - ID: ${loan.id}`);
      console.log(`   - Number: ${loan.loan_number}`);
      console.log(`   - Applicant: ${loan.applicant_name}`);
      console.log(`   - Created by: ${loan.created_by} (Should be ${employeeId})`);
      console.log(`   - Status: ${loan.status}`);
      console.log(`   - Branch: ${loan.branch_id}`);
      console.log(`   - Match: ${loan.created_by === employeeId ? 'YES' : 'NO'}`);
    } else {
      console.log('   Loan CL-2026-5486 not found in database!');
    }
    
    // 4. Check what the API endpoint would return
    console.log('\n4. API Filtering Logic Test:');
    console.log('   The frontend API should filter loans where created_by = user.id');
    console.log(`   For employee ${employeeId}, it should return loans where created_by = ${employeeId}`);
    
    // 5. Check if there are any authentication/session issues
    console.log('\n5. Potential Issues to Check:');
    console.log('   a) Frontend not sending correct user ID in API calls');
    console.log('   b) Backend not properly authenticating the user');
    console.log('   c) Frontend filtering logic not working correctly');
    console.log('   d) User session/token issues');
    console.log('   e) Database connection issues from frontend');
    
    // 6. Test the exact query that should be used in the API
    console.log('\n6. Testing API Query Logic:');
    const apiTestQuery = `
      SELECT 
        l.*,
        u.name as creator_name
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.created_by = $1
      ORDER BY l.created_at DESC
    `;
    
    const apiTestResult = await client.query(apiTestQuery, [employeeId]);
    console.log(`   API would return ${apiTestResult.rows.length} loans for employee ${employeeId}`);
    
    if (apiTestResult.rows.length > 0) {
      console.log('   Loans that should be visible:');
      apiTestResult.rows.forEach((loan, index) => {
        console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name}`);
      });
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

debugEmployeeLoans();
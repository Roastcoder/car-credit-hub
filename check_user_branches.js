#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

async function checkUserBranchAssignments() {
  const client = new Client({
    connectionString: 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh'
  });

  try {
    await client.connect();
    console.log('=== USER BRANCH ASSIGNMENTS & LOAN VERIFICATION ===\n');
    
    // 1. Check all users and their branch assignments
    console.log('1. USER BRANCH ASSIGNMENTS:\n');
    
    const usersQuery = `
      SELECT 
        u.id, u.name, u.email, u.role, u.branch_id, u.status,
        b.name as branch_name, b.location as branch_location
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      ORDER BY u.role, u.branch_id, u.name
    `;
    
    const usersResult = await client.query(usersQuery);
    
    const usersByRole = {};
    usersResult.rows.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });
    
    Object.keys(usersByRole).forEach(role => {
      console.log(`${role.toUpperCase()}S:`);
      usersByRole[role].forEach(user => {
        const branchInfo = user.branch_name ? 
          `Branch ${user.branch_id}: ${user.branch_name} (${user.branch_location})` : 
          `No Branch (branch_id: ${user.branch_id})`;
        console.log(`   ${user.name} (ID: ${user.id}) - ${branchInfo}`);
        console.log(`   Email: ${user.email}, Status: ${user.status}`);
        console.log('');
      });
    });
    
    // 2. Check all branches
    console.log('2. ALL BRANCHES:\n');
    
    const branchesQuery = `
      SELECT 
        b.id, b.name, b.location, b.status,
        COUNT(u.id) as user_count,
        COUNT(l.id) as loan_count
      FROM branches b
      LEFT JOIN users u ON b.id = u.branch_id
      LEFT JOIN loans l ON b.id = l.branch_id
      GROUP BY b.id, b.name, b.location, b.status
      ORDER BY b.id
    `;
    
    const branchesResult = await client.query(branchesQuery);
    
    branchesResult.rows.forEach(branch => {
      console.log(`Branch ${branch.id}: ${branch.name} (${branch.location})`);
      console.log(`   Status: ${branch.status}`);
      console.log(`   Users: ${branch.user_count}, Loans: ${branch.loan_count}`);
      console.log('');
    });
    
    // 3. Check loans and their branch assignments
    console.log('3. LOAN BRANCH ASSIGNMENTS:\n');
    
    const loansQuery = `
      SELECT 
        l.id, l.loan_number, l.applicant_name, l.status, l.created_by, l.branch_id,
        u.name as creator_name, u.role as creator_role, u.branch_id as creator_branch,
        b.name as loan_branch_name
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      LEFT JOIN branches b ON l.branch_id = b.id
      ORDER BY l.created_at DESC
      LIMIT 20
    `;
    
    const loansResult = await client.query(loansQuery);
    
    console.log(`Recent ${loansResult.rows.length} loans:`);
    loansResult.rows.forEach((loan, index) => {
      const branchMatch = loan.branch_id === loan.creator_branch ? '✅' : '❌';
      const branchInfo = loan.loan_branch_name ? 
        `Branch ${loan.branch_id}: ${loan.loan_branch_name}` : 
        `No Branch (${loan.branch_id})`;
      
      console.log(`${index + 1}. ${loan.loan_number} - ${loan.applicant_name}`);
      console.log(`   Created by: ${loan.creator_name} (${loan.creator_role}, Branch: ${loan.creator_branch})`);
      console.log(`   Loan Branch: ${branchInfo} ${branchMatch}`);
      console.log(`   Status: ${loan.status}`);
      console.log('');
    });
    
    // 4. Specific check for employee Pawan khangarot
    console.log('4. EMPLOYEE PAWAN KHANGAROT VERIFICATION:\n');
    
    const pawanQuery = `
      SELECT 
        u.id, u.name, u.email, u.role, u.branch_id,
        b.name as branch_name, b.location as branch_location
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = 30
    `;
    
    const pawanResult = await client.query(pawanQuery);
    
    if (pawanResult.rows.length > 0) {
      const pawan = pawanResult.rows[0];
      console.log(`Employee: ${pawan.name} (ID: ${pawan.id})`);
      console.log(`Email: ${pawan.email}`);
      console.log(`Role: ${pawan.role}`);
      console.log(`Branch: ${pawan.branch_id} - ${pawan.branch_name} (${pawan.branch_location})`);
      
      // Check his loans
      const pawanLoansQuery = `
        SELECT 
          l.loan_number, l.applicant_name, l.status, l.branch_id,
          b.name as loan_branch_name
        FROM loans l
        LEFT JOIN branches b ON l.branch_id = b.id
        WHERE l.created_by = 30
        ORDER BY l.created_at DESC
      `;
      
      const pawanLoansResult = await client.query(pawanLoansQuery);
      console.log(`\nHis loans (${pawanLoansResult.rows.length}):`);
      
      pawanLoansResult.rows.forEach((loan, index) => {
        const branchMatch = loan.branch_id === pawan.branch_id ? '✅ Correct' : '❌ Mismatch';
        console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name}`);
        console.log(`      Loan Branch: ${loan.branch_id} (${loan.loan_branch_name}) ${branchMatch}`);
        console.log(`      Status: ${loan.status}`);
      });
    }
    
    // 5. Check managers who should see employee's loans
    console.log('\n5. MANAGERS WHO SHOULD SEE EMPLOYEE LOANS:\n');
    
    const managersInBranch3Query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.branch_id,
        b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.role = 'manager' AND u.branch_id = 3
    `;
    
    const managersResult = await client.query(managersInBranch3Query);
    
    if (managersResult.rows.length > 0) {
      console.log('Managers in Branch 3 (should see Pawan\'s loans):');
      managersResult.rows.forEach(manager => {
        console.log(`   ${manager.name} (ID: ${manager.id}) - ${manager.branch_name}`);
      });
      
      // Check what loans they should see
      const branch3LoansQuery = `
        SELECT 
          l.loan_number, l.applicant_name, l.created_by,
          u.name as creator_name
        FROM loans l
        LEFT JOIN users u ON l.created_by = u.id
        WHERE l.branch_id = 3
        ORDER BY l.created_at DESC
      `;
      
      const branch3LoansResult = await client.query(branch3LoansQuery);
      console.log(`\nLoans in Branch 3 (${branch3LoansResult.rows.length}):`);
      
      branch3LoansResult.rows.forEach((loan, index) => {
        console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (by ${loan.creator_name})`);
      });
    } else {
      console.log('❌ No managers found in Branch 3');
    }
    
    // 6. Summary and recommendations
    console.log('\n6. SUMMARY & RECOMMENDATIONS:\n');
    
    // Check for loans without proper branch assignment
    const orphanLoansQuery = `
      SELECT COUNT(*) as count
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.branch_id IS NULL OR l.branch_id != u.branch_id
    `;
    
    const orphanResult = await client.query(orphanLoansQuery);
    const orphanCount = orphanResult.rows[0].count;
    
    if (orphanCount > 0) {
      console.log(`⚠️  Found ${orphanCount} loans with incorrect branch assignment`);
      console.log('   Run the branch assignment fix script to correct this');
    } else {
      console.log('✅ All loans have correct branch assignments');
    }
    
    console.log('\nRole-based access should work as follows:');
    console.log('• Employees see only loans where created_by = their_user_id');
    console.log('• Managers see only loans where branch_id = their_branch_id');
    console.log('• Admins see all loans');
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserBranchAssignments();
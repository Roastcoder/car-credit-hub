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
    console.log('\\n2. MANAGER FILTERING TEST');
    
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
      console.log(`\\nManagers in branch ${employeeBranchId}:`);
      
      for (const manager of managersResult.rows) {
        console.log(`\\nManager: ${manager.name} (ID: ${manager.id})`);
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
          const isEmployeeLoan = loan.created_by === 30 ? ' (Employee\\'s loan)' : '';
          console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Created by: ${loan.created_by})${isEmployeeLoan}`);
        });
      }
    } else {
      console.log(`\\n❌ No managers found in branch ${employeeBranchId}`);
      
      // Show all managers
      const allManagersQuery = `SELECT id, name, email, branch_id FROM users WHERE role = 'manager'`;
      const allManagers = await client.query(allManagersQuery);
      
      console.log('\\nAll managers in system:');
      allManagers.rows.forEach(manager => {
        console.log(`   ${manager.name} (ID: ${manager.id}, Branch: ${manager.branch_id})`);
      });
    }
    
    // 3. Check the specific issue with loan CL-2026-5486
    console.log('\\n3. SPECIFIC LOAN VISIBILITY TEST');
    console.log('Checking loan CL-2026-5486 visibility rules:\\n');
    
    const specificLoanQuery = `
      SELECT 
        l.loan_number, l.applicant_name, l.created_by, l.branch_id, l.status,
        u.name as creator_name, u.role as creator_role
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.loan_number = 'CL-2026-5486'
    `;
    
    const specificResult = await client.query(specificLoanQuery);
    
    if (specificResult.rows.length > 0) {\n      const loan = specificResult.rows[0];\n      console.log(`Loan: ${loan.loan_number} - ${loan.applicant_name}`);\n      console.log(`Created by: ${loan.creator_name} (ID: ${loan.created_by}, Role: ${loan.creator_role})`);\n      console.log(`Branch: ${loan.branch_id || 'None'}`);\n      console.log(`Status: ${loan.status}`);\n      \n      console.log('\\nVisibility Rules:');\n      console.log(`✅ Employee ${loan.creator_name} (ID: ${loan.created_by}) should see this loan (they created it)`);\n      \n      if (loan.branch_id) {\n        console.log(`✅ Managers in branch ${loan.branch_id} should see this loan`);\n      } else {\n        console.log(`⚠️  Loan has no branch_id - managers won't see it unless branch is assigned`);\n      }\n      \n      console.log(`✅ Admins and Super Admins should see this loan (they see all loans)`);\n    }\n    \n    // 4. Recommendations\n    console.log('\\n4. BACKEND API REQUIREMENTS');\n    console.log('The backend /loans endpoint should implement this filtering logic:\\n');\n    \n    console.log('```sql');\n    console.log('-- For employees: only their own loans');\n    console.log('SELECT * FROM loans WHERE created_by = current_user_id;');\n    console.log('');\n    console.log('-- For managers: all loans from their branch');\n    console.log('SELECT * FROM loans WHERE branch_id = current_user_branch_id;');\n    console.log('');\n    console.log('-- For admin/super_admin: all loans');\n    console.log('SELECT * FROM loans;');\n    console.log('```\\n');\n    \n    console.log('5. POTENTIAL ISSUES TO CHECK:');\n    console.log('   a) Backend not extracting user info from JWT token correctly');\n    console.log('   b) Backend not implementing role-based WHERE clauses');\n    console.log('   c) Frontend not sending authentication token properly');\n    console.log('   d) Loans missing branch_id assignment');\n    console.log('   e) User session/authentication issues');\n    \n  } catch (error) {\n    console.error('Database error:', error.message);\n  } finally {\n    await client.end();\n  }\n}\n\ncheckRoleBasedFiltering();", "oldStr": "#!/usr/bin/env node\n\nimport pkg from 'pg';\nconst { Client } = pkg;\n\nasync function checkRoleBasedFiltering() {\n  const client = new Client({\n    connectionString: 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh'\n  });\n\n  try {\n    await client.connect();\n    console.log('=== ROLE-BASED FILTERING VERIFICATION ===\\n');\n    \n    // 1. Check employee Pawan khangarot (ID: 30)\n    console.log('1. EMPLOYEE FILTERING TEST');\n    console.log('Employee: Pawan khangarot (ID: 30)');\n    console.log('Rule: Employees should only see loans they created (created_by = 30)\\n');\n    \n    const employeeLoansQuery = `\n      SELECT \n        loan_number, applicant_name, created_by, branch_id, status\n      FROM loans \n      WHERE created_by = 30\n      ORDER BY created_at DESC\n    `;\n    \n    const employeeResult = await client.query(employeeLoansQuery);\n    console.log(`✅ Employee should see ${employeeResult.rows.length} loans:`);\n    employeeResult.rows.forEach((loan, index) => {\n      console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Branch: ${loan.branch_id || 'None'})`);\n    });\n    \n    // 2. Check managers in the same branch as employee\n    console.log('\\n2. MANAGER FILTERING TEST');\n    \n    // First, get employee's branch\n    const employeeDetailsQuery = `SELECT branch_id FROM users WHERE id = 30`;\n    const employeeDetails = await client.query(employeeDetailsQuery);\n    const employeeBranchId = employeeDetails.rows[0]?.branch_id;\n    \n    console.log(`Employee's Branch ID: ${employeeBranchId || 'None'}`);\n    \n    // Find managers in the same branch\n    const managersQuery = `\n      SELECT id, name, email, branch_id \n      FROM users \n      WHERE role = 'manager' AND branch_id = $1\n    `;\n    \n    const managersResult = await client.query(managersQuery, [employeeBranchId]);\n    \n    if (managersResult.rows.length > 0) {\n      console.log(`\\nManagers in branch ${employeeBranchId}:`);\n      \n      for (const manager of managersResult.rows) {\n        console.log(`\\nManager: ${manager.name} (ID: ${manager.id})`);\n        console.log(`Rule: Managers should see all loans from their branch (branch_id = ${manager.branch_id})`);\n        \n        const managerLoansQuery = `\n          SELECT \n            loan_number, applicant_name, created_by, branch_id, status\n          FROM loans \n          WHERE branch_id = $1\n          ORDER BY created_at DESC\n        `;\n        \n        const managerResult = await client.query(managerLoansQuery, [manager.branch_id]);\n        console.log(`✅ Manager should see ${managerResult.rows.length} loans from branch ${manager.branch_id}:`);\n        \n        managerResult.rows.forEach((loan, index) => {\n          const isEmployeeLoan = loan.created_by === 30 ? ' (Employee\\'s loan)' : '';\n          console.log(`   ${index + 1}. ${loan.loan_number} - ${loan.applicant_name} (Created by: ${loan.created_by})${isEmployeeLoan}`);\n        });\n      }\n    } else {\n      console.log(`\\n❌ No managers found in branch ${employeeBranchId}`);\n      \n      // Show all managers\n      const allManagersQuery = `SELECT id, name, email, branch_id FROM users WHERE role = 'manager'`;\n      const allManagers = await client.query(allManagersQuery);\n      \n      console.log('\\nAll managers in system:');\n      allManagers.rows.forEach(manager => {\n        console.log(`   ${manager.name} (ID: ${manager.id}, Branch: ${manager.branch_id})`);\n      });\n    }\n    \n    // 3. Check the specific issue with loan CL-2026-5486\n    console.log('\\n3. SPECIFIC LOAN VISIBILITY TEST');\n    console.log('Checking loan CL-2026-5486 visibility rules:\\n');\n    \n    const specificLoanQuery = `\n      SELECT \n        l.loan_number, l.applicant_name, l.created_by, l.branch_id, l.status,\n        u.name as creator_name, u.role as creator_role\n      FROM loans l\n      LEFT JOIN users u ON l.created_by = u.id\n      WHERE l.loan_number = 'CL-2026-5486'\n    `;\n    \n    const specificResult = await client.query(specificLoanQuery);\n    \n    if (specificResult.rows.length > 0) {\n      const loan = specificResult.rows[0];\n      console.log(`Loan: ${loan.loan_number} - ${loan.applicant_name}`);\n      console.log(`Created by: ${loan.creator_name} (ID: ${loan.created_by}, Role: ${loan.creator_role})`);\n      console.log(`Branch: ${loan.branch_id || 'None'}`);\n      console.log(`Status: ${loan.status}`);\n      \n      console.log('\\nVisibility Rules:');\n      console.log(`✅ Employee ${loan.creator_name} (ID: ${loan.created_by}) should see this loan (they created it)`);\n      \n      if (loan.branch_id) {\n        console.log(`✅ Managers in branch ${loan.branch_id} should see this loan`);\n      } else {\n        console.log(`⚠️  Loan has no branch_id - managers won't see it unless branch is assigned`);\n      }\n      \n      console.log(`✅ Admins and Super Admins should see this loan (they see all loans)`);\n    }\n    \n    // 4. Recommendations\n    console.log('\\n4. BACKEND API REQUIREMENTS');\n    console.log('The backend /loans endpoint should implement this filtering logic:\\n');\n    \n    console.log('```sql');\n    console.log('-- For employees: only their own loans');\n    console.log('SELECT * FROM loans WHERE created_by = current_user_id;');\n    console.log('');\n    console.log('-- For managers: all loans from their branch');\n    console.log('SELECT * FROM loans WHERE branch_id = current_user_branch_id;');\n    console.log('');\n    console.log('-- For admin/super_admin: all loans');\n    console.log('SELECT * FROM loans;');\n    console.log('```\\n');\n    \n    console.log('5. POTENTIAL ISSUES TO CHECK:');\n    console.log('   a) Backend not extracting user info from JWT token correctly');\n    console.log('   b) Backend not implementing role-based WHERE clauses');\n    console.log('   c) Frontend not sending authentication token properly');\n    console.log('   d) Loans missing branch_id assignment');\n    console.log('   e) User session/authentication issues');\n    \n  } catch (error) {\n    console.error('Database error:', error.message);\n  } finally {\n    await client.end();\n  }\n}\n\ncheckRoleBasedFiltering();"}]
#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

async function checkLoanCreator() {
  const client = new Client({
    connectionString: 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh'
  });

  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    const loanId = 'CL-2026-5486';
    console.log(`\nChecking creator for loan: ${loanId}`);
    
    // Query to find the loan and its creator
    const query = `
      SELECT 
        l.id,
        l.loan_number,
        l.applicant_name,
        l.created_by,
        l.branch_id,
        l.status,
        l.created_at,
        u.name as creator_name,
        u.email as creator_email,
        u.role as creator_role,
        b.name as branch_name
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      LEFT JOIN branches b ON l.branch_id = b.id
      WHERE l.loan_number = $1 OR l.id = $1
      LIMIT 1;
    `;
    
    const result = await client.query(query, [loanId]);
    
    if (result.rows.length > 0) {
      const loan = result.rows[0];
      console.log('\n=== LOAN DETAILS ===');
      console.log(`Loan ID: ${loan.id}`);
      console.log(`Loan Number: ${loan.loan_number}`);
      console.log(`Applicant Name: ${loan.applicant_name}`);
      console.log(`Status: ${loan.status}`);
      console.log(`Created At: ${loan.created_at}`);
      console.log(`Branch ID: ${loan.branch_id}`);
      console.log(`Branch Name: ${loan.branch_name || 'N/A'}`);
      
      console.log('\n=== CREATOR DETAILS ===');
      console.log(`Created By (User ID): ${loan.created_by}`);
      console.log(`Creator Name: ${loan.creator_name || 'N/A'}`);
      console.log(`Creator Email: ${loan.creator_email || 'N/A'}`);
      console.log(`Creator Role: ${loan.creator_role || 'N/A'}`);
      
    } else {
      console.log(`\nLoan ${loanId} not found in database`);
      
      // Let's also check if there are any loans with similar IDs
      console.log('\nChecking for similar loan numbers...');
      const similarQuery = `
        SELECT loan_number, applicant_name, created_by 
        FROM loans 
        WHERE loan_number ILIKE '%2026%' OR loan_number ILIKE '%5486%'
        ORDER BY created_at DESC
        LIMIT 10;
      `;
      
      const similarResult = await client.query(similarQuery);
      if (similarResult.rows.length > 0) {
        console.log('Similar loans found:');
        similarResult.rows.forEach(row => {
          console.log(`- ${row.loan_number}: ${row.applicant_name} (Created by: ${row.created_by})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkLoanCreator();
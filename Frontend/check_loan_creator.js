#!/usr/bin/env node

const API_URL = 'https://backend.meharadvisory.cloud/api';

async function checkLoanCreator(loanId) {
  try {
    // Get auth token from localStorage (if available) or use a test token
    const token = process.env.AUTH_TOKEN || 'your-auth-token-here';
    
    console.log(`Checking creator for loan: ${loanId}`);
    console.log(`API URL: ${API_URL}`);
    
    // Query the specific loan
    const response = await fetch(`${API_URL}/loans/${loanId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.data) {
      const loan = data.data;
      console.log('\n=== Loan Details ===');
      console.log(`Loan ID: ${loan.id || loan.loan_number}`);
      console.log(`Applicant: ${loan.applicant_name}`);
      console.log(`Created By (User ID): ${loan.created_by || 'Not specified'}`);
      console.log(`Branch ID: ${loan.branch_id || 'Not specified'}`);
      console.log(`Status: ${loan.status}`);
      console.log(`Created At: ${loan.created_at}`);
      
      // If we have created_by, try to get user details
      if (loan.created_by) {
        console.log('\n=== Fetching Creator Details ===');
        try {
          const userResponse = await fetch(`${API_URL}/users/${loan.created_by}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const user = userData.data || userData;
            console.log(`Creator Name: ${user.name}`);
            console.log(`Creator Email: ${user.email}`);
            console.log(`Creator Role: ${user.role}`);
          } else {
            console.log('Could not fetch user details');
          }
        } catch (err) {
          console.log('Error fetching user details:', err.message);
        }
      }
    } else {
      console.log('Loan not found or no data returned');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Fallback: try direct database query if we have SQL access
    console.log('\n=== Fallback: Direct Database Query ===');
    console.log('If you have direct database access, run this SQL query:');
    console.log(`
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
  u.role as creator_role
FROM loans l
LEFT JOIN users u ON l.created_by = u.id
WHERE l.loan_number = '${loanId}' OR l.id = '${loanId}';
    `);
  }
}

// Run the check
const loanId = process.argv[2] || 'CL-2026-5486';
checkLoanCreator(loanId);
#!/usr/bin/env node

const API_URL = 'https://backend.meharadvisory.cloud/api';

async function testEmployeeAPI() {
  try {
    console.log('=== TESTING BACKEND API FOR EMPLOYEE ===');
    console.log(`API URL: ${API_URL}`);
    
    // First, let's try to login as the employee
    console.log('\n1. Attempting to login as employee...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'pawankhangarot533@gmail.com',
        password: 'password123' // You might need to adjust this
      })
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed, trying with demo password...');
      const demoLoginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'pawankhangarot533@gmail.com',
          password: 'Demo@1234'
        })
      });
      
      if (!demoLoginResponse.ok) {
        console.log('Demo login also failed. Let\\'s test with a generic token...');
        await testWithGenericToken();
        return;
      }
      
      const demoLoginData = await demoLoginResponse.json();
      console.log('Demo login successful!');
      await testLoansAPI(demoLoginData.token);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful!');
    await testLoansAPI(loginData.token);
    
  } catch (error) {\n    console.error('Error testing API:', error.message);\n    console.log('\\nTrying with generic approach...');\n    await testWithGenericToken();\n  }\n}\n\nasync function testLoansAPI(token) {\n  try {\n    console.log('\\n2. Fetching loans with employee token...');\n    const loansResponse = await fetch(`${API_URL}/loans`, {\n      headers: {\n        'Authorization': `Bearer ${token}`,\n        'Content-Type': 'application/json'\n      }\n    });\n    \n    if (!loansResponse.ok) {\n      console.log(`Loans API failed: ${loansResponse.status} ${loansResponse.statusText}`);\n      return;\n    }\n    \n    const loansData = await loansResponse.json();\n    console.log(`Found ${loansData.data ? loansData.data.length : 0} loans`);\n    \n    if (loansData.data && loansData.data.length > 0) {\n      console.log('\\nLoans returned by API:');\n      loansData.data.forEach((loan, index) => {\n        console.log(`${index + 1}. ${loan.loan_number || loan.id} - ${loan.applicant_name}`);\n        console.log(`   Created by: ${loan.created_by}, Status: ${loan.status}`);\n      });\n      \n      // Check if CL-2026-5486 is in the results\n      const targetLoan = loansData.data.find(loan => \n        loan.loan_number === 'CL-2026-5486' || loan.id === 'CL-2026-5486'\n      );\n      \n      if (targetLoan) {\n        console.log('\\n✅ CL-2026-5486 IS visible in the API response!');\n      } else {\n        console.log('\\n❌ CL-2026-5486 is NOT visible in the API response');\n        console.log('This indicates the backend is not returning the employee\\'s own loans');\n      }\n    } else {\n      console.log('\\n❌ No loans returned by API');\n      console.log('This indicates the backend filtering is too restrictive or there\\'s an authentication issue');\n    }\n    \n  } catch (error) {\n    console.error('Error fetching loans:', error.message);\n  }\n}\n\nasync function testWithGenericToken() {\n  console.log('\\n3. Testing API endpoints without authentication...');\n  \n  try {\n    // Test if the API is accessible at all\n    const healthResponse = await fetch(`${API_URL}/health`);\n    if (healthResponse.ok) {\n      console.log('✅ Backend API is accessible');\n    } else {\n      console.log('❌ Backend API health check failed');\n    }\n  } catch (error) {\n    console.log('❌ Cannot reach backend API:', error.message);\n  }\n  \n  console.log('\\n=== RECOMMENDATIONS ===');\n  console.log('1. Check if the backend properly implements role-based filtering in the /loans endpoint');\n  console.log('2. Verify that the backend authenticates users correctly and extracts user info from JWT tokens');\n  console.log('3. Ensure the backend filters loans WHERE created_by = current_user_id for employees');\n  console.log('4. Check backend logs for any errors when the employee tries to fetch loans');\n  console.log('5. Verify the employee\\'s authentication token is valid and contains correct user information');\n}\n\ntestEmployeeAPI();", "oldStr": "#!/usr/bin/env node\n\nconst API_URL = 'https://backend.meharadvisory.cloud/api';\n\nasync function testEmployeeAPI() {\n  try {\n    console.log('=== TESTING BACKEND API FOR EMPLOYEE ===');\n    console.log(`API URL: ${API_URL}`);\n    \n    // First, let's try to login as the employee\n    console.log('\\n1. Attempting to login as employee...');\n    const loginResponse = await fetch(`${API_URL}/auth/login`, {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify({\n        email: 'pawankhangarot533@gmail.com',\n        password: 'password123' // You might need to adjust this\n      })\n    });\n    \n    if (!loginResponse.ok) {\n      console.log('Login failed, trying with demo password...');\n      const demoLoginResponse = await fetch(`${API_URL}/auth/login`, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({\n          email: 'pawankhangarot533@gmail.com',\n          password: 'Demo@1234'\n        })\n      });\n      \n      if (!demoLoginResponse.ok) {\n        console.log('Demo login also failed. Let\\'s test with a generic token...');\n        await testWithGenericToken();\n        return;\n      }\n      \n      const demoLoginData = await demoLoginResponse.json();\n      console.log('Demo login successful!');\n      await testLoansAPI(demoLoginData.token);\n      return;\n    }\n    \n    const loginData = await loginResponse.json();\n    console.log('Login successful!');\n    await testLoansAPI(loginData.token);\n    \n  } catch (error) {\n    console.error('Error testing API:', error.message);\n    console.log('\\nTrying with generic approach...');\n    await testWithGenericToken();\n  }\n}\n\nasync function testLoansAPI(token) {\n  try {\n    console.log('\\n2. Fetching loans with employee token...');\n    const loansResponse = await fetch(`${API_URL}/loans`, {\n      headers: {\n        'Authorization': `Bearer ${token}`,\n        'Content-Type': 'application/json'\n      }\n    });\n    \n    if (!loansResponse.ok) {\n      console.log(`Loans API failed: ${loansResponse.status} ${loansResponse.statusText}`);\n      return;\n    }\n    \n    const loansData = await loansResponse.json();\n    console.log(`Found ${loansData.data ? loansData.data.length : 0} loans`);\n    \n    if (loansData.data && loansData.data.length > 0) {\n      console.log('\\nLoans returned by API:');\n      loansData.data.forEach((loan, index) => {\n        console.log(`${index + 1}. ${loan.loan_number || loan.id} - ${loan.applicant_name}`);\n        console.log(`   Created by: ${loan.created_by}, Status: ${loan.status}`);\n      });\n      \n      // Check if CL-2026-5486 is in the results\n      const targetLoan = loansData.data.find(loan => \n        loan.loan_number === 'CL-2026-5486' || loan.id === 'CL-2026-5486'\n      );\n      \n      if (targetLoan) {\n        console.log('\\n✅ CL-2026-5486 IS visible in the API response!');\n      } else {\n        console.log('\\n❌ CL-2026-5486 is NOT visible in the API response');\n        console.log('This indicates the backend is not returning the employee\\'s own loans');\n      }\n    } else {\n      console.log('\\n❌ No loans returned by API');\n      console.log('This indicates the backend filtering is too restrictive or there\\'s an authentication issue');\n    }\n    \n  } catch (error) {\n    console.error('Error fetching loans:', error.message);\n  }\n}\n\nasync function testWithGenericToken() {\n  console.log('\\n3. Testing API endpoints without authentication...');\n  \n  try {\n    // Test if the API is accessible at all\n    const healthResponse = await fetch(`${API_URL}/health`);\n    if (healthResponse.ok) {\n      console.log('✅ Backend API is accessible');\n    } else {\n      console.log('❌ Backend API health check failed');\n    }\n  } catch (error) {\n    console.log('❌ Cannot reach backend API:', error.message);\n  }\n  \n  console.log('\\n=== RECOMMENDATIONS ===');\n  console.log('1. Check if the backend properly implements role-based filtering in the /loans endpoint');\n  console.log('2. Verify that the backend authenticates users correctly and extracts user info from JWT tokens');\n  console.log('3. Ensure the backend filters loans WHERE created_by = current_user_id for employees');\n  console.log('4. Check backend logs for any errors when the employee tries to fetch loans');\n  console.log('5. Verify the employee\\'s authentication token is valid and contains correct user information');\n}\n\ntestEmployeeAPI();"}]
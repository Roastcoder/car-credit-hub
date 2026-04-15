import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh';

async function checkPaymentProofs() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query(`
      SELECT id, applicant_name, utr_number, payment_proof_path, created_at 
      FROM payment_applications 
      WHERE payment_proof_path IS NOT NULL AND payment_proof_path != '' 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);

    if (res.rows.length === 0) {
      console.log('No payment applications with uploaded proofs found.');
    } else {
      console.log(`Found ${res.rows.length} applications with uploaded proofs:`);
      res.rows.forEach(row => {
        console.log(`- ID: ${row.id}, Applicant: ${row.applicant_name}, UTR: ${row.utr_number}, Proof Path: ${row.payment_proof_path}, Created At: ${row.created_at}`);
      });
    }

    const totalCount = await client.query("SELECT COUNT(*) FROM payment_applications WHERE payment_proof_path IS NOT NULL AND payment_proof_path != '';");
    console.log(`Total payment proofs in database: ${totalCount.rows[0].count}`);

  } catch (err) {
    console.error('Error connecting to database:', err.message);
  } finally {
    await client.end();
  }
}

checkPaymentProofs();

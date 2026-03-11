#!/usr/bin/env node

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection string
const connectionString = 'postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh';

async function updateFinancers() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'update_financers.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute SQL
    await client.query(sql);
    console.log('✅ Financers updated successfully!');

    // Verify the data
    const result = await client.query('SELECT id, name, code FROM financers ORDER BY name');
    console.log('\n📋 Updated Financers:');
    result.rows.forEach(row => {
      console.log(`${row.id}. ${row.name} (${row.code})`);
    });

  } catch (error) {
    console.error('❌ Error updating financers:', error.message);
  } finally {
    await client.end();
  }
}

updateFinancers();
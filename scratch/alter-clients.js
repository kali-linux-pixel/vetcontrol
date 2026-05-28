import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    console.log('Adding conversation_mode column to clients table...');
    
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS conversation_mode VARCHAR(50) DEFAULT 'ai' NOT NULL
    `;
    
    console.log('Column conversation_mode added successfully.');

    // Verify schema
    const columns = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'clients'
    `;
    console.log('Clients columns:', columns.map(c => `${c.column_name}: ${c.data_type}`));

  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    await sql.end();
  }
}

run();

import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    console.log('Altering messages and clients tables for Phase 2...');
    
    // Add status to messages
    await sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'sent' NOT NULL
    `;
    console.log('Column "status" added to "messages" table.');

    // Add internal_notes to clients
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS internal_notes TEXT
    `;
    console.log('Column "internal_notes" added to "clients" table.');

    // Add last_seen_at to clients
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE
    `;
    console.log('Column "last_seen_at" added to "clients" table.');

    console.log('Schema migration completed successfully.');

  } catch (err) {
    console.error('Error altering database:', err);
  } finally {
    await sql.end();
  }
}

run();

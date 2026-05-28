import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    console.log('Creating tables...');
    
    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        phone VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;
    console.log('Table "messages" created successfully.');

    // Create whatsapp_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
        session_data TEXT,
        status VARCHAR(50) DEFAULT 'disconnected' NOT NULL,
        qr TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;
    console.log('Table "whatsapp_sessions" created successfully.');

    // List tables to confirm
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables now in database:', tables.map(t => t.table_name));

  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await sql.end();
  }
}

run();

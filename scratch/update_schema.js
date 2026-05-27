const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
let databaseUrl;
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const databaseUrlLine = envFile.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));
    if (databaseUrlLine) {
      databaseUrl = databaseUrlLine.split('DATABASE_URL=')[1].trim();
    }
  }
} catch (err) {
  console.error("Could not parse .env.local:", err.message);
}

if (!databaseUrl) {
  console.error("Error: DATABASE_URL not found in .env.local.");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function run() {
  try {
    console.log("Connected to PostgreSQL database. Checking schema updates...");

    // 1. Update clients table
    console.log("Updating 'clients' table columns...");
    
    // Add optional columns if they do not exist
    await sql.unsafe(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS dni varchar(20),
      ADD COLUMN IF NOT EXISTS address varchar(255);
    `);

    // Make email column optional (nullable)
    await sql.unsafe(`
      ALTER TABLE clients 
      ALTER COLUMN email DROP NOT NULL;
    `);

    // 2. Update pets table
    console.log("Updating 'pets' table columns...");
    await sql.unsafe(`
      ALTER TABLE pets 
      ADD COLUMN IF NOT EXISTS sex varchar(20),
      ADD COLUMN IF NOT EXISTS weight varchar(50);
    `);

    // 3. Create clinical_records table
    console.log("Creating 'clinical_records' table if not exists...");
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS clinical_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
        pet_id uuid REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
        weight varchar(50),
        allergies text,
        diseases text,
        vaccines text,
        operations text,
        medicaments text,
        notes text,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    console.log("SCHEMA UPDATED SUCCESSFULLY! All new fields (dni, address, sex, weight) and 'clinical_records' table are configured.");
  } catch (err) {
    console.error("Failed to run schema updates:", err);
  } finally {
    await sql.end();
  }
}

run();

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
      // Remove quotes if any
      databaseUrl = databaseUrl.replace(/^['"]|['"]$/g, '');
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
    console.log("Connected to PostgreSQL database. Applying search performance indexes...");

    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_clients_org_name ON clients (organization_id, name);
      CREATE INDEX IF NOT EXISTS idx_clients_org_dni ON clients (organization_id, dni);
      CREATE INDEX IF NOT EXISTS idx_clients_org_phone ON clients (organization_id, phone);
      CREATE INDEX IF NOT EXISTS idx_pets_org_name ON pets (organization_id, name);
      CREATE INDEX IF NOT EXISTS idx_pets_org_breed ON pets (organization_id, breed);
      CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON appointments (organization_id, date);
    `);

    console.log("SQL SEARCH INDEXES CREATED SUCCESSFULLY!");
  } catch (err) {
    console.error("Failed to run SQL index updates:", err);
  } finally {
    await sql.end();
  }
}

run();

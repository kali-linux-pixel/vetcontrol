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
    console.log("Connected to PostgreSQL database. Applying WhatsApp schema updates...");

    // 1. Update organizations table
    console.log("Updating 'organizations' table columns...");
    await sql.unsafe(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS whatsapp_phone varchar(50),
      ADD COLUMN IF NOT EXISTS whatsapp_provider varchar(50) DEFAULT 'mock' NOT NULL,
      ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id varchar(255),
      ADD COLUMN IF NOT EXISTS whatsapp_business_id varchar(255),
      ADD COLUMN IF NOT EXISTS whatsapp_access_token text,
      
      ADD COLUMN IF NOT EXISTS template_confirmation text,
      ADD COLUMN IF NOT EXISTS template_reminder text,
      ADD COLUMN IF NOT EXISTS template_vaccine text,
      ADD COLUMN IF NOT EXISTS template_followup text,
      ADD COLUMN IF NOT EXISTS template_deworming text,
      ADD COLUMN IF NOT EXISTS template_cancelled text,

      ADD COLUMN IF NOT EXISTS auto_confirmation_enabled boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS auto_reminder_enabled boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS auto_vaccine_enabled boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS auto_followup_enabled boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS auto_deworming_enabled boolean DEFAULT true NOT NULL;
    `);

    // 2. Create whatsapp_queue table
    console.log("Creating 'whatsapp_queue' table if not exists...");
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS whatsapp_queue (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
        phone varchar(50) NOT NULL,
        message text NOT NULL,
        status varchar(50) DEFAULT 'pending' NOT NULL,
        error_message text,
        attempts integer DEFAULT 0 NOT NULL,
        scheduled_at timestamp with time zone DEFAULT now() NOT NULL,
        sent_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    console.log("WHATSAPP SCHEMA UPDATED SUCCESSFULLY!");
  } catch (err) {
    console.error("Failed to run WhatsApp schema updates:", err);
  } finally {
    await sql.end();
  }
}

run();

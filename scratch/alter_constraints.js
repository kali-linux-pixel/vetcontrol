const postgres = require('postgres');
// Parse .env.local manually
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const databaseUrlLine = envFile.split('\n').find(line => line.startsWith('DATABASE_URL='));
const databaseUrl = databaseUrlLine.split('DATABASE_URL=')[1].trim();

const sql = postgres(databaseUrl);

async function run() {
  try {
    console.log("Connected to database. Checking check constraints...");

    // Find all check constraints on appointments, inventory_items, sales
    const constraints = await sql`
      SELECT conname, relname
      FROM pg_constraint c
      JOIN pg_class r ON c.conrelid = r.oid
      JOIN pg_namespace n ON r.relnamespace = n.oid
      WHERE r.relname IN ('appointments', 'inventory_items', 'sales')
        AND c.contype = 'c';
    `;

    console.log("Found check constraints:", constraints);

    for (const c of constraints) {
      console.log(`Dropping check constraint ${c.conname} on table ${c.relname}...`);
      await sql.unsafe(`ALTER TABLE ${c.relname} DROP CONSTRAINT IF EXISTS ${c.conname};`);
    }

    console.log("Adding new Spanish/English check constraints...");
    
    // 1. Inventory Items Category check
    await sql`
      ALTER TABLE inventory_items 
      ADD CONSTRAINT chk_inventory_category 
      CHECK (category IN ('medicamento', 'comida', 'equipamiento', 'insumos', 'Medication', 'Food', 'Equipment', 'Supplies'));
    `;

    // 2. Sales Status check
    await sql`
      ALTER TABLE sales 
      ADD CONSTRAINT chk_sales_status 
      CHECK (status IN ('Pagado', 'Pendiente', 'Reembolsado', 'Paid', 'Pending', 'Refunded'));
    `;

    // 3. Appointments Type check
    await sql`
      ALTER TABLE appointments 
      ADD CONSTRAINT chk_appointments_type 
      CHECK (type IN ('Consulta', 'Cirugía', 'Vacunación', 'Control', 'Dental', 'Estética', 'Consultation', 'Surgery', 'Vaccination', 'Check-up', 'Dental', 'Grooming'));
    `;

    // 4. Appointments Status check
    await sql`
      ALTER TABLE appointments 
      ADD CONSTRAINT chk_appointments_status 
      CHECK (status IN ('Programada', 'En Espera', 'En Curso', 'Completada', 'Cancelada', 'Scheduled', 'Checked-in', 'In-Progress', 'Completed', 'Cancelled'));
    `;

    console.log("CHECK constraints updated successfully to support both Spanish and English!");
  } catch (err) {
    console.error("Failed to update constraints:", err);
  } finally {
    await sql.end();
  }
}

run();

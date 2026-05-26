import { pgTable, uuid, varchar, text, timestamp, integer, decimal } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Organizations (Tenants)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  
  // Monetization/SaaS Fields
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free_trial').notNull(), // 'free_trial', 'starter', 'professional'
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('trialing').notNull(), // 'trialing', 'active', 'canceled', 'expired'
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionEndsAt: timestamp('subscription_ends_at', { withTimezone: true }),
});

// 2. Profiles (User links to Auth & Tenants)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // maps to auth.users.id
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('veterinarian').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Clients
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  joinedDate: timestamp('joined_date', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Pets (Patients)
export const pets = pgTable('pets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  species: varchar('species', { length: 50 }).notNull(), // 'dog', 'cat', 'bird', 'rabbit', 'other'
  breed: varchar('breed', { length: 255 }).notNull(),
  age: varchar('age', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  lastVisit: varchar('last_visit', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Appointments
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
  date: varchar('date', { length: 50 }).notNull(),
  time: varchar('time', { length: 50 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'Consultation', 'Surgery', 'Vaccination', 'Check-up', 'Dental', 'Grooming'
  status: varchar('status', { length: 50 }).notNull(), // 'Scheduled', 'Checked-in', 'In-Progress', 'Completed', 'Cancelled'
  veterinarian: varchar('veterinarian', { length: 255 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Inventory Items
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'Medication', 'Food', 'Equipment', 'Supplies'
  stock: integer('stock').default(0).notNull(),
  minStock: integer('min_stock').default(0).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Sales (Invoices)
export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  date: varchar('date', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'Paid', 'Pending', 'Refunded'
  itemDescription: text('item_description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

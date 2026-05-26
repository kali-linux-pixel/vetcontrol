import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

// Single connection client configuration (production-safe for serverless runtimes)
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });

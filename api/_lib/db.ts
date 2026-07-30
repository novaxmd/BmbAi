// Shared Neon Postgres client.
// Requires DATABASE_URL to be set in Vercel Environment Variables
// (the Neon connection string, e.g. postgres://user:pass@host/dbname?sslmode=require)

import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured on the server.');
  return neon(url);
}

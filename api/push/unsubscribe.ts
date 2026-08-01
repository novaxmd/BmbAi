import { getDb } from '../_lib/db';
import { json } from '../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const sql = getDb();
    const body = await request.json();
    if (!body.endpoint) return json({ error: 'endpoint is required' }, 400);

    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${body.endpoint}`;

    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
                                     }

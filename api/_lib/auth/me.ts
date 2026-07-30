import { getDb } from '../_lib/db';
import { getUserFromSession, json } from '../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const sql = getDb();
    const user = await getUserFromSession(request, sql);
    return json({ user });
  } catch (err: any) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
}

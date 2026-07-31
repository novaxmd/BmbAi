import { getDb } from '../_lib/db';
import { getCookie, clearSessionCookieHeader, json } from '../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const sql = getDb();
    const token = getCookie(request, 'bmb_ai_session');
    if (token) {
      await sql`DELETE FROM sessions WHERE token = ${token}`;
    }
    return json({ success: true }, 200, { 'Set-Cookie': clearSessionCookieHeader() });
  } catch (err: any) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
}

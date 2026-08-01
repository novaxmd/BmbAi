import { getDb } from '../_lib/db';
import { getUserFromSession, newId, json } from '../_lib/auth';

export const config = { runtime: 'edge' };

interface SubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const sql = getDb();
    const body: SubscribeBody = await request.json();

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return json({ error: 'endpoint and keys are required' }, 400);
    }

    // Attach to the logged-in user if there is one (optional — guests can subscribe too)
    const user = await getUserFromSession(request, sql).catch(() => null);

    const id = newId();
    await sql`
      INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, user_id)
      VALUES (${id}, ${body.endpoint}, ${body.keys.p256dh}, ${body.keys.auth}, ${user?.id || null})
      ON CONFLICT (endpoint) DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_id = EXCLUDED.user_id
    `;

    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
}

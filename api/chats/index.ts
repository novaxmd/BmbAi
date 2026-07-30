import { getDb } from '../_lib/db';
import { getUserFromSession, newId, json } from '../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const sql = getDb();
  const user = await getUserFromSession(request, sql);
  if (!user) return json({ error: 'Login required' }, 401);

  if (request.method === 'GET') {
    const chats = await sql`
      SELECT id, title, provider, created_at, updated_at
      FROM chats
      WHERE user_id = ${user.id}
      ORDER BY updated_at DESC
      LIMIT 100
    `;
    return json({ chats });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = newId();
    const title = body.title || 'New Chat';
    const provider = body.provider || 'gemini';

    await sql`
      INSERT INTO chats (id, user_id, title, provider)
      VALUES (${id}, ${user.id}, ${title}, ${provider})
    `;

    return json({ chat: { id, title, provider } });
  }

  return json({ error: 'Method not allowed' }, 405);
}

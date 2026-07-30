import { getDb } from '../../_lib/db';
import { getUserFromSession, newId, json } from '../../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const sql = getDb();
  const user = await getUserFromSession(request, sql);
  if (!user) return json({ error: 'Login required' }, 401);

  const url = new URL(request.url);
  // path is /api/chats/{id}/messages
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts[parts.length - 2];
  if (!id) return json({ error: 'Chat id is required' }, 400);

  const chatRows = await sql`SELECT user_id FROM chats WHERE id = ${id} LIMIT 1`;
  const chat = chatRows[0] as any;
  if (!chat) return json({ error: 'Chat not found' }, 404);
  if (chat.user_id !== user.id) return json({ error: 'Not authorized' }, 403);

  const body = await request.json().catch(() => ({}));
  if (!body.role || !body.content) {
    return json({ error: 'role and content are required' }, 400);
  }

  const messageId = newId();
  await sql`
    INSERT INTO messages (id, chat_id, role, content)
    VALUES (${messageId}, ${id}, ${body.role}, ${body.content})
  `;
  await sql`UPDATE chats SET updated_at = now() WHERE id = ${id}`;

  return json({ id: messageId });
}

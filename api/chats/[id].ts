import { getDb } from '../_lib/db';
import { getUserFromSession, json } from '../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const sql = getDb();
  const user = await getUserFromSession(request, sql);
  if (!user) return json({ error: 'Login required' }, 401);

  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) return json({ error: 'Chat id is required' }, 400);

  // Ownership check
  const chatRows = await sql`SELECT * FROM chats WHERE id = ${id} LIMIT 1`;
  const chat = chatRows[0] as any;
  if (!chat) return json({ error: 'Chat not found' }, 404);
  if (chat.user_id !== user.id) return json({ error: 'Not authorized' }, 403);

  if (request.method === 'GET') {
    const messages = await sql`
      SELECT id, role, content, created_at
      FROM messages
      WHERE chat_id = ${id}
      ORDER BY created_at ASC
    `;
    return json({ chat, messages });
  }

  if (request.method === 'PATCH') {
    const body = await request.json().catch(() => ({}));
    if (body.title) {
      await sql`UPDATE chats SET title = ${body.title}, updated_at = now() WHERE id = ${id}`;
    }
    return json({ success: true });
  }

  if (request.method === 'DELETE') {
    try {
      const result = await sql`DELETE FROM chats WHERE id = ${id} RETURNING id`;
      if (!result || result.length === 0) {
        return json({ error: 'Delete affected 0 rows — chat may already be gone' }, 404);
      }
      return json({ success: true, deletedId: result[0].id });
    } catch (err: any) {
      console.error('Failed to delete chat:', err);
      return json({ error: err.message || 'Failed to delete chat' }, 500);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}

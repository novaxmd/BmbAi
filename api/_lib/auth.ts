// Shared session + cookie helpers used across api/auth/* and api/chats/* routes.

export function newId(): string {
  return crypto.randomUUID();
}

export function newSessionToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookieHeader(token: string, maxAgeSeconds: number): string {
  return `bmb_ai_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader(): string {
  return `bmb_ai_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export interface SessionUser {
  id: string;
  provider: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export async function getUserFromSession(request: Request, sql: ReturnType<typeof import('@neondatabase/serverless').neon>): Promise<SessionUser | null> {
  const token = getCookie(request, 'bmb_ai_session');
  if (!token) return null;

  const rows = await sql`
    SELECT u.id, u.provider, u.name, u.email, u.avatar_url, s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;

  const row = rows[0] as any;
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  return {
    id: row.id,
    provider: row.provider,
    name: row.name,
    email: row.email,
    avatar_url: row.avatar_url,
  };
}

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

// GET /api/auth/github/callback — GitHub redirects here after user approves login.
import { getDb } from '../../_lib/db';
import { newId, newSessionToken, sessionCookieHeader, getCookie } from '../../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = getCookie(request, 'bmb_oauth_state');

  if (!code || !state || state !== savedState) {
    return new Response('Invalid OAuth state. Please try logging in again.', { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth is not configured on the server.', { status: 500 });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${url.origin}/api/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to obtain GitHub access token');
    }

    // Fetch profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'Bmb-Ai' },
    });
    const profile = await profileRes.json();

    // Fetch primary email (GitHub /user doesn't always include it)
    let email: string | null = profile.email || null;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'Bmb-Ai' },
      });
      const emails = await emailsRes.json();
      email = Array.isArray(emails) ? (emails.find((e: any) => e.primary)?.email || emails[0]?.email || null) : null;
    }

    const sql = getDb();
    const userId = `github:${profile.id}`;

    await sql`
      INSERT INTO users (id, provider, provider_account_id, name, email, avatar_url)
      VALUES (${userId}, 'github', ${String(profile.id)}, ${profile.name || profile.login}, ${email}, ${profile.avatar_url})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url
    `;

    const token = newSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expiresAt})`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/`,
        'Set-Cookie': sessionCookieHeader(token, 30 * 24 * 60 * 60),
      },
    });
  } catch (err: any) {
    return new Response(`GitHub login failed: ${err.message}`, { status: 500 });
  }
}

// GET /api/auth/google/callback — Google redirects here after user approves login.
import { getDb } from '../../_lib/db';
import { newSessionToken, sessionCookieHeader, getCookie } from '../../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = getCookie(request, 'bmb_oauth_state');

  if (!code || !state || state !== savedState) {
    return new Response('Invalid OAuth state. Please try logging in again.', { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response('Google OAuth is not configured on the server.', { status: 500 });
  }

  try {
    const redirectUri = `${url.origin}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to obtain Google access token');
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    const sql = getDb();
    const userId = `google:${profile.id}`;

    await sql`
      INSERT INTO users (id, provider, provider_account_id, name, email, avatar_url)
      VALUES (${userId}, 'google', ${String(profile.id)}, ${profile.name}, ${profile.email}, ${profile.picture})
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
    return new Response(`Google login failed: ${err.message}`, { status: 500 });
  }
}

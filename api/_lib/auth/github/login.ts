// GET /api/auth/github/login — redirects the browser to GitHub's OAuth consent screen.
export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('GITHUB_CLIENT_ID is not configured on the server.', { status: 500 });
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/github/callback`;

  const state = crypto.randomUUID();

  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', clientId);
  githubUrl.searchParams.set('redirect_uri', redirectUri);
  githubUrl.searchParams.set('scope', 'read:user user:email');
  githubUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: githubUrl.toString(),
      'Set-Cookie': `bmb_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

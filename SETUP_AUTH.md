# Bmb Ai — Chat History & Login Setup

This adds: a sidebar menu (chat history, delete, resume, settings), GitHub/Google
login, and a "sign in" prompt after 15 messages for guests.

## 1. Database (Neon Postgres)

Run `db/schema.sql` once against your Neon database — either paste it into the
Neon SQL Editor (dashboard) or run:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## 2. GitHub OAuth App

Create one at https://github.com/settings/developers → "New OAuth App":
- Homepage URL: `https://your-domain.vercel.app`
- Authorization callback URL: `https://your-domain.vercel.app/api/auth/github/callback`

You'll get a **Client ID** and can generate a **Client Secret**.

## 3. Google OAuth Client

Create one at https://console.cloud.google.com → APIs & Services → Credentials
→ "Create Credentials" → "OAuth client ID" → Web application:
- Authorized redirect URI: `https://your-domain.vercel.app/api/auth/google/callback`

You'll get a **Client ID** and **Client Secret**.

## 4. Vercel Environment Variables

In your Vercel project → Settings → Environment Variables, add (all server-side,
**no** `VITE_` prefix):

| Name | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `GITHUB_CLIENT_ID` | From step 2 |
| `GITHUB_CLIENT_SECRET` | From step 2 |
| `GOOGLE_CLIENT_ID` | From step 3 |
| `GOOGLE_CLIENT_SECRET` | From step 3 |
| `GROQ_API_KEY` | Your Groq key |
| `ANTHROPIC_API_KEY` | Your Claude key |
| `OPENAI_API_KEY` | Your OpenAI key |

Redeploy after adding these.

## How it works

- Guests can chat freely. After **15 user messages** in a session, a modal
  prompts them to sign in with GitHub or Google to save their history.
- Once signed in, every message is saved automatically to Postgres.
- The menu button (top-left, where the `>_` icon used to be) opens a sidebar
  showing all saved chats — tap one to resume, tap the trash icon to delete.
- "Settings" inside that same sidebar shows the logged-in account and a
  Log out button (or the GitHub/Google buttons if not signed in).

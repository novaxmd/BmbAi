// Vercel Serverless Function: /api/gemini-chat
// Backend proxy for Gemini chat, alongside the existing frontend-direct call in
// src/services/chatService.ts. The GEMINI_API_KEY used here stays server-side
// (Vercel Environment Variable, NOT prefixed with VITE_) and is separate from
// any frontend-exposed Gemini key.
//
// Required Vercel env var: GEMINI_API_KEY

export const config = {
  runtime: 'edge',
};

interface GeminiChatRequestBody {
  systemInstruction?: string;
  messages: { role: 'user' | 'model'; text: string }[];
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body: GeminiChatRequestBody = await request.json();
    if (!body.messages || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages are required' }), { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: body.messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
          systemInstruction: body.systemInstruction
            ? { parts: [{ text: body.systemInstruction }] }
            : undefined,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini request failed');

    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

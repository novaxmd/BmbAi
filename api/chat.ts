// Vercel Serverless Function: /api/chat
// Proxies chat/completion requests to Groq, Claude (Anthropic), or OpenAI.
// API keys stay server-side (Vercel Environment Variables) and are never sent to the browser.
//
// Required Vercel env vars (Project Settings -> Environment Variables, NOT prefixed with VITE_):
//   GROQ_API_KEY
//   ANTHROPIC_API_KEY
//   OPENAI_API_KEY

export const config = {
  runtime: 'edge',
};

interface ChatRequestBody {
  provider: 'groq' | 'claude' | 'openai';
  model?: string;
  systemInstruction?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

const DEFAULT_MODELS: Record<string, string> = {
  groq: 'llama-3.3-70b-versatile',
  claude: 'claude-sonnet-4-5-20250929',
  openai: 'gpt-4o',
};

async function callGroq(body: ChatRequestBody) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured on the server.');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: body.model || DEFAULT_MODELS.groq,
      messages: [
        ...(body.systemInstruction ? [{ role: 'system', content: body.systemInstruction }] : []),
        ...body.messages,
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq request failed');
  return data.choices?.[0]?.message?.content || '';
}

async function callClaude(body: ChatRequestBody) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured on the server.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: body.model || DEFAULT_MODELS.claude,
      max_tokens: 4096,
      system: body.systemInstruction,
      messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Claude request failed');
  return data.content?.map((c: any) => c.text).join('') || '';
}

async function callOpenAI(body: ChatRequestBody) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured on the server.');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: body.model || DEFAULT_MODELS.openai,
      messages: [
        ...(body.systemInstruction ? [{ role: 'system', content: body.systemInstruction }] : []),
        ...body.messages,
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'OpenAI request failed');
  return data.choices?.[0]?.message?.content || '';
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body: ChatRequestBody = await request.json();

    if (!body.provider || !body.messages) {
      return new Response(JSON.stringify({ error: 'provider and messages are required' }), { status: 400 });
    }

    let text: string;
    switch (body.provider) {
      case 'groq':
        text = await callGroq(body);
        break;
      case 'claude':
        text = await callClaude(body);
        break;
      case 'openai':
        text = await callOpenAI(body);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 400 });
    }

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

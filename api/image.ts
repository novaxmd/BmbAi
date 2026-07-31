// Vercel Serverless Function: /api/image
// Proxies image-generation requests to OpenAI (gpt-image-1 / DALL-E).
// Claude and Groq do not offer image generation, so only 'openai' is supported here.
//
// Required Vercel env var: OPENAI_API_KEY

export const config = {
  runtime: 'edge',
};

interface ImageRequestBody {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body: ImageRequestBody = await request.json();
    if (!body.prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured on the server.');

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: body.prompt,
        size: body.size || '1024x1024',
        n: 1,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'OpenAI image request failed');

    // gpt-image-1 returns base64 by default
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;

    return new Response(JSON.stringify({
      imageUrl: url || (b64 ? `data:image/png;base64,${b64}` : null),
    }), {
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

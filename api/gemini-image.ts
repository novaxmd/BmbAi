// Vercel Serverless Function: /api/gemini-image
// Backend proxy for Gemini image generation (Nano Banana / gemini-2.5-flash-image),
// alongside the existing frontend-direct call in src/services/imageService.ts.
//
// Required Vercel env var: GEMINI_API_KEY

export const config = {
  runtime: 'edge',
};

interface GeminiImageRequestBody {
  prompt: string;
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body: GeminiImageRequestBody = await request.json();
    if (!body.prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: body.prompt }] }],
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini image request failed');

    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);
    if (!imagePart) throw new Error('No image data received from Gemini.');

    const imageUrl = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;

    return new Response(JSON.stringify({ imageUrl }), {
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

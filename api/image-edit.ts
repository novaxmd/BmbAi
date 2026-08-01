// Vercel Serverless Function: /api/image-edit
// Proxies image-to-image edit requests to OpenAI (gpt-image-1 edits endpoint).
// Takes an existing image + a text prompt describing the change, and returns
// a new generated image. Claude and Groq do not support this, so OpenAI only.
//
// Required Vercel env var: OPENAI_API_KEY

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured on the server.');

    const incomingForm = await request.formData();
    const imageFile = incomingForm.get('image');
    const prompt = incomingForm.get('prompt');

    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'image file is required' }), { status: 400 });
    }
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'prompt is required' }), { status: 400 });
    }

    const outgoingForm = new FormData();
    outgoingForm.append('model', 'gpt-image-1');
    outgoingForm.append('image', imageFile, imageFile.name || 'image.png');
    outgoingForm.append('prompt', prompt);
    outgoingForm.append('size', '1024x1024');
    outgoingForm.append('n', '1');

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outgoingForm,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'OpenAI image edit request failed');

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

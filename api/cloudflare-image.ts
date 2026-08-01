// Vercel Serverless Function: /api/cloudflare-image
// Proxies text-to-image requests to Cloudflare Workers AI (FLUX-1-schnell model — free).
//
// Required Vercel env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN

export const config = {
  runtime: 'edge',
};

interface CloudflareImageRequestBody {
  prompt: string;
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body: CloudflareImageRequestBody = await request.json();
    if (!body.prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), { status: 400 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN are not configured on the server.');
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ prompt: body.prompt }),
      }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      const errMsg = data.errors?.[0]?.message || 'Cloudflare Workers AI request failed';
      throw new Error(errMsg);
    }

    // FLUX-1-schnell returns { result: { image: "<base64>" } }
    const base64Image = data.result?.image;
    if (!base64Image) throw new Error('No image data received from Cloudflare Workers AI.');

    return new Response(JSON.stringify({
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
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

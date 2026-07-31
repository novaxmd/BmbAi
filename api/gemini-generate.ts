// Vercel Serverless Function: /api/gemini-generate
// Backend proxy for Gemini website generation (Code Studio's "AI Website Builder"),
// alongside the existing frontend-direct call in src/services/geminiService.ts.
//
// Required Vercel env var: GEMINI_API_KEY

export const config = {
  runtime: 'edge',
};

interface GeminiGenerateRequestBody {
  prompt: string;
}

const SYSTEM_INSTRUCTION = `
You are an expert full-stack web developer and UI/UX designer.
Your task is to generate a COMPLETE, SINGLE-FILE HTML solution (containing internal CSS and JS) based on the user's request.

Rules:
1. The code must be a valid HTML5 document.
2. Include modern, beautiful CSS (use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>).
3. Include interactive JavaScript if the prompt implies functionality.
4. DO NOT return markdown formatting (no \`\`\`html or \`\`\`).
5. Return ONLY the raw code.
6. Make it look professional, like a real deployed website.
7. Ensure the design is responsive and modern.
`;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body: GeminiGenerateRequestBody = await request.json();
    if (!body.prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: body.prompt }] }],
          systemInstruction: { parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nUser Request: "${body.prompt}"` }] },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini request failed');

    let code = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
    code = code.replace(/```html/g, '').replace(/```/g, '').trim();

    return new Response(JSON.stringify({ code }), {
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

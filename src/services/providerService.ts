// Unified multi-provider chat/text service.
// - Gemini: called directly from the browser (existing behavior, uses VITE/process.env API key).
// - Groq / Claude / OpenAI: routed through /api/chat (Vercel Serverless Function) so the
//   real API keys never reach the browser.

export type ChatProvider = 'auto' | 'gemini' | 'groq' | 'claude' | 'openai' | 'cloudflare';

export interface ProviderOption {
  id: ChatProvider;
  label: string;
  supportsChat: boolean;
  supportsCode: boolean;
  supportsImage: boolean;
  supportsAudio: boolean;
}

export const PROVIDERS: ProviderOption[] = [
  { id: 'auto', label: 'Auto', supportsChat: true, supportsCode: true, supportsImage: true, supportsAudio: true },
  { id: 'gemini', label: 'Gemini', supportsChat: true, supportsCode: true, supportsImage: true, supportsAudio: true },
  { id: 'groq', label: 'Groq', supportsChat: true, supportsCode: true, supportsImage: false, supportsAudio: false },
  { id: 'claude', label: 'Claude', supportsChat: true, supportsCode: true, supportsImage: false, supportsAudio: false },
  { id: 'openai', label: 'OpenAI', supportsChat: true, supportsCode: true, supportsImage: true, supportsAudio: true },
  { id: 'cloudflare', label: 'Cloudflare', supportsChat: false, supportsCode: false, supportsImage: true, supportsAudio: false },
];

interface SimpleMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendProxiedChat(
  provider: Exclude<ChatProvider, 'gemini'>,
  messages: SimpleMessage[],
  systemInstruction?: string
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, messages, systemInstruction }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `${provider} request failed`);
  return data.text;
}

export async function generateProxiedImage(prompt: string): Promise<string> {
  const res = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Image generation failed');
  return data.imageUrl;
}

export async function generateCloudflareImage(prompt: string): Promise<string> {
  const res = await fetch('/api/cloudflare-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Cloudflare image generation failed');
  return data.imageUrl;
}

export async function generateProxiedImageEdit(imageFile: File | Blob, prompt: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', imageFile, 'image.png');
  formData.append('prompt', prompt);

  const res = await fetch('/api/image-edit', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Image edit failed');
  return data.imageUrl;
}

export async function generateProxiedSpeech(text: string, voice?: string): Promise<string> {
  const res = await fetch('/api/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Speech generation failed');
  return data.audioUrl;
}

// --- Gemini: backend-first, frontend fallback ---
// Tries the Vercel Serverless proxy (api/gemini-*.ts) first, keeping the key server-side.
// If that fails (e.g. GEMINI_API_KEY not yet set on Vercel), falls back to the
// existing frontend-direct call so the app keeps working either way.

export async function sendGeminiChat(
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  systemInstruction: string,
  frontendFallback: () => Promise<string>
): Promise<string> {
  try {
    const res = await fetch('/api/gemini-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...history, { role: 'user', text: newMessage }],
        systemInstruction,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.text) throw new Error(data.error || 'Gemini backend request failed');
    return data.text;
  } catch (err) {
    console.warn('Gemini backend proxy failed, falling back to frontend call:', err);
    return frontendFallback();
  }
}

export async function generateGeminiWebsite(
  prompt: string,
  frontendFallback: () => Promise<string>
): Promise<string> {
  try {
    const res = await fetch('/api/gemini-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok || !data.code) throw new Error(data.error || 'Gemini backend request failed');
    return data.code;
  } catch (err) {
    console.warn('Gemini backend proxy failed, falling back to frontend call:', err);
    return frontendFallback();
  }
}

export async function generateGeminiImage(
  prompt: string,
  frontendFallback: () => Promise<string>
): Promise<string> {
  try {
    const res = await fetch('/api/gemini-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok || !data.imageUrl) throw new Error(data.error || 'Gemini backend request failed');
    return data.imageUrl;
  } catch (err) {
    console.warn('Gemini backend proxy failed, falling back to frontend call:', err);
    return frontendFallback();
  }
}

// --- AUTO mode: tries providers in order until one succeeds ---
// Chat/Code order: Groq -> Gemini -> Claude -> OpenAI (fastest/free-est first)
// Image order: Cloudflare -> Gemini -> OpenAI (free first, then paid)

export interface AutoAttempt {
  provider: ChatProvider;
  error: string;
}

export class AutoAllFailedError extends Error {
  attempts: AutoAttempt[];
  constructor(attempts: AutoAttempt[]) {
    super(`All providers failed: ${attempts.map((a) => `${a.provider} (${a.error})`).join('; ')}`);
    this.attempts = attempts;
  }
}

const CHAT_AUTO_ORDER: Exclude<ChatProvider, 'auto' | 'cloudflare'>[] = ['groq', 'gemini', 'claude', 'openai'];
const IMAGE_AUTO_ORDER: Exclude<ChatProvider, 'auto' | 'groq' | 'claude'>[] = ['cloudflare', 'gemini', 'openai'];

export async function sendChatAuto(
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  systemInstruction: string,
  geminiFrontendFallback: () => Promise<string>,
  onAttempt?: (provider: ChatProvider) => void
): Promise<{ text: string; usedProvider: ChatProvider }> {
  const attempts: AutoAttempt[] = [];

  for (const provider of CHAT_AUTO_ORDER) {
    onAttempt?.(provider);
    try {
      if (provider === 'gemini') {
        const text = await sendGeminiChat(history, newMessage, systemInstruction, geminiFrontendFallback);
        return { text, usedProvider: provider };
      }
      const proxyHistory = [...history, { role: 'user' as const, text: newMessage }].map((m) => ({
        role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      }));
      const text = await sendProxiedChat(provider, proxyHistory, systemInstruction);
      return { text, usedProvider: provider };
    } catch (err: any) {
      attempts.push({ provider, error: err.message || 'Unknown error' });
    }
  }

  throw new AutoAllFailedError(attempts);
}

export async function generateWebsiteAuto(
  prompt: string,
  geminiFrontendFallback: () => Promise<string>,
  onAttempt?: (provider: ChatProvider) => void
): Promise<{ code: string; usedProvider: ChatProvider }> {
  const attempts: AutoAttempt[] = [];
  const CODE_SYSTEM_INSTRUCTION =
    "You are an expert web developer. Generate a single, complete, self-contained HTML file (with inline CSS and JS) for the user's request. Respond with ONLY the raw HTML code, no explanations, no markdown code fences.";

  for (const provider of CHAT_AUTO_ORDER) {
    onAttempt?.(provider);
    try {
      if (provider === 'gemini') {
        const code = await generateGeminiWebsite(prompt, geminiFrontendFallback);
        return { code, usedProvider: provider };
      }
      const raw = await sendProxiedChat(provider, [{ role: 'user', content: prompt }], CODE_SYSTEM_INSTRUCTION);
      const code = raw.replace(/^```(?:html)?\n?/i, '').replace(/```$/i, '').trim();
      return { code, usedProvider: provider };
    } catch (err: any) {
      attempts.push({ provider, error: err.message || 'Unknown error' });
    }
  }

  throw new AutoAllFailedError(attempts);
}

export async function generateImageAuto(
  prompt: string,
  geminiFrontendFallback: () => Promise<string>,
  onAttempt?: (provider: ChatProvider) => void
): Promise<{ imageUrl: string; usedProvider: ChatProvider }> {
  const attempts: AutoAttempt[] = [];

  for (const provider of IMAGE_AUTO_ORDER) {
    onAttempt?.(provider);
    try {
      if (provider === 'cloudflare') {
        const imageUrl = await generateCloudflareImage(prompt);
        return { imageUrl, usedProvider: provider };
      }
      if (provider === 'gemini') {
        const imageUrl = await generateGeminiImage(prompt, geminiFrontendFallback);
        return { imageUrl, usedProvider: provider };
      }
      const imageUrl = await generateProxiedImage(prompt);
      return { imageUrl, usedProvider: provider };
    } catch (err: any) {
      attempts.push({ provider, error: err.message || 'Unknown error' });
    }
  }

  throw new AutoAllFailedError(attempts);
}

export async function generateImageEditAuto(
  imageFile: File | Blob,
  prompt: string,
  onAttempt?: (provider: ChatProvider) => void
): Promise<{ imageUrl: string; usedProvider: ChatProvider }> {
  // Only OpenAI currently supports image-to-image editing through our backend.
  onAttempt?.('openai');
  const imageUrl = await generateProxiedImageEdit(imageFile, prompt);
  return { imageUrl, usedProvider: 'openai' };
}

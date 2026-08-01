// Unified multi-provider chat/text service.
// - Gemini: called directly from the browser (existing behavior, uses VITE/process.env API key).
// - Groq / Claude / OpenAI: routed through /api/chat (Vercel Serverless Function) so the
//   real API keys never reach the browser.

export type ChatProvider = 'gemini' | 'groq' | 'claude' | 'openai';

export interface ProviderOption {
  id: ChatProvider;
  label: string;
  supportsChat: boolean;
  supportsCode: boolean;
  supportsImage: boolean;
  supportsAudio: boolean;
}

export const PROVIDERS: ProviderOption[] = [
  { id: 'gemini', label: 'Gemini', supportsChat: true, supportsCode: true, supportsImage: true, supportsAudio: true },
  { id: 'groq', label: 'Groq', supportsChat: true, supportsCode: true, supportsImage: false, supportsAudio: false },
  { id: 'claude', label: 'Claude', supportsChat: true, supportsCode: true, supportsImage: false, supportsAudio: false },
  { id: 'openai', label: 'OpenAI', supportsChat: true, supportsCode: true, supportsImage: true, supportsAudio: true },
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

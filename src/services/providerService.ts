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

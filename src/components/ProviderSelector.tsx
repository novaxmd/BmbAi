import React from 'react';
import { PROVIDERS, ChatProvider } from '../services/providerService';
import { Sparkles } from 'lucide-react';

interface ProviderSelectorProps {
  capability: 'supportsChat' | 'supportsCode' | 'supportsImage' | 'supportsAudio';
  value: ChatProvider;
  onChange: (provider: ChatProvider) => void;
}

const PROVIDER_COLORS: Record<ChatProvider, string> = {
  auto: 'from-cyber-500 to-purple-500',
  gemini: 'from-blue-500 to-cyan-400',
  groq: 'from-orange-500 to-red-400',
  mistral: 'from-orange-600 to-red-500',
  cloudflare: 'from-orange-400 to-yellow-400',
};

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ capability, value, onChange }) => {
  const available = PROVIDERS.filter((p) => p[capability]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 shrink-0">
        <Sparkles className="w-3 h-3" />
        Model:
      </span>
      <div className="flex gap-1.5 flex-wrap">
        {available.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
              value === p.id
                ? `bg-gradient-to-r ${PROVIDER_COLORS[p.id]} text-white border-transparent shadow-lg`
                : 'bg-cyber-800/60 text-slate-400 border-cyber-700 hover:text-white hover:border-cyber-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

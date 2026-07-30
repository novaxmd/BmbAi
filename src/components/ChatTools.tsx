import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, Loader2, MessageSquare, Copy, Check } from 'lucide-react';
import { sendChatMessage, ChatMessage } from '../services/chatService';
import { sendProxiedChat, ChatProvider } from '../services/providerService';
import { ProviderSelector } from './ProviderSelector';
import LoginPromptModal from './LoginPromptModal';
import { useAuth } from '../hooks/useAuth';
import { useChatHistory } from '../hooks/useChatHistory';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const WELCOME_MESSAGE: ChatMessage = { role: 'model', text: "Hello! I am Bmb Ai Bot. How can I help you today?" };
const LOGIN_PROMPT_THRESHOLD = 15;

interface ChatToolsProps {
  activeChatId?: string | null;
  loadChatTrigger?: number;
  onChatIdChange?: (id: string | null) => void;
}

export const ChatTools: React.FC<ChatToolsProps> = ({ activeChatId = null, loadChatTrigger = 0, onChatIdChange }) => {
  const { user } = useAuth();
  const { createChat, loadChat, addMessage } = useChatHistory();

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<ChatProvider>('gemini');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [dismissedLoginPrompt, setDismissedLoginPrompt] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(activeChatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // React to sidebar selecting a chat, or starting a new one
  useEffect(() => {
    const load = async () => {
      if (activeChatId) {
        try {
          const { messages: stored } = await loadChat(activeChatId);
          const mapped: ChatMessage[] = stored.map((m) => ({ role: m.role, text: m.content }));
          setMessages(mapped.length > 0 ? mapped : [WELCOME_MESSAGE]);
          setCurrentChatId(activeChatId);
        } catch (err) {
          console.error(err);
          setMessages([WELCOME_MESSAGE]);
        }
      } else {
        setMessages([WELCOME_MESSAGE]);
        setCurrentChatId(null);
      }
      setDismissedLoginPrompt(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadChatTrigger]);

  // Count how many user messages have been sent this session (for the 15-message login prompt)
  const userMessageCount = messages.filter((m) => m.role === 'user').length;

  useEffect(() => {
    if (!user && !dismissedLoginPrompt && userMessageCount >= LOGIN_PROMPT_THRESHOLD) {
      setShowLoginPrompt(true);
    }
  }, [userMessageCount, user, dismissedLoginPrompt]);

  const persistMessage = async (role: 'user' | 'model', text: string) => {
    if (!user) return; // only persist for logged-in users
    try {
      let chatId = currentChatId;
      if (!chatId) {
        const title = text.slice(0, 50) || 'New Chat';
        const chat = await createChat(title, provider);
        chatId = chat.id;
        setCurrentChatId(chatId);
        onChatIdChange?.(chatId);
      }
      await addMessage(chatId, role, text);
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const newHistory = [...messages, { role: 'user', text: userText } as ChatMessage];

    setMessages(newHistory);
    setInput('');
    setIsLoading(true);
    persistMessage('user', userText);

    try {
      let responseText: string;
      if (provider === 'gemini') {
        responseText = await sendChatMessage(messages, userText);
      } else {
        const history = newHistory.map((m) => ({
          role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
          content: m.text,
        }));
        responseText = await sendProxiedChat(
          provider,
          history,
          "You are Bmb Ai, a highly advanced, intelligent, and helpful AI assistant created by Bmb Tech. You are witty, professional, and knowledgeable about coding, technology, and creativity. Always answer as 'Bmb Ai'."
        );
      }
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      persistMessage('model', responseText);
    } catch (error: any) {
        const errText = "Error: " + error.message;
        setMessages(prev => [...prev, { role: 'model', text: errText }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{ role: 'model', text: "Chat cleared. Ready for a new conversation!" }]);
    setCurrentChatId(null);
    onChatIdChange?.(null);
    setDismissedLoginPrompt(false);
  };

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="text-slate-500 hover:text-white transition-colors" title="Copy Message">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
        <LoginPromptModal
          open={showLoginPrompt}
          onClose={() => { setShowLoginPrompt(false); setDismissedLoginPrompt(true); }}
        />

        {/* Header Area */}
        <div className="shrink-0 flex items-center justify-between bg-cyber-800/50 p-4 rounded-xl border border-cyber-700">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyber-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Bmb Ai Bot</h2>
                    <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        ONLINE
                    </p>
                </div>
            </div>
            <button 
                onClick={handleClearChat}
                className="p-2 hover:bg-cyber-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                title="Clear Chat"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>

        {/* Provider Selector */}
        <div className="shrink-0 bg-cyber-800/30 border border-cyber-700 rounded-xl p-3">
            <ProviderSelector capability="supportsChat" value={provider} onChange={setProvider} />
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-h-0 bg-cyber-900/50 border border-cyber-700 rounded-2xl relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-grid-slate-800/[0.1] bg-[length:30px_30px]"></div>
            
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar z-10">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start group'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-cyber-800 flex items-center justify-center border border-cyber-700 shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-cyber-400" />
                            </div>
                        )}
                        <div 
                            className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed relative ${
                                msg.role === 'user' 
                                ? 'bg-cyber-500 text-white rounded-br-none shadow-lg shadow-cyber-500/10' 
                                : 'bg-cyber-800/80 text-slate-200 rounded-bl-none border border-cyber-700'
                            }`}
                        >
                            {/* Markdown Rendering */}
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                className="prose prose-invert prose-sm max-w-none break-words"
                                components={{
                                    // Customizing Table styles for the dark theme
                                    table: ({node, ...props}) => (
                                        <div className="overflow-x-auto my-3 rounded-lg border border-cyber-700">
                                            <table className="min-w-full divide-y divide-cyber-700 bg-cyber-900/50" {...props} />
                                        </div>
                                    ),
                                    thead: ({node, ...props}) => <thead className="bg-cyber-900" {...props} />,
                                    th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-bold text-cyber-400 uppercase tracking-wider border-b border-cyber-700" {...props} />,
                                    td: ({node, ...props}) => <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 border-b border-cyber-700/50" {...props} />,
                                    // Customizing Code blocks
                                    code: ({node, inline, className, children, ...props}: any) => {
                                        return inline ? (
                                            <code className="bg-black/40 text-cyber-400 px-1.5 py-0.5 rounded text-xs font-mono border border-cyber-700/50" {...props}>{children}</code>
                                        ) : (
                                            <div className="relative my-3 group/code">
                                                <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                                    <CopyButton text={String(children)} />
                                                </div>
                                                <pre className="bg-black/40 p-3 rounded-lg overflow-x-auto border border-cyber-700/50">
                                                    <code className="text-xs font-mono text-emerald-400" {...props}>{children}</code>
                                                </pre>
                                            </div>
                                        );
                                    },
                                    // Styling basic text elements
                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1 ml-1" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-1" {...props} />,
                                    li: ({node, ...props}) => <li className="marker:text-cyber-500" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                    a: ({node, ...props}) => <a className="text-cyber-400 hover:underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cyber-500 pl-4 italic text-slate-400 my-2" {...props} />,
                                }}
                            >
                                {msg.text}
                            </ReactMarkdown>

                            {/* Message Copy Button */}
                            {msg.role === 'model' && (
                                <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(msg.text)}
                                        className="text-[10px] bg-cyber-800/80 px-2 py-1 rounded text-slate-400 hover:text-white border border-cyber-700 flex items-center gap-1"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shrink-0 mt-1">
                                <User className="w-4 h-4 text-purple-400" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 justify-start animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-cyber-800 flex items-center justify-center border border-cyber-700">
                             <Bot className="w-4 h-4 text-cyber-400" />
                        </div>
                        <div className="bg-cyber-800/50 px-4 py-3 rounded-2xl rounded-bl-none border border-cyber-700/50 flex items-center gap-2">
                             <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                             <span className="text-xs text-slate-500">Bmb Ai is typing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 p-4 bg-cyber-950/80 backdrop-blur border-t border-cyber-700 z-10">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-cyber-900 border border-cyber-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-500 placeholder:text-slate-600"
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isLoading}
                        className="bg-gradient-to-r from-cyber-500 to-purple-600 text-white p-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

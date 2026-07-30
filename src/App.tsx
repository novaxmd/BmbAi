import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import SidebarMenu from './components/SidebarMenu';
import ChatStudio from './pages/ChatStudio';
import ImageStudio from './pages/ImageStudio';
import AudioStudio from './pages/AudioStudio';
import CodeStudio from './pages/CodeStudio';
import { Code, Image as ImageIcon, Mic, MessageSquare } from 'lucide-react';
import LZString from 'lz-string';
import { AuthProvider } from './hooks/useAuth';

type StudioMode = 'CHAT' | 'IMAGE' | 'AUDIO' | 'CODE';

const MODE_ROUTES: Record<StudioMode, string> = {
  CHAT: '/',
  IMAGE: '/image-studio',
  AUDIO: '/audio-studio',
  CODE: '/code-studio',
};

const ROUTE_MODES: Record<string, StudioMode> = {
  '/': 'CHAT',
  '/image-studio': 'IMAGE',
  '/audio-studio': 'AUDIO',
  '/code-studio': 'CODE',
};

interface SharedCodeState {
  code: string;
  activeTab: 'ANALYSIS' | 'PREVIEW';
  isFullscreen: boolean;
}

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [sharedCode, setSharedCode] = useState<SharedCodeState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadChatTrigger, setLoadChatTrigger] = useState(0);

  const appMode: StudioMode = ROUTE_MODES[location.pathname] ?? 'CHAT';

  // Load shared code from URL on startup (?share=... coming from Code Studio's Share button)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    if (sharedData) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(sharedData);
        if (decompressed) {
          setSharedCode({ code: decompressed, activeTab: 'PREVIEW', isFullscreen: true });
          navigate('/code-studio', { replace: true });
          window.history.replaceState({}, document.title, '/code-studio');
        }
      } catch (e) {
        console.error("Failed to load shared code", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="flex flex-col bg-cyber-900 font-sans selection:bg-cyber-500/30 overflow-hidden" style={{ height: '100dvh' }}>
      <Header onInstall={handleInstallApp} canInstall={!!deferredPrompt} onMenuClick={() => setSidebarOpen(true)} />

      <SidebarMenu
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChatId={activeChatId}
        onSelectChat={(chatId) => {
          setActiveChatId(chatId);
          setLoadChatTrigger((n) => n + 1);
          navigate('/');
        }}
        onNewChat={() => {
          setActiveChatId(null);
          setLoadChatTrigger((n) => n + 1);
          navigate('/');
        }}
      />

      {/* Main Mode Switcher — Chat Studio first, Code Studio last */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-4 shrink-0">
        <div className="flex bg-cyber-800/50 p-1 rounded-xl border border-cyber-700 w-full md:w-fit mx-auto md:mx-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => navigate(MODE_ROUTES.CHAT)}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${appMode === 'CHAT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat Studio
          </button>
          <button
            onClick={() => navigate(MODE_ROUTES.IMAGE)}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${appMode === 'IMAGE' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Image Studio
          </button>
          <button
            onClick={() => navigate(MODE_ROUTES.AUDIO)}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${appMode === 'AUDIO' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Mic className="w-4 h-4" />
            Audio Studio
          </button>
          <button
            onClick={() => navigate(MODE_ROUTES.CODE)}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${appMode === 'CODE' ? 'bg-cyber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Code className="w-4 h-4" />
            Code Studio
          </button>
        </div>
      </div>

      <main className={`flex-1 max-w-7xl w-full mx-auto px-2 md:px-4 py-4 md:py-6 min-h-0 ${appMode === 'CHAT' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
        <Routes>
          <Route path="/" element={<ChatStudio activeChatId={activeChatId} loadChatTrigger={loadChatTrigger} onChatIdChange={setActiveChatId} />} />
          <Route path="/image-studio" element={<ImageStudio />} />
          <Route path="/audio-studio" element={<AudioStudio />} />
          <Route
            path="/code-studio"
            element={
              <CodeStudio
                initialCode={sharedCode?.code}
                initialTab={sharedCode?.activeTab}
                initialFullscreen={sharedCode?.isFullscreen}
              />
            }
          />
        </Routes>
      </main>

      {appMode !== 'CHAT' && <Footer />}
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </BrowserRouter>
);

export default App;

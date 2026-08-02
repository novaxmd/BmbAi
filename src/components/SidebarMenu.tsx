import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Trash2, Settings, LogOut, Github, Plus, Loader2, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChatHistory, ChatSummary } from '../hooks/useChatHistory';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface SidebarMenuProps {
  open: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  activeChatId: string | null;
}

// Simple inline Google "G" icon (lucide-react has no official Google logo)
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const SidebarMenu: React.FC<SidebarMenuProps> = ({ open, onClose, onSelectChat, onNewChat, activeChatId }) => {
  const { user, isLoading: authLoading, loginWithGithub, loginWithGoogle, logout } = useAuth();
  const { chats, isLoading: chatsLoading, fetchChats, deleteChat } = useChatHistory();
  const { permission, isSubscribed, isLoading: pushLoading, isSupported, subscribe, unsubscribe } = usePushNotifications();
  const [showSettings, setShowSettings] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) fetchChats();
  }, [open, user, fetchChats]);

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setDeletingId(chatId);
    try {
      await deleteChat(chatId);
      if (activeChatId === chatId) onNewChat();
    } catch (err: any) {
      console.error(err);
      alert(`Couldn't delete chat: ${err.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 left-0 z-[201] h-full w-[300px] max-w-[85vw] bg-cyber-900 border-r border-cyber-700 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-cyber-700 shrink-0">
          <h2 className="text-lg font-bold text-white">Bmb Ai</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-cyber-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat button */}
        <div className="p-3 shrink-0">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyber-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-2 mb-2">History</p>

          {!user && (
            <p className="text-xs text-slate-500 px-2 py-4 text-center">
              Sign in to save and revisit your chat history.
            </p>
          )}

          {user && chatsLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-cyber-400" />
            </div>
          )}

          {user && !chatsLoading && chats.length === 0 && (
            <p className="text-xs text-slate-500 px-2 py-4 text-center">No chats yet. Start a conversation!</p>
          )}

          {user && chats.map((chat: ChatSummary) => (
            <div
              key={chat.id}
              className={`w-full group flex items-center gap-1 rounded-lg transition-colors ${
                activeChatId === chat.id ? 'bg-cyber-700 text-white' : 'text-slate-300 hover:bg-cyber-800'
              }`}
            >
              <button
                onClick={() => { onSelectChat(chat.id); onClose(); }}
                className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 text-left"
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-slate-500" />
                <span className="flex-1 text-sm truncate">{chat.title}</span>
              </button>
              <button
                onClick={(e) => handleDelete(e, chat.id)}
                disabled={deletingId === chat.id}
                className="shrink-0 mr-2 p-2 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                aria-label="Delete chat"
              >
                {deletingId === chat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>

        {/* Settings section */}
        <div className="border-t border-cyber-700 p-3 shrink-0">
          {showSettings && (
            <div className="mb-2 rounded-xl border border-cyber-700 bg-cyber-800/50 p-4 space-y-3 animate-in fade-in duration-200">
              {isSupported && (
                <button
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={pushLoading || permission === 'denied'}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    isSubscribed
                      ? 'bg-cyber-700 text-slate-300 hover:bg-cyber-600'
                      : 'bg-cyber-500/10 text-cyber-400 hover:bg-cyber-500/20'
                  }`}
                >
                  {pushLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isSubscribed ? (
                    <BellOff className="w-3.5 h-3.5" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  {permission === 'denied'
                    ? 'Notifications blocked'
                    : isSubscribed
                    ? 'Disable Notifications'
                    : 'Enable Notifications'}
                </button>
              )}

              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    {user.avatar_url && (
                      <img src={user.avatar_url} alt={user.name || 'User'} className="w-9 h-9 rounded-full border border-cyber-700" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 text-center mb-2">Sign in to continue</p>
                  <button
                    onClick={loginWithGithub}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#24292e] hover:bg-[#1a1e22] text-white text-sm font-medium transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    Continue with GitHub
                  </button>
                  <button
                    onClick={loginWithGoogle}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-sm font-medium transition-colors"
                  >
                    <GoogleIcon className="w-4 h-4" />
                    Continue with Google
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cyber-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-cyber-800 border border-cyber-700 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;

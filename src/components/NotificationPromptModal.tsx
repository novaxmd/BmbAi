import React from 'react';
import { Bell, X, Sparkles } from 'lucide-react';

interface NotificationPromptModalProps {
  open: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

const NotificationPromptModal: React.FC<NotificationPromptModalProps> = ({ open, onAllow, onDismiss }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative w-full max-w-sm rounded-2xl border border-cyber-700 bg-cyber-900 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onDismiss}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-cyber-800 hover:bg-cyber-700 text-slate-300 flex items-center justify-center shadow-lg transition-colors border border-cyber-700"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-cyber-500 to-purple-500 flex items-center justify-center">
            <Bell className="w-7 h-7 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Stay in the loop</h2>
            <p className="text-sm text-slate-400 mt-2">
              Turn on notifications to know the moment we ship new features, new AI models,
              or important updates — right on your device.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            You can turn this off anytime in Settings
          </div>

          <div className="space-y-2">
            <button
              onClick={onAllow}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Turn on notifications
            </button>
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPromptModal;

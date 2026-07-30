import React from 'react';
import { Menu, ShieldCheck, Download, Sparkles } from 'lucide-react';

interface HeaderProps {
  onInstall?: () => void;
  canInstall?: boolean;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onInstall, canInstall, onMenuClick }) => {
  return (
    <header className="border-b border-cyber-700 bg-cyber-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="relative group"
            aria-label="Open menu"
          >
            <div className="absolute inset-0 bg-cyber-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="bg-gradient-to-br from-cyber-800 to-cyber-900 border border-cyber-700 p-2 rounded-xl relative">
              <Menu className="w-6 h-6 text-cyber-400 group-hover:text-white transition-colors" />
            </div>
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyber-400 to-purple-500 flex items-center gap-1">
              Bmb<span className="text-white">Ai</span>
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-cyber-500 uppercase hidden sm:block">
              Amazing Style Studio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {canInstall && (
            <button 
              onClick={onInstall}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-500 text-white hover:bg-cyber-400 transition-colors shadow-lg shadow-cyber-500/20 animate-pulse"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-bold">INSTALL APP</span>
            </button>
          )}
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Secure</span>
          </div>
        </div>
      </div>
    </header>
  );
};

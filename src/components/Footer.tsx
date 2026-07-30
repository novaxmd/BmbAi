import React from 'react';
import { MessageCircle, Globe, Zap, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-cyber-700 bg-cyber-900/80 backdrop-blur-md mt-auto relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-cyber-500 to-transparent opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2 text-slate-300">
            <Code className="w-4 h-4 text-cyber-500" />
            <span className="text-sm font-medium tracking-wide">ENGINEERED BY</span>
          </div>
          <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyber-400 to-cyber-accent animate-pulse">
            BMB AI
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a 
            href="https://wa.me/447546717496" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            <div className="flex items-center gap-2 font-bold">
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Contact Now</span>
            </div>
          </a>

          <a 
            href="https://saqib.zone.id/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative px-6 py-2.5 bg-cyber-500/10 hover:bg-cyber-500/20 text-cyber-400 border border-cyber-500/30 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            <div className="flex items-center gap-2 font-bold">
              <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Visit Website</span>
            </div>
          </a>
        </div>
      </div>
      
      {/* Bottom copyright line */}
      <div className="border-t border-cyber-800/50 bg-cyber-900/50 py-2 text-center">
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          © {new Date().getFullYear()} BMB AI • ALL RIGHTS RESERVED
        </p>
      </div>
    </footer>
  );
};
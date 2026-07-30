import React, { useEffect, useState } from 'react';
import { RefreshCw, Globe, Terminal, Zap, Maximize2, Minimize2, Copy, Check } from 'lucide-react';

interface PreviewViewProps {
  code: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onShare: () => void; // New prop to trigger share from address bar
}

export const PreviewView: React.FC<PreviewViewProps> = ({ code, isFullscreen, onToggleFullscreen, onShare }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [key, setKey] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleRefresh = () => {
    setLogs([]);
    setKey(prev => prev + 1);
  };

  const handleCopyUrl = () => {
    onShare();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    setLogs([]);
  }, [code]);

  const getSrcDoc = () => {
    if (!code) return '';
    const isHtml = /^\s*<!DOCTYPE|^\s*<html/i.test(code);
    
    const consoleScript = `
      <script>
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        function sendLog(type, args) {
          try {
            const content = args.map(arg => {
              if (typeof arg === 'object') return JSON.stringify(arg);
              return String(arg);
            }).join(' ');
            window.parent.postMessage({ type: 'console', level: type, content }, '*');
          } catch (e) {}
        }
        console.log = function(...args) { sendLog('info', args); originalLog.apply(console, args); };
        console.error = function(...args) { sendLog('error', args); originalError.apply(console, args); };
        console.warn = function(...args) { sendLog('warn', args); originalWarn.apply(console, args); };
        window.onerror = function(msg, url, line) { sendLog('error', [msg]); };
      </script>
    `;

    let finalHtml = '';
    if (isHtml) {
        if (code.includes('<head>')) {
            finalHtml = code.replace('<head>', '<head>' + consoleScript);
        } else if (code.includes('<body>')) {
             finalHtml = code.replace('<body>', '<body>' + consoleScript);
        } else {
            finalHtml = consoleScript + code;
        }
    } else {
        finalHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { background: #0f172a; color: #fff; font-family: 'Courier New', monospace; padding: 20px; }
              </style>
              ${consoleScript}
            </head>
            <body>
              <div id="output"></div>
              <script>
                try { ${code} } catch (e) { console.error(e); }
              </script>
            </body>
          </html>
        `;
    }
    return finalHtml;
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === 'console') {
            const content = e.data.content || '';
            if (typeof content === 'string' && content.includes('cdn.tailwindcss.com should not be used in production')) return;
            setLogs(prev => [...prev, `[${e.data.level.toUpperCase()}] ${content}`]);
        }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-[100] bg-cyber-900 w-screen h-screen rounded-none flex flex-col" 
    : "flex flex-col h-full bg-cyber-900 rounded-xl border border-cyber-700 overflow-hidden shadow-2xl animate-fadeIn min-h-[500px]";

  return (
    <div className={containerClasses}>
      {/* Browser Toolbar - Optimized for Mobile */}
      <div className="bg-cyber-800 p-2 flex items-center gap-2 border-b border-cyber-700">
        <div className="hidden sm:flex gap-1.5 px-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        
        {/* Address Bar with Copy Button */}
        <div className="flex-1 bg-cyber-900/50 rounded-md px-2 py-1 text-xs font-mono text-slate-400 flex items-center justify-between gap-2 border border-cyber-700/50 overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden">
                <Globe className="w-3 h-3 text-cyber-400 shrink-0" />
                <span className="opacity-70 truncate">https://share.bmbai.zone.id/...</span>
            </div>
            <button 
                onClick={handleCopyUrl}
                className="flex items-center gap-1 bg-cyber-700/50 hover:bg-cyber-600 text-emerald-400 px-2 py-0.5 rounded transition-colors shrink-0"
            >
                {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span className="font-bold">{copiedLink ? "COPIED" : "COPY URL"}</span>
            </button>
        </div>
        
        <div className="flex items-center gap-1 border-l border-cyber-700/50 pl-2 ml-1">
            <button onClick={handleRefresh} className="p-1.5 hover:bg-cyber-700 rounded text-slate-400 hover:text-white transition-colors">
                <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onToggleFullscreen} className="p-1.5 hover:bg-cyber-700 rounded text-cyber-400 hover:text-white transition-colors">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative bg-white">
        {code ? (
            <iframe
                key={key}
                srcDoc={getSrcDoc()}
                className="absolute inset-0 w-full h-full border-0"
                sandbox="allow-scripts allow-modals"
                title="Live Preview"
            />
        ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyber-900/10 text-slate-500 p-4 text-center">
                <Zap className="w-12 h-12 mb-4 text-slate-300" />
                <p>Ready to deploy.</p>
                <p className="text-xs mt-2 opacity-70">Generate code or paste it to see the magic.</p>
            </div>
        )}
      </div>

      {/* Mini Console - Collapsible on Mobile? Kept simple for now */}
      {!isFullscreen && (
        <div className="h-32 sm:h-48 bg-cyber-950 border-t border-cyber-700 flex flex-col">
            <div className="px-3 py-1 bg-cyber-800/50 border-b border-cyber-700 flex items-center gap-2 text-xs font-bold text-slate-400">
                <Terminal className="w-3 h-3" />
                SERVER LOGS
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 custom-scrollbar">
                {logs.length === 0 ? (
                    <span className="text-slate-600 italic opacity-50">Waiting for logs...</span>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : 'text-emerald-400'} border-b border-white/5 pb-1`}>
                            <span className="opacity-50 mr-2 hidden sm:inline">{new Date().toLocaleTimeString()}</span>
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { AlertTriangle, CheckCircle, Package, Activity, Lock, Code, Copy, Check } from 'lucide-react';

interface ResultViewProps {
  result: AnalysisResult;
}

export const ResultView: React.FC<ResultViewProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'LOW': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  const handleCopyCode = async () => {
    if (result.deobfuscatedSnippet) {
      try {
        await navigator.clipboard.writeText(result.deobfuscatedSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border flex flex-col items-start gap-2 ${getRiskColor(result.riskLevel)}`}>
            <div className="flex items-center gap-2 font-bold">
                <Activity className="w-5 h-5" />
                RISK LEVEL
            </div>
            <span className="text-2xl font-mono tracking-wider">{result.riskLevel}</span>
        </div>

        <div className="p-4 rounded-xl border border-cyber-700 bg-cyber-800/50 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 text-cyber-400 font-bold">
                <Code className="w-5 h-5" />
                LANGUAGE
            </div>
            <span className="text-2xl font-mono text-white">{result.language}</span>
        </div>

        <div className="p-4 rounded-xl border border-cyber-700 bg-cyber-800/50 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 text-cyber-accent font-bold">
                <Package className="w-5 h-5" />
                LIBRARIES
            </div>
            <div className="flex flex-wrap gap-2">
                {result.libraries.length > 0 ? result.libraries.map((lib, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-cyber-700 text-slate-200 font-mono">
                        {lib}
                    </span>
                )) : <span className="text-slate-500 italic">None detected</span>}
            </div>
        </div>
      </div>

      {/* Purpose Section */}
      <div className="bg-cyber-800/30 rounded-xl border border-cyber-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyber-400" />
            Analysis Summary
        </h3>
        <p className="text-slate-300 leading-relaxed text-sm md:text-base">
            {result.summary}
        </p>
        <div className="mt-4 pt-4 border-t border-cyber-700">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Identified Purpose</span>
            <p className="text-cyber-accent font-medium mt-1">{result.purpose}</p>
        </div>
      </div>

      {/* Deobfuscated Snippet */}
      {result.deobfuscatedSnippet && (
        <div className="bg-cyber-900 rounded-xl border border-cyber-700 overflow-hidden">
            <div className="bg-cyber-800/80 px-4 py-2 border-b border-cyber-700 flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">Logic Extraction (Simplified)</span>
                <button 
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-sm text-emerald-400/90 whitespace-pre-wrap">
                    {result.deobfuscatedSnippet}
                </pre>
            </div>
        </div>
      )}
    </div>
  );
};
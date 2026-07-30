import React, { useState, useRef } from 'react';
import { ResultView } from '../components/ResultView';
import { PreviewView } from '../components/PreviewView';
import { analyzeObfuscatedCode, generateWebsite, generateWebsiteFromImage } from '../services/geminiService';
import { AnalysisResult, AnalysisStatus } from '../types';
import { Play, Eraser, AlertCircle, Loader2, Copy, RotateCcw, Globe, Download, Clipboard, Zap, Code, Bot, Sparkles, Pencil, Save, FileCode, Shield, Unlock, Minimize, Link, Share2, Check, Image as ImageIcon, Paperclip, X } from 'lucide-react';
import LZString from 'lz-string';

interface CodeStudioProps {
  initialCode?: string;
  initialTab?: 'ANALYSIS' | 'PREVIEW';
  initialFullscreen?: boolean;
}

const CodeStudio: React.FC<CodeStudioProps> = ({ initialCode = '', initialTab = 'ANALYSIS', initialFullscreen = false }) => {
  const [code, setCode] = useState<string>(initialCode);
  const [urlInput, setUrlInput] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [fileName, setFileName] = useState<string>('index.html');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(initialFullscreen);
  const [isShared, setIsShared] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'PREVIEW'>(initialTab);

  const handleAnalyze = async () => {
    if (!code) return;

    setActiveTab('ANALYSIS');
    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeObfuscatedCode(code);
      setResult(data);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt && !attachedFile) return;

    setIsGenerating(true);
    setError(null);

    try {
      let generatedCode = '';

      if (attachedFile) {
        const reader = new FileReader();
        generatedCode = await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64String = (reader.result as string).split(',')[1];
              const result = await generateWebsiteFromImage(prompt, base64String, attachedFile.type);
              resolve(result);
            } catch (err) { reject(err); }
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(attachedFile);
        });
      } else {
        generatedCode = await generateWebsite(prompt);
      }

      setCode(generatedCode);
      setActiveTab('PREVIEW');
      setAttachedFile(null);
    } catch (err: any) {
      setError(err.message || "Failed to generate website.");
      setStatus(AnalysisStatus.ERROR);
      setActiveTab('ANALYSIS');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleFetchUrl = async () => {
    if (!urlInput) return;

    setIsFetchingUrl(true);
    setError(null);

    try {
      try {
        const response = await fetch(urlInput);
        if (response.ok) {
          const text = await response.text();
          setCode(text);
          setIsFetchingUrl(false);
          return;
        }
      } catch (directError) {
        console.warn("Direct fetch failed, trying proxy...", directError);
      }

      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlInput)}`;
      const proxyResponse = await fetch(proxyUrl);

      if (!proxyResponse.ok) {
        throw new Error(`Failed to fetch via proxy: ${proxyResponse.status}`);
      }

      const text = await proxyResponse.text();
      setCode(text);

    } catch (err: any) {
      setError(`Could not fetch code. The URL might be invalid or completely inaccessible. Error: ${err.message}`);
      setStatus(AnalysisStatus.ERROR);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleClear = () => {
    setCode('');
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    setError(null);
    setUrlInput('');
    setPrompt('');
    setAttachedFile(null);
  };

  const handleDownloadFile = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareLink = () => {
    if (!code) return;
    try {
      const compressed = LZString.compressToEncodedURIComponent(code);
      const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;

      if (url.length > 8000) {
        setError("Code is too large to share via link! Try saving as a file instead.");
        setStatus(AnalysisStatus.ERROR);
        setActiveTab('ANALYSIS');
        return;
      }

      navigator.clipboard.writeText(url);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 3000);
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  const handleBase64Encode = () => {
    try {
      setCode(btoa(code));
    } catch (e) {
      setError("Cannot Base64 Encode this content (might contain unicode characters).");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleBase64Decode = () => {
    try {
      setCode(atob(code));
    } catch (e) {
      setError("Invalid Base64 string.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleUrlEncode = () => {
    setCode(encodeURIComponent(code));
  };

  const handleUrlDecode = () => {
    try {
      setCode(decodeURIComponent(code));
    } catch (e) {
      setError("Invalid URL encoded string.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleMinify = () => {
    const minified = code
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
    setCode(minified);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
      {/* Left Column: Input & Builder */}
      <div className="flex flex-col gap-4">

        {/* AI Builder Section */}
        <div className="bg-gradient-to-br from-cyber-800 to-cyber-900 border border-cyber-700 rounded-xl p-3 md:p-4 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bot className="w-24 h-24 text-cyber-400" />
          </div>

          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 to-purple-400 flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Website Builder
          </h2>

          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 bg-cyber-950/80 p-2 rounded-lg border border-cyber-700 w-fit">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-white max-w-[150px] truncate">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-400"><X className="w-3 h-3" /></button>
            </div>
          )}

          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-cyber-700 hover:bg-cyber-600 text-slate-300 p-2 rounded-lg border border-cyber-600 transition-colors"
                title="Attach Image/Screenshot"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={attachedFile ? "Describe changes to this design..." : "Ex: Portfolio website with dark mode..."}
                className="flex-1 bg-cyber-950/50 border border-cyber-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyber-500 placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating || (!prompt && !attachedFile)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyber-500 hover:from-purple-500 hover:to-cyber-400 text-white text-sm font-bold rounded-lg shadow-lg shadow-purple-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
              Generate
            </button>
          </form>
        </div>

        {/* Developer Toolkit */}
        <div className="bg-cyber-800/30 border border-cyber-700 rounded-xl p-2 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase px-2">Dev Tools:</span>
          <div className="flex gap-2 w-full overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button onClick={handleBase64Encode} title="Base64 Encode" className="flex-shrink-0 p-2 hover:bg-cyber-700 rounded text-slate-400 hover:text-cyber-400 transition-colors border border-cyber-700/50">
              <Shield className="w-4 h-4" />
            </button>
            <button onClick={handleBase64Decode} title="Base64 Decode" className="flex-shrink-0 p-2 hover:bg-cyber-700 rounded text-slate-400 hover:text-emerald-400 transition-colors border border-cyber-700/50">
              <Unlock className="w-4 h-4" />
            </button>
            <button onClick={handleUrlEncode} title="URL Encode" className="flex-shrink-0 p-2 hover:bg-cyber-700 rounded text-slate-400 hover:text-purple-400 transition-colors border border-cyber-700/50">
              <Link className="w-4 h-4" />
            </button>
            <button onClick={handleMinify} title="Minify Code" className="flex-shrink-0 p-2 hover:bg-cyber-700 rounded text-slate-400 hover:text-yellow-400 transition-colors border border-cyber-700/50">
              <Minimize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* URL Fetcher Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-cyber-800/50 p-2 rounded-xl border border-cyber-700">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 bg-cyber-700/50 rounded-lg text-cyber-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-200 placeholder:text-slate-600 font-mono"
            />
          </div>
          <button
            onClick={handleFetchUrl}
            disabled={isFetchingUrl || !urlInput}
            className="px-3 py-2 bg-cyber-700 hover:bg-cyber-600 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Fetch
          </button>
        </div>

        {/* Code Header with Save & Share Feature */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-200">Source Code</h2>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleShareLink}
              disabled={!code}
              className={`
                            flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all
                            ${isShared
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-cyber-800/80 text-cyber-400 border-cyber-700/50 hover:bg-cyber-700 hover:text-white'}
                            ${!code ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
              title="Generate Shareable Link"
            >
              {isShared ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
              {isShared ? 'COPIED' : 'SHARE'}
            </button>

            <div className="flex flex-1 sm:flex-none items-center gap-2 bg-cyber-800/80 p-1 pr-2 rounded-lg border border-cyber-700/50">
              <FileCode className="w-4 h-4 text-slate-500 ml-2 shrink-0" />
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full sm:w-24 md:w-32 bg-transparent text-xs text-slate-300 focus:outline-none border-r border-cyber-700 pr-2 mr-1"
              />
              <button
                onClick={handleDownloadFile}
                className="text-xs font-bold text-cyber-400 hover:text-white flex items-center gap-1 transition-colors shrink-0"
                title="Save to file"
              >
                <Save className="w-3 h-3" />
                SAVE
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1 group min-h-[350px] md:min-h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-r from-cyber-500/20 to-cyber-accent/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <button
              onClick={handlePaste}
              className="p-2 bg-cyber-800/80 hover:bg-cyber-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-cyber-700"
              title="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 bg-cyber-800/80 hover:bg-cyber-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-cyber-700"
              title="Clear input"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste obfuscated code, HTML, or use AI Builder..."
            className="relative w-full h-full bg-cyber-800/50 border border-cyber-700 rounded-xl p-4 font-mono text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyber-500/50 focus:border-transparent resize-none placeholder:text-slate-600 custom-scrollbar"
            spellCheck={false}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleAnalyze}
            disabled={status === AnalysisStatus.ANALYZING || !code}
            className={`
                    py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-200
                    ${status === AnalysisStatus.ANALYZING || !code
                ? 'bg-cyber-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyber-500 to-cyber-400 hover:shadow-cyber-500/25 active:scale-[0.98]'}
                    `}
          >
            {status === AnalysisStatus.ANALYZING ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deciphering...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                AI Decode
              </>
            )}
          </button>

          <button
            onClick={() => setActiveTab('PREVIEW')}
            disabled={!code}
            className={`
                    py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-200
                    ${!code
                ? 'bg-cyber-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-400 hover:shadow-emerald-500/25 active:scale-[0.98]'}
                    `}
          >
            <Zap className="w-5 h-5 fill-current" />
            Run / Deploy
          </button>
        </div>
      </div>

      {/* Right Column: Output */}
      <div className="flex flex-col gap-4">
        {/* Tab Header */}
        <div className="flex items-center gap-1 bg-cyber-800/50 p-1 rounded-xl border border-cyber-700">
          <button
            onClick={() => setActiveTab('ANALYSIS')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ANALYSIS' ? 'bg-cyber-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Pencil className="w-4 h-4" />
            Analysis Report
          </button>
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'PREVIEW' ? 'bg-cyber-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Globe className="w-4 h-4" />
            Live Hosting
          </button>
        </div>

        {/* Analysis View */}
        {activeTab === 'ANALYSIS' && (
          <div className="flex-1 bg-cyber-900/50 border border-cyber-700/50 rounded-xl p-1 relative overflow-hidden min-h-[500px]">
            <div className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}>
            </div>

            {status === AnalysisStatus.IDLE && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-cyber-800 flex items-center justify-center mb-4">
                  <Copy className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm">Paste your obfuscated JavaScript code to decode OR switch to Live Hosting to run it.</p>
              </div>
            )}

            {status === AnalysisStatus.ERROR && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-8 text-center animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-bold mb-2">Operation Failed</h3>
                <p className="text-sm opacity-80 mb-6 max-w-md break-words">{error}</p>
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            )}

            {result && <div className="relative z-10 p-4 h-full overflow-y-auto custom-scrollbar">
              <ResultView result={result} />
            </div>}
          </div>
        )}

        {/* Preview View */}
        {activeTab === 'PREVIEW' && (
          <PreviewView
            code={code}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onShare={handleShareLink}
          />
        )}
      </div>
    </div>
  );
};

export default CodeStudio;

import React, { useState, useRef } from 'react';
import { Mic, Volume2, Play, FileAudio, Loader2, Sparkles, Download, StopCircle } from 'lucide-react';
import { generateSpeech, analyzeAudio } from '../services/audioService';
import { ChatProvider } from '../services/providerService';
import { ProviderSelector } from './ProviderSelector';

type AudioMode = 'TTS' | 'ANALYSIS';

export const AudioTools: React.FC = () => {
  const [mode, setMode] = useState<AudioMode>('TTS');
  
  // TTS State
  const [ttsText, setTtsText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Puck'); // Puck, Charon, Kore, Fenrir, Zephyr
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsProvider, setTtsProvider] = useState<ChatProvider>('gemini');

  // Analysis State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

  const handleTTS = async () => {
    if (!ttsText) return;
    setIsGenerating(true);
    setAudioUrl(null);
    try {
      const url = await generateSpeech(ttsText, selectedVoice);
      setAudioUrl(url);
    } catch (e: any) {
      alert("TTS Error: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAudioAnalysis = async (file: File) => {
    setAudioFile(file);
    setIsAnalyzing(true);
    setAnalysisResult('');
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const text = await analyzeAudio(base64String, file.type);
        setAnalysisResult(text);
      } catch (e: any) {
        setAnalysisResult("Error: " + e.message);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2 bg-cyber-800/50 p-2 rounded-xl border border-cyber-700 max-w-lg mx-auto w-full">
        <button
          onClick={() => setMode('TTS')}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-bold transition-all ${mode === 'TTS' ? 'bg-cyber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Volume2 className="w-4 h-4" />
          Text to Speech
        </button>
        <button
          onClick={() => setMode('ANALYSIS')}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-bold transition-all ${mode === 'ANALYSIS' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <FileAudio className="w-4 h-4" />
          Audio Analysis
        </button>
      </div>

      <div className="flex-1 bg-cyber-900/50 border border-cyber-700 rounded-2xl p-4 md:p-8 relative overflow-hidden min-h-[500px]">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyber-800/50 to-transparent opacity-50"></div>

         {/* TTS MODE */}
         {mode === 'TTS' && (
           <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6 animate-fadeIn">
             <div className="text-center space-y-2">
               <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                 <Sparkles className="w-5 h-5 text-cyber-400" />
                 Bmb Ai Voice Generator
               </h2>
               <p className="text-slate-400 text-sm">Convert text to lifelike speech using advanced AI voices.</p>
             </div>

             <div className="flex justify-center">
               <ProviderSelector capability="supportsAudio" value={ttsProvider} onChange={setTtsProvider} />
             </div>

             <div className="bg-cyber-950 p-4 rounded-xl border border-cyber-700 space-y-4">
                {ttsProvider === 'gemini' && (
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {voices.map(v => (
                    <button
                      key={v}
                      onClick={() => setSelectedVoice(v)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedVoice === v ? 'bg-cyber-500 border-cyber-500 text-white' : 'bg-cyber-900 border-cyber-700 text-slate-400 hover:border-cyber-500'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                )}

                <textarea
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Enter text to speak..."
                  className="w-full h-40 bg-cyber-900 border border-cyber-800 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-500 resize-none placeholder:text-slate-600"
                />

                <button
                  onClick={handleTTS}
                  disabled={isGenerating || !ttsText}
                  className="w-full py-3 bg-gradient-to-r from-cyber-500 to-cyber-400 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                  Generate Speech
                </button>
             </div>

             {audioUrl && (
               <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center gap-4">
                  <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Audio Ready</h3>
                  <audio controls src={audioUrl} className="w-full" autoPlay />
                  <a 
                    href={audioUrl} 
                    download={`speech_${selectedVoice}.mp3`}
                    className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download MP3
                  </a>
               </div>
             )}
           </div>
         )}

         {/* ANALYSIS MODE */}
         {mode === 'ANALYSIS' && (
           <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center space-y-8 animate-fadeIn">
              <div className="text-center space-y-2">
               <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                 <Mic className="w-5 h-5 text-purple-400" />
                 Audio Transcriber
               </h2>
               <p className="text-slate-400 text-sm">Transcribe, summarize, and detect language from audio files.</p>
             </div>

             {!audioFile ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-cyber-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-cyber-800/50 transition-all group"
                >
                    <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={(e) => e.target.files?.[0] && handleAudioAnalysis(e.target.files[0])} />
                    <FileAudio className="w-12 h-12 text-slate-500 group-hover:text-purple-400 mb-4 transition-colors" />
                    <p className="text-slate-400">Upload Audio (MP3, WAV)</p>
                </div>
             ) : (
                <div className="w-full flex flex-col gap-6">
                   <div className="flex items-center gap-4 bg-cyber-800 p-3 rounded-xl border border-cyber-700">
                      <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                        <Volume2 className="w-6 h-6" />
                      </div>
                      <div className="text-left flex-1">
                          <p className="text-sm font-bold text-white truncate">{audioFile.name}</p>
                          <p className="text-xs text-slate-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button onClick={() => {setAudioFile(null); setAnalysisResult('');}} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                        <StopCircle className="w-5 h-5" />
                      </button>
                   </div>

                   <div className="bg-cyber-950 rounded-xl p-6 border border-cyber-700 min-h-[200px] text-left relative">
                      {isAnalyzing ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-purple-400">
                              <Loader2 className="w-8 h-8 animate-spin" />
                              <span className="text-sm font-bold animate-pulse">Listening & Processing...</span>
                          </div>
                      ) : (
                          <div className="prose prose-invert prose-sm max-w-none">
                              <h3 className="text-purple-400 font-bold mb-2">Analysis Result:</h3>
                              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{analysisResult}</p>
                          </div>
                      )}
                   </div>
                </div>
             )}
           </div>
         )}
      </div>
    </div>
  );
};

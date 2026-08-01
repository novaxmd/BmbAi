import React, { useState, useRef } from 'react';
import { Upload, Download, Sparkles, Image as ImageIcon, Camera, Link as LinkIcon, Copy, Check, Loader2, Minimize2, Search } from 'lucide-react';
import { uploadToImageKit, generateAIImage, extractPromptFromImage } from '../services/imageService';
import { generateProxiedImage, ChatProvider, generateGeminiImage, generateProxiedImageEdit, generateCloudflareImage, generateImageAuto, generateImageEditAuto } from '../services/providerService';
import { ProviderSelector } from './ProviderSelector';

type ToolMode = 'HOST' | 'DOWNLOADER' | 'AI_GEN' | 'EXTRACTOR';

export const ImageTools: React.FC = () => {
  const [mode, setMode] = useState<ToolMode>('HOST');
  
  // Host States
  const [hostFile, setHostFile] = useState<File | null>(null);
  const [hostUrl, setHostUrl] = useState<string>('');
  const [hostLoading, setHostLoading] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{original: string, compressed: string} | null>(null);
  const [hostEditPrompt, setHostEditPrompt] = useState('');
  const [hostEditLoading, setHostEditLoading] = useState(false);
  const [hostEditResult, setHostEditResult] = useState<string | null>(null);

  // Downloader States
  const [downloadUrl, setDownloadUrl] = useState('');
  const [previewBlob, setPreviewBlob] = useState<string | null>(null);

  // AI Gen States
  const [genPrompt, setGenPrompt] = useState('');
  const [genImage, setGenImage] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genProvider, setGenProvider] = useState<ChatProvider>('auto');
  const [genAutoAttempt, setGenAutoAttempt] = useState<ChatProvider | null>(null);
  const [genReferenceImage, setGenReferenceImage] = useState<File | null>(null);
  const genResultRef = useRef<HTMLDivElement>(null);
  const genImageInputRef = useRef<HTMLInputElement>(null);

  // Extractor States
  const [extractFile, setExtractFile] = useState<File | null>(null);
  const [extractResult, setExtractResult] = useState('');
  const [extractLoading, setExtractLoading] = useState(false);

  // Utilities
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1600; 
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            let quality = 0.9;
            const tryCompress = () => {
                canvas.toBlob((blob) => {
                    if (!blob) return reject("Compression error");
                    if (blob.size <= (150 * 1024) || quality <= 0.2) {
                        resolve(blob);
                    } else {
                        quality -= 0.1;
                        tryCompress(); 
                    }
                }, 'image/jpeg', quality);
            };
            tryCompress();
        };
        img.onerror = reject;
    });
  };

  const handleHostUpload = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file) return;

    setHostFile(file);
    setHostLoading(true);
    setHostUrl('');
    setCompressionStats(null);
    setHostEditPrompt('');
    setHostEditResult(null);

    try {
        const compressedBlob = await compressImage(file);
        setCompressionStats({
            original: formatBytes(file.size),
            compressed: formatBytes(compressedBlob.size)
        });

        const url = await uploadToImageKit(compressedBlob);
        setHostUrl(url);
    } catch (err) {
        alert("Error: " + err);
    } finally {
        setHostLoading(false);
    }
  };

  const handleHostGenerate = async () => {
    if (!hostFile || !hostEditPrompt.trim()) return;
    setHostEditLoading(true);
    setHostEditResult(null);
    try {
      const imageUrl = await generateProxiedImageEdit(hostFile, hostEditPrompt.trim());
      setHostEditResult(imageUrl);
    } catch (err: any) {
      alert("Generation failed: " + err.message);
    } finally {
      setHostEditLoading(false);
    }
  };

  const handleUrlDownload = async () => {
    if(!downloadUrl) return;
    try {
        const res = await fetch(downloadUrl);
        const blob = await res.blob();
        setPreviewBlob(URL.createObjectURL(blob));
    } catch (e) {
        alert("Failed to fetch image. CORS might be blocking it.");
    }
  };

  const downloadImage = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAIGenerate = async () => {
    if(!genPrompt) return;
    setGenLoading(true);
    setGenImage(null);
    try {
        let imageUrl: string;

        if (genReferenceImage) {
          // Image-to-image: only OpenAI supports edits on our backend, regardless of provider selection
          const result = await generateImageEditAuto(genReferenceImage, genPrompt, setGenAutoAttempt);
          imageUrl = result.imageUrl;
        } else if (genProvider === 'auto') {
          const result = await generateImageAuto(genPrompt, () => generateAIImage(genPrompt), setGenAutoAttempt);
          imageUrl = result.imageUrl;
        } else if (genProvider === 'gemini') {
          imageUrl = await generateGeminiImage(genPrompt, () => generateAIImage(genPrompt));
        } else if (genProvider === 'cloudflare') {
          imageUrl = await generateCloudflareImage(genPrompt);
        } else {
          imageUrl = await generateProxiedImage(genPrompt);
        }

        setGenImage(imageUrl);
        // Scroll down to the generated image once it's ready
        setTimeout(() => genResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e: any) {
        alert("Generation failed: " + e.message);
    } finally {
        setGenLoading(false);
        setGenAutoAttempt(null);
    }
  };

  const handleGenReferenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setGenReferenceImage(file);
  };

  const handleExtract = async (file: File) => {
    setExtractFile(file);
    setExtractLoading(true);
    setExtractResult('');
    
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
            const text = await extractPromptFromImage(base64String, file.type);
            setExtractResult(text);
        } catch (e: any) {
            setExtractResult("Error: " + e.message);
        } finally {
            setExtractLoading(false);
        }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-cyber-800/50 p-2 rounded-xl border border-cyber-700">
            {[
                { id: 'HOST', icon: Upload, label: 'Compress & Host' },
                { id: 'DOWNLOADER', icon: Download, label: 'URL Downloader' },
                { id: 'AI_GEN', icon: Sparkles, label: 'AI Generator' },
                { id: 'EXTRACTOR', icon: Search, label: 'Prompt Extractor' }
            ].map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setMode(tool.id as ToolMode)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-bold transition-all ${mode === tool.id ? 'bg-cyber-500 text-white shadow-lg shadow-cyber-500/20' : 'text-slate-400 hover:bg-cyber-700/50 hover:text-white'}`}
                >
                    <tool.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tool.label}</span>
                </button>
            ))}
        </div>

        <div className="flex-1 bg-cyber-900/50 border border-cyber-700 rounded-2xl p-4 md:p-8 relative overflow-hidden min-h-[500px]">
            <div className="absolute inset-0 bg-grid-slate-800/[0.2] bg-[length:30px_30px]"></div>

            {/* HOST MODE */}
            {mode === 'HOST' && (
                <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center space-y-8 animate-fadeIn">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Smart Image Host</h2>
                        <p className="text-slate-400">Auto-compress to 150KB & Upload to Cloud</p>
                    </div>

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-64 border-2 border-dashed border-cyber-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-cyber-500 hover:bg-cyber-800/50 transition-all group"
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleHostUpload(e)} />
                        <div className="w-20 h-20 bg-cyber-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {hostLoading ? <Loader2 className="w-10 h-10 text-cyber-400 animate-spin" /> : <Upload className="w-10 h-10 text-cyber-400" />}
                        </div>
                        <p className="text-lg font-medium text-slate-300">Click to Upload Image</p>
                        <p className="text-sm text-slate-500 mt-2">Supports JPG, PNG, WEBP</p>
                    </div>

                    {compressionStats && (
                         <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="p-4 bg-cyber-800/50 rounded-xl border border-cyber-700">
                                <span className="text-xs uppercase text-slate-500 font-bold">Original</span>
                                <p className="text-xl font-mono text-white">{compressionStats.original}</p>
                            </div>
                            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <span className="text-xs uppercase text-emerald-500 font-bold">Compressed</span>
                                <p className="text-xl font-mono text-emerald-400">{compressionStats.compressed}</p>
                            </div>
                         </div>
                    )}

                    {hostUrl && (
                        <div className="w-full bg-cyber-950 p-4 rounded-xl border border-cyber-700 flex gap-2">
                            <input readOnly value={hostUrl} className="flex-1 bg-transparent text-sm text-cyber-400 focus:outline-none" />
                            <button onClick={() => navigator.clipboard.writeText(hostUrl)} className="text-slate-400 hover:text-white">
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {hostFile && (
                        <div className="w-full space-y-3 pt-2 border-t border-cyber-800">
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    Generate from this image
                                </h3>
                                <p className="text-xs text-slate-500">Describe how you want this image changed, then generate a new version.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={hostEditPrompt}
                                    onChange={(e) => setHostEditPrompt(e.target.value)}
                                    placeholder="Ex: Make the background a sunset beach..."
                                    className="flex-1 bg-cyber-900 border border-cyber-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-500 placeholder:text-slate-600"
                                />
                                <button
                                    onClick={handleHostGenerate}
                                    disabled={hostEditLoading || !hostEditPrompt.trim()}
                                    className="px-5 py-3 bg-gradient-to-r from-purple-600 to-cyber-500 hover:from-purple-500 hover:to-cyber-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {hostEditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Generate
                                </button>
                            </div>

                            {hostEditResult && (
                                <div className="space-y-2">
                                    <img src={hostEditResult} alt="Generated result" className="w-full rounded-xl border border-cyber-700" />
                                    <a
                                        href={hostEditResult}
                                        download="bmb-ai-generated.png"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyber-800 hover:bg-cyber-700 text-white text-sm font-bold transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* DOWNLOADER MODE */}
            {mode === 'DOWNLOADER' && (
                <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6 animate-fadeIn">
                     <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold text-white">URL to Image</h2>
                        <p className="text-slate-400">Download any image from a direct link</p>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={downloadUrl} 
                            onChange={(e) => setDownloadUrl(e.target.value)}
                            placeholder="Paste image URL here..."
                            className="flex-1 bg-cyber-950 border border-cyber-700 rounded-xl px-4 py-3 text-white focus:border-cyber-500 focus:outline-none placeholder:text-slate-600"
                        />
                        <button onClick={handleUrlDownload} className="bg-cyber-500 hover:bg-cyber-400 text-white px-6 rounded-xl font-bold transition-colors">
                            Fetch
                        </button>
                    </div>
                    {previewBlob && (
                        <div className="relative group rounded-xl overflow-hidden border border-cyber-700 bg-black/50">
                            <img src={previewBlob} alt="Preview" className="w-full max-h-[400px] object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={() => downloadImage(previewBlob!, 'downloaded_image.png')}
                                    className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* AI GENERATOR MODE */}
            {mode === 'AI_GEN' && (
                <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6 animate-fadeIn">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold text-white">Bmb Ai Image Gen</h2>
                        <p className="text-slate-400">Powered by Nano Banana (Flash Image) Model</p>
                    </div>

                    {!genReferenceImage && (
                      <div className="flex justify-center">
                          <ProviderSelector capability="supportsImage" value={genProvider} onChange={setGenProvider} />
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {/* Reference image upload */}
                        <input type="file" ref={genImageInputRef} className="hidden" accept="image/*" onChange={handleGenReferenceSelect} />
                        {genReferenceImage ? (
                          <div className="flex items-center gap-3 bg-cyber-950 border border-cyber-700 rounded-xl p-3">
                            <img src={URL.createObjectURL(genReferenceImage)} alt="Reference" className="w-14 h-14 object-cover rounded-lg border border-cyber-700" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-300 truncate">{genReferenceImage.name}</p>
                              <p className="text-[10px] text-slate-500">Using this image as reference</p>
                            </div>
                            <button
                              onClick={() => setGenReferenceImage(null)}
                              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                              title="Remove reference image"
                            >
                              <Check className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => genImageInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-cyber-700 text-slate-400 hover:border-cyber-500 hover:text-white transition-colors text-sm"
                          >
                            <Upload className="w-4 h-4" />
                            Upload a reference image (optional)
                          </button>
                        )}

                        <textarea 
                            value={genPrompt} 
                            onChange={(e) => setGenPrompt(e.target.value)}
                            placeholder={genReferenceImage ? "Describe how to transform this image..." : "Describe the image you want to generate..."}
                            className="w-full h-32 bg-cyber-950 border border-cyber-700 rounded-xl p-4 text-white focus:border-cyber-500 focus:outline-none resize-none placeholder:text-slate-600"
                        />
                        <button 
                            onClick={handleAIGenerate}
                            disabled={genLoading || !genPrompt}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {genLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {genLoading && genAutoAttempt ? `Trying ${genAutoAttempt}...` : 'Generate Image'}
                        </button>
                    </div>
                    {genImage && (
                        <div ref={genResultRef} className="mt-4 rounded-xl overflow-hidden border border-cyber-700 shadow-2xl relative group scroll-mt-4">
                            <img src={genImage} alt="Generated" className="w-full h-auto" />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button onClick={() => downloadImage(genImage!, 'ai_generated.png')} className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                    {genImage && (
                        <button
                            onClick={() => downloadImage(genImage!, 'ai_generated.png')}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyber-800 hover:bg-cyber-700 text-white text-sm font-bold transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download Image
                        </button>
                    )}
                </div>
            )}

            {/* EXTRACTOR MODE */}
            {mode === 'EXTRACTOR' && (
                <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center space-y-8 animate-fadeIn">
                     <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Prompt Extractor</h2>
                        <p className="text-slate-400">Reverse engineer prompts from any image</p>
                    </div>

                    {!extractFile ? (
                        <div 
                            onClick={() => extractInputRef.current?.click()}
                            className="w-full h-48 border-2 border-dashed border-cyber-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-cyber-800/50 transition-all group"
                        >
                            <input type="file" ref={extractInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleExtract(e.target.files[0])} />
                            <Camera className="w-12 h-12 text-slate-500 group-hover:text-purple-400 mb-4 transition-colors" />
                            <p className="text-slate-400">Upload Image to Analyze</p>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-6">
                            <div className="flex items-center gap-4 bg-cyber-800 p-2 rounded-xl border border-cyber-700">
                                <div className="w-16 h-16 rounded-lg bg-black overflow-hidden shrink-0">
                                    <img src={URL.createObjectURL(extractFile)} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-sm font-bold text-white">{extractFile.name}</p>
                                    <p className="text-xs text-slate-500">{formatBytes(extractFile.size)}</p>
                                </div>
                                <button onClick={() => {setExtractFile(null); setExtractResult('');}} className="p-2 hover:bg-white/10 rounded-lg"><Minimize2 className="w-4 h-4" /></button>
                            </div>

                            <div className="bg-cyber-950 rounded-xl p-6 border border-cyber-700 min-h-[200px] text-left relative">
                                {extractLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 text-purple-400">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Analyzing visuals...</span>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Suggested Prompt:
                                        </h3>
                                        <p className="text-slate-300 leading-relaxed">{extractResult}</p>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(extractResult)}
                                            className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Copy className="w-4 h-4" /> Copy Prompt
                                        </button>
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

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Sparkles, Upload, FileText, Download, X, AlertCircle, Wand2, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import html2pdf from 'html2pdf.js';
import { cn } from '@/lib/utils';
import Sidebar from '../Sidebar';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocGeneratorProps {
    asModal?: boolean;
    onClose?: () => void;
}

export default function DocGenerator({ asModal = false, onClose }: DocGeneratorProps) {
    const navigate = useNavigate();
    const [images, setImages] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        setIsGenerating(true);
        setError(null);
        try {
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                const newImages: string[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    if (context) {
                        await page.render({ canvasContext: context, viewport: viewport }).promise;
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        newImages.push(dataUrl);
                    }
                }
                
                if (newImages.length > 0) {
                    setImages(prev => [...prev, ...newImages]);
                }
            } else if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        setImages(prev => [...prev, reader.result as string]);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                setError('Hanya mendukung format Gambar (JPG/PNG) atau PDF.');
            }
        } catch (err) {
            console.error('File parsing error:', err);
            setError('Gagal membaca file. Pastikan file tidak rusak.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(processFile);
        // Clear input to allow uploading the same file again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        files.forEach(processFile);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please provide instructions for what to fill in the document.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setDownloadUrl(null);

        try {
            // Use relative path to take advantage of Vite's proxy and avoid CORS
            const response = await fetch(`/api/generate-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'local-user', // Add actual auth user context if needed
                    prompt,
                    images
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const serverErrorDetail = errData.details ? `: ${errData.details}` : '';
                throw new Error(errData.error ? `${errData.error}${serverErrorDetail}` : `Server error: ${response.statusText}`);
            }

            // The response is now JSON containing the generated HTML
            const data = await response.json();
            
            if (!data.html) {
                throw new Error('Failed to generate document content. Please try a different prompt.');
            }

            // Client-side PDF generation using html2pdf
            const container = document.createElement('div');
            container.innerHTML = data.html;
            
            // Adjust styles for rendering before printing
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '794px'; // A4 width in pixels (~210mm)
            container.style.background = 'white';
            container.style.color = 'black';
            container.style.padding = '20px';
            document.body.appendChild(container);

            const opt = {
                margin:       10, // mm
                filename:     `noir-smart-document-${Date.now()}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // This triggers the download in browser directly
            const html2pdfFunc = (html2pdf as any).default || html2pdf;
            await html2pdfFunc().set(opt).from(container).save();
            document.body.removeChild(container);

        } catch (err: any) {
            console.error('PDF Generation Error:', err);
            setError(err.message || 'Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={cn(
            "flex bg-[#030303] text-zinc-100 font-sans overflow-hidden selection:bg-blue-500/30",
            asModal ? "fixed inset-0 z-[100] backdrop-blur-sm bg-black/80 items-center justify-center p-4 md:p-8" : "h-screen"
        )}>
            {asModal && (
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[110] p-3 rounded-full bg-white/10 hover:bg-red-500 text-white transition-all shadow-xl backdrop-blur-md"
                >
                    <X size={24} />
                </button>
            )}

            {/* Ambient Lighting Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Sidebar */}
            {!asModal && (
                <div className="hidden md:block w-64 h-full relative z-30 border-r border-white/5 bg-black/20 backdrop-blur-xl">
                    <Sidebar 
                        onNewChat={() => navigate('/')} 
                        onSelectSession={() => {}} 
                        onOpenSettings={() => {}} 
                    />
                </div>
            )}

            <div className={cn(
                "flex-1 flex flex-col relative z-20",
                asModal ? "max-w-6xl w-full h-full max-h-[90vh] bg-[#0a0a0a]/90 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl" : "h-full"
            )}>
                {/* Header */}
                <header className="flex-none pt-12 pb-6 px-6 md:px-12 z-20">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)]">
                                <Wand2 className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
                                    Smart Document
                                </h1>
                                <p className="text-sm text-zinc-400 mt-1 font-medium">Replicate any form structure & fill data via AI.</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto px-6 md:px-12 pb-12 custom-scrollbar">
                    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 h-full min-h-[500px]">
                        
                        {/* Left Column: Image Upload Area */}
                        <div className="w-full lg:w-1/2 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">1. Reference Files</h2>
                                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-md">PDF or Images</span>
                            </div>
                            
                            <div 
                                className={cn(
                                    "flex-1 relative rounded-3xl border border-white/10 overflow-hidden transition-all duration-500 flex flex-col group",
                                    images.length > 0 
                                        ? "bg-zinc-900/40 shadow-inner" 
                                        : "bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-blue-500/30 hover:shadow-[0_0_40px_-15px_rgba(59,130,246,0.2)] border-dashed"
                                )}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                {images.length > 0 ? (
                                    <div className="w-full h-full flex flex-col p-4 backdrop-blur-sm">
                                        <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4">
                                            <AnimatePresence>
                                                {images.map((img, idx) => (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.9 }} 
                                                        animate={{ opacity: 1, scale: 1 }} 
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        key={idx} 
                                                        className="relative aspect-[3/4] bg-black/60 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center group/item"
                                                    >
                                                        <img 
                                                            src={img} 
                                                            alt={`Upload ${idx+1}`} 
                                                            className={cn("max-h-full max-w-full object-contain transition-transform duration-500 group-hover/item:scale-105 cursor-pointer", isGenerating && "opacity-70 blur-[1px]")}
                                                            onClick={() => setSelectedImage(img)}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                                        
                                                        {/* Scanning Animation */}
                                                        {isGenerating && (
                                                            <>
                                                                <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none backdrop-blur-[1px]" />
                                                                <motion.div
                                                                    initial={{ top: '0%' }}
                                                                    animate={{ top: '100%' }}
                                                                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                                                                    className="absolute left-0 w-full h-1.5 bg-blue-400 shadow-[0_0_20px_5px_rgba(59,130,246,0.9)] z-20 rounded-full"
                                                                />
                                                            </>
                                                        )}

                                                        <button 
                                                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute top-2 right-2 p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover/item:opacity-100 transition-all duration-300 scale-90 hover:scale-100 backdrop-blur-md"
                                                            disabled={isGenerating}
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                                
                                                {/* Add More Button inside grid */}
                                                <motion.button 
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-3 transition-all text-zinc-500 hover:text-blue-400 group/add"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/add:scale-110 transition-transform">
                                                        <Plus size={20} />
                                                    </div>
                                                    <span className="text-xs font-medium">Add Page</span>
                                                </motion.button>
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full z-10 p-8 min-h-[350px]">
                                        <div className="relative mb-6 group-hover:-translate-y-2 transition-transform duration-500">
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150 group-hover:scale-175 transition-transform duration-700" />
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                                                <Upload className="text-zinc-300 group-hover:text-blue-400 transition-colors" size={32} />
                                            </div>
                                        </div>
                                        <h3 className="text-xl text-zinc-200 font-semibold mb-2">Drop your files here</h3>
                                        <p className="text-zinc-500 text-sm max-w-[280px] mb-8 text-center leading-relaxed">
                                            Upload a blank PDF or images of the form you want us to replicate and fill.
                                        </p>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium transition-all hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)] flex items-center gap-2"
                                        >
                                            Browse Files
                                        </button>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    multiple
                                    accept="image/*,application/pdf"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>
                        
                        {/* Right Column: Prompt & Action */}
                        <div className="w-full lg:w-1/2 flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">2. AI INSTRUCTIONS</h2>
                                <Sparkles size={14} className="text-blue-400 animate-pulse" />
                            </div>
                            
                            <div className="flex-1 bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden flex flex-col relative group focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all duration-300 shadow-inner">
                                <div className="p-3 border-b border-white/5 bg-black/20 flex gap-2 items-center px-5">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500 ml-2">prompt.txt</span>
                                </div>
                                <textarea
                                    className="flex-1 w-full bg-transparent p-6 text-[15px] leading-relaxed text-zinc-200 placeholder-zinc-600 resize-none outline-none custom-scrollbar"
                                    placeholder="Write your instructions here...
                                    
e.g. 'Please analyze the uploaded form structure. Then, fill the table with the names of my team members:
1. Andi (CEO)
2. Budi (CTO)
3. Citra (Design Lead)

Make sure the output strictly follows the design from the uploaded image.'"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>

                            {/* Notifications */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, y: 10 }} 
                                        animate={{ opacity: 1, height: 'auto', y: 0 }} 
                                        exit={{ opacity: 0, height: 0, y: 10 }}
                                        className="mt-4 overflow-hidden"
                                    >
                                        <div className="p-4 rounded-2xl bg-[#3E1111] border border-red-500/30 flex items-start gap-3">
                                            <AlertCircle className="text-red-400 mt-0.5 shrink-0" size={18} />
                                            <p className="text-sm text-red-200">{error}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Action Area */}
                            <div className="mt-6">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !prompt.trim()}
                                    className={cn(
                                        "w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold transition-all duration-300 relative overflow-hidden group",
                                        isGenerating || !prompt.trim()
                                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                            : "bg-white text-black hover:scale-[1.02] shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.5)]"
                                    )}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-800 rounded-full animate-spin" />
                                            <span>Processing Document...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Generate Magic PDF</span>
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                    
                                    {/* Shimmer Effect */}
                                    {isGenerating ? (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]" />
                                    )}
                                </button>
                                
                                <p className="text-center text-xs text-zinc-600 mt-4 font-medium">Generation takes around 10-20 seconds depending on complexity.</p>

                                {/* Download Link Fallback */}
                                <AnimatePresence>
                                    {downloadUrl && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            className="text-center mt-4"
                                        >
                                            <a 
                                                href={downloadUrl} 
                                                download={`noir-smart-document-${Date.now()}.pdf`}
                                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                                            >
                                                <Download size={16} /> Download File Directly
                                            </a>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                        </div>
                    </div>
                </main>
            </div>

            {/* Fullscreen Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button 
                            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-red-500 text-white transition-all hover:scale-110"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            <X size={24} />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            src={selectedImage} 
                            alt="Fullscreen Preview" 
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

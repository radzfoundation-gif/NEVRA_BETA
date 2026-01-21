import React, { useState, useRef, useCallback } from 'react';
import { X, Download, Check, Code, Sparkles, ExternalLink, Loader2, Upload, Copy, Image as ImageIcon, RefreshCw, ArrowRight, Palette, AlertTriangle, Zap, Plus, Mic, Send, Layout, Monitor, PenTool, ChevronDown, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidMetal from './ui/liquid-metal';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import SubscriptionPopup from './SubscriptionPopup';
interface RedesignWelcomeProps {
    onRedesign?: (result: RedesignResult) => void;
    className?: string;
    userName?: string;
}

interface RedesignResult {
    originalImage: string;
    redesignedHtml: string;
    suggestions: string[];
    isLogo: boolean;
}

export function RedesignWelcome({
    onRedesign,
    className,
    userName
}: RedesignWelcomeProps) {
    const [mode, setMode] = useState<'redesign' | 'logo'>('redesign');
    const [selectedModel, setSelectedModel] = useState<'gemini-3-pro'>('gemini-3-pro');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<RedesignResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'compare'>('preview');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isToolsOpen, setIsToolsOpen] = useState(false);

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
        setPrompt(e.target.value);
    };

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8788';

    // Usage limits hook
    const { checkFeatureLimit, incrementFeatureUsage, isSubscribed, featureUsage } = useTokenLimit();

    // Check redesign limit before processing
    const checkRedesignLimit = (): boolean => {
        const redesignStatus = checkFeatureLimit('redesign');
        if (redesignStatus.exceeded) {
            setShowSubscriptionPopup(true);
            return false;
        }
        return true;
    };

    const iconProps = { strokeWidth: 1.5, size: 20 };
    const smIconProps = { strokeWidth: 1.5, size: 16 };

    const redesignLoadingSteps = [
        "Analyzing your design...",
        "Identifying UI patterns...",
        "Generating modern layout...",
        "Applying clean styling...",
        "Polishing the result..."
    ];

    const logoLoadingSteps = [
        "Analyzing design request...",
        "Creating visual composition...",
        "Rendering CSS artwork...",
        "Adding finishing touches..."
    ];

    const loadingSteps = mode === 'redesign' ? redesignLoadingSteps : logoLoadingSteps;

    // Logo design example prompts
    const logoPrompts = [
        "Modern minimalist logo for tech startup 'Nexus'",
        "Glassmorphic card with gradient border effect",
        "3D floating button with neon glow",
        "Abstract geometric logo for design agency",
    ];

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        } else {
            setError('Please upload an image file (PNG, JPG, WebP)');
        }
    }, []);

    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, WebP)');
            return;
        }

        // Reduced limit for mobile (5MB instead of 10MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Image must be under 5MB');
            return;
        }

        try {
            // Compress image for mobile
            const compressedImage = await compressImage(file);
            setUploadedImage(compressedImage);
            setError(null);
        } catch (err) {
            console.error('Error processing image:', err);
            setError('Failed to process image. Please try a smaller image.');
        }
    };

    // Compress image to reduce base64 size for mobile
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            reject(new Error('Canvas context not available'));
                            return;
                        }

                        // Max dimension for mobile (800px)
                        const maxDim = 800;
                        let { width, height } = img;

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = (height / width) * maxDim;
                                width = maxDim;
                            } else {
                                width = (width / height) * maxDim;
                                height = maxDim;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);

                        // Quality 0.7 for smaller file size
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        console.log(`[Redesign] Image compressed: ${file.size} bytes -> ~${(compressedDataUrl.length * 0.75).toFixed(0)} bytes`);
                        resolve(compressedDataUrl);
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleGenerate = async () => {
        // Check redesign limit
        if (!checkRedesignLimit()) return;

        if (mode === 'redesign' && !uploadedImage) {
            setError('Please upload an image first');
            return;
        }

        if (mode === 'logo' && !prompt.trim()) {
            setError('Please describe what you want to create');
            return;
        }

        setIsLoading(true);
        setError(null);
        setLoadingStep(0);

        const stepInterval = setInterval(() => {
            setLoadingStep(prev => (prev + 1) % loadingSteps.length);
        }, 1800);

        try {
            let effectivePrompt = '';

            if (mode === 'redesign') {
                const userInstructions = prompt.trim();
                effectivePrompt = `
You are an expert UI/UX designer and frontend developer. Your task is to REDESIGN the uploaded website/UI screenshot into a modern, clean, professional version.

USER'S ADDITIONAL INSTRUCTIONS: ${userInstructions || 'Make it modern and clean'}

REDESIGN REQUIREMENTS:
1. **Analyze the Original**: Understand the layout, sections, and purpose of the uploaded design
2. **Modernize Everything**:
   - Replace outdated styles with modern aesthetics
   - Use clean typography (Inter, system fonts)
   - Apply proper spacing and visual hierarchy
   - Use modern color palette (zinc, slate for neutrals; purple, blue, emerald for accents)
3. **Keep the Structure**: Maintain the general layout and sections, but improve them
4. **Modern Design Patterns**:
   - Subtle shadows (shadow-sm, shadow-md, shadow-lg)
   - Rounded corners (rounded-lg, rounded-xl, rounded-2xl)
   - Ample whitespace and breathing room
   - Hover states and micro-interactions
   - Responsive design (mobile-first)
5. **Clean Code**:
   - Semantic HTML5 structure
   - Tailwind CSS for all styling
   - No unnecessary complexity

OUTPUT:
- Complete HTML5 document with <!DOCTYPE html>
- Include <script src="https://cdn.tailwindcss.com"></script>
- NO external images - use colored placeholder divs or gradients
- Include realistic content based on the original
- Make it production-ready quality

Return ONLY the HTML code, no explanations.
`;
            } else {
                // Logo/Design mode
                effectivePrompt = `
You are an expert CSS artist and visual designer. Create a stunning visual design based on this request:

"${prompt.trim()}"

DESIGN REQUIREMENTS:
1. **Visual Impact First**: This is for visual presentation, prioritize "WOW factor"
2. **CSS Art Techniques**:
   - Use advanced CSS transforms (rotate, scale, skew, perspective)
   - Complex gradients (linear-gradient, radial-gradient, conic-gradient)
   - Multiple layered shadows for depth
   - Pseudo-elements (::before, ::after) for decorative effects
   - CSS animations and keyframes if appropriate
3. **For Logos**:
   - Center the logo in the viewport
   - Use clean typography or geometric shapes
   - Include multiple color/style variations if useful
   - Make it look professional and modern
4. **For UI Components**:
   - Glassmorphism: backdrop-blur, bg-white/10, subtle borders
   - Neomorphism: dual shadows (light and dark)
   - 3D effects: transform-style preserve-3d, rotateX/Y
5. **Color Palette**:
   - Modern gradients: purple-pink, blue-cyan, orange-yellow
   - Dark backgrounds for contrast: bg-zinc-950, bg-slate-900
   - Accent colors that pop

OUTPUT FORMAT:
- Complete HTML5 document with <!DOCTYPE html>
- Include <script src="https://cdn.tailwindcss.com"></script> 
- Can include <style> tag for custom CSS animations/complex effects
- Center the design in viewport using flex/grid
- Background should complement the design (usually dark for contrast)
- The result should be screenshot-ready/exportable

Return ONLY the HTML code, no explanations.
`;
            }

            const response = await fetch(`${apiUrl}/api/redesign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: uploadedImage,
                    prompt: effectivePrompt,
                    model: selectedModel,
                    designMode: mode,
                }),
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server connection failed. Please restart the backend.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate');
            }

            let cleanHtml = data.html;
            if (cleanHtml.startsWith('```')) {
                cleanHtml = cleanHtml.replace(/^```html\s*/, '').replace(/```$/, '');
            }

            const redesignResult: RedesignResult = {
                originalImage: uploadedImage || '',
                redesignedHtml: cleanHtml,
                suggestions: data.suggestions || [],
                isLogo: mode === 'logo',
            };

            setResult(redesignResult);
            setActiveTab(mode === 'redesign' ? 'compare' : 'preview');
            onRedesign?.(redesignResult);
            // Increment redesign usage on success
            incrementFeatureUsage('redesign');
        } catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            clearInterval(stepInterval);
            setIsLoading(false);
        }
    };

    const handleCopyHtml = async () => {
        if (!result?.redesignedHtml) return;
        await navigator.clipboard.writeText(result.redesignedHtml);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadHtml = () => {
        try {
            if (!result?.redesignedHtml) return;
            setIsDownloading(true);
            const blob = new Blob([result.redesignedHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nevra-${mode}-${Date.now()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setTimeout(() => setIsDownloading(false), 1000);
        } catch (e) {
            setIsDownloading(false);
        }
    };

    const handleDownloadPng = async () => {
        if (!result?.redesignedHtml) return;
        setIsDownloading(true);
        const iframe = document.createElement('iframe');
        Object.assign(iframe.style, { position: 'absolute', left: '-9999px', width: '800px', height: '800px', opacity: '0' });
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open(); doc.write(result.redesignedHtml); doc.close();
            setTimeout(() => {
                import('html2canvas').then(({ default: html2canvas }) => {
                    html2canvas(doc.body, { backgroundColor: null, scale: 2, useCORS: true, logging: false }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `nevra-design-${Date.now()}.png`;
                        link.href = canvas.toDataURL('image/png');
                        document.body.appendChild(link); link.click(); document.body.removeChild(link);
                        document.body.removeChild(iframe); setIsDownloading(false);
                    }).catch(() => { handleDownloadHtml(); document.body.removeChild(iframe); setIsDownloading(false); });
                }).catch(() => { handleDownloadHtml(); document.body.removeChild(iframe); setIsDownloading(false); });
            }, 1000);
        } else { setIsDownloading(false); }
    };

    const handleDownload = () => {
        // If Logo mode, prefer PNG download
        if (mode === 'logo') {
            handleDownloadPng();
        } else {
            handleDownloadHtml();
        }
    };

    const handleReset = () => {
        setResult(null);
        setUploadedImage(null);
        setError(null);
        setPrompt('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const switchMode = (newMode: 'redesign' | 'logo') => {
        setMode(newMode);
        setResult(null);
        setUploadedImage(null);
        setPrompt('');
        setError(null);
    };

    return (
        <div className={cn(
            "w-full flex flex-col items-center justify-start p-4 md:p-8 relative max-w-[1400px] mx-auto pt-16 md:pt-20",
            className
        )}>
            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8"
                    >
                        <div className="w-full max-w-md space-y-8 text-center">
                            <div className="relative w-24 h-24 mx-auto">
                                <motion.div
                                    className={cn(
                                        "absolute inset-0 rounded-3xl",
                                        mode === 'redesign'
                                            ? "bg-gradient-to-tr from-purple-500 to-pink-500"
                                            : "bg-gradient-to-tr from-pink-500 to-orange-500"
                                    )}
                                    animate={{
                                        rotate: [0, 90, 180, 270, 360],
                                        borderRadius: ["20%", "50%", "20%"],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                                />
                                <motion.div
                                    className="absolute inset-3 bg-white rounded-2xl shadow-lg z-10 flex items-center justify-center"
                                    animate={{ rotate: [0, -90, -180, -270, -360] }}
                                    transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                                >
                                    {mode === 'redesign' ? <RefreshCw className="w-8 h-8 text-purple-600" /> : <Palette className="w-8 h-8 text-pink-600" />}
                                </motion.div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-zinc-900">
                                    {mode === 'redesign' ? 'Redesigning Your UI' : 'Creating Your Design'}
                                </h3>
                                <motion.p
                                    key={loadingStep}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-base text-zinc-500"
                                >
                                    {loadingSteps[loadingStep]}
                                </motion.p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {result ? (
                // RESULT VIEW
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900">
                                {mode === 'redesign' ? 'Redesign Complete ✨' : 'Design Created ✨'}
                            </h2>
                            <p className="text-zinc-500 text-sm">
                                {mode === 'redesign' ? 'Your UI has been modernized' : 'Your design is ready'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
                                New {mode === 'redesign' ? 'Redesign' : 'Design'}
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    {/* Tabs (Hidden in Logo Mode) */}
                    {mode === 'redesign' && (
                        <div className="flex bg-zinc-100 p-1 rounded-xl mb-6 w-fit">
                            <button
                                onClick={() => setActiveTab('compare')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    activeTab === 'compare' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                                )}
                            >
                                Before / After
                            </button>
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    activeTab === 'preview' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                                )}
                            >
                                Preview
                            </button>
                            <button
                                onClick={() => setActiveTab('code')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    activeTab === 'code' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                                )}
                            >
                                Code
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
                        {activeTab === 'compare' && mode === 'redesign' ? (
                            <div className="grid md:grid-cols-2 gap-0 divide-x divide-zinc-200">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-sm font-medium text-zinc-600">Before</span>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                                        <img src={result.originalImage} alt="Original" className="w-full h-auto object-contain max-h-[500px]" />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-sm font-medium text-zinc-600">After</span>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-zinc-200 bg-white h-[500px]">
                                        <iframe srcDoc={result.redesignedHtml} className="w-full h-full border-0" title="Redesigned" sandbox="allow-scripts allow-same-origin" />
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'preview' ? (
                            <div className="relative group">
                                <iframe srcDoc={result.redesignedHtml} className="w-full h-[600px] border-0" title="Preview" sandbox="allow-scripts allow-same-origin" />
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => window.open(URL.createObjectURL(new Blob([result.redesignedHtml], { type: 'text/html' })), '_blank')} className="bg-white/90 backdrop-blur text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm hover:bg-white flex items-center gap-1.5">
                                        <ExternalLink size={12} /> Fullscreen
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-zinc-900">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                                    <span className="text-xs text-zinc-400 font-mono">index.html</span>
                                    <button onClick={handleCopyHtml} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                                        {copied ? <Check size={12} /> : <Copy size={12} />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <textarea readOnly value={result.redesignedHtml} className="w-full h-[500px] bg-zinc-950 text-zinc-300 font-mono text-xs p-4 resize-none focus:outline-none" spellCheck={false} />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 p-4 border-t border-zinc-100 bg-zinc-50">
                            <button onClick={handleDownload} disabled={isDownloading} className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50", mode === 'redesign' ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90")}>
                                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                {(mode === 'logo') ? 'Download Image' : 'Download HTML'}
                            </button>
                            <button onClick={handleCopyHtml} className="px-4 py-3 bg-white text-zinc-700 rounded-xl font-medium text-sm hover:bg-zinc-100 transition-all flex items-center gap-2 border border-zinc-200">
                                {copied ? <Check size={16} className="text-green-600" /> : <Code size={16} />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                // INPUT VIEW
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center w-full max-w-4xl mx-auto">
                    {/* Brand */}
                    <div className="mb-6 scale-[0.75] md:scale-90">
                        <LiquidMetal
                            metalConfig={{ colorBack: mode === 'redesign' ? '#8B5CF6' : '#EC4899', colorTint: '#FFFFFF', speed: 0.5, repetition: 4 }}
                            className="text-4xl md:text-5xl font-bold tracking-widest text-white px-8 py-5 rounded-2xl shadow-xl"
                        >
                            NEVRA LABS
                        </LiquidMetal>
                    </div>

                    {/* Headline */}
                    <div className="text-center mb-6 space-y-2">
                        <div className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400/50">
                            Under Development
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            {mode === 'redesign' ? 'UI/UX Generation Engine' : 'AI Design Studio'}
                        </h1>
                        <p className="text-base text-zinc-500 max-w-lg mx-auto">
                            {mode === 'redesign' ? 'Specialized UI/UX Engine powered by Gemini 3 Pro & GPT-4.1 Mini' : 'Create logos, components, and visual designs.'}
                        </p>
                    </div>

                    {/* Gemini-Style Input Area */}
                    <div className="w-full max-w-3xl relative mt-8 z-40">

                        {/* Tools Dropdown */}
                        <AnimatePresence>
                            {isToolsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 mb-4 bg-[#1E1F20] border border-white/10 rounded-2xl shadow-2xl p-2 w-64 z-50 overflow-hidden"
                                >
                                    <div className="text-xs font-bold text-zinc-500 px-3 py-2 uppercase tracking-wider mb-1">Tools</div>
                                    <button
                                        onClick={() => { switchMode('redesign'); setIsToolsOpen(false); }}
                                        className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left", mode === 'redesign' ? "bg-[#333537] text-white" : "text-zinc-400 hover:bg-[#2C2D2E] hover:text-white")}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                            <Monitor size={16} />
                                        </div>
                                        <div>
                                            <div className="text-white">Visual Layout</div>
                                            <div className="text-[10px] text-zinc-500 font-normal">Website & UI Redesign</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { switchMode('logo'); setIsToolsOpen(false); }}
                                        className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left", mode === 'logo' ? "bg-[#333537] text-white" : "text-zinc-400 hover:bg-[#2C2D2E] hover:text-white")}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
                                            <PenTool size={16} />
                                        </div>
                                        <div>
                                            <div className="text-white">Create Logo</div>
                                            <div className="text-[10px] text-zinc-500 font-normal">Brand & Icon Design</div>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Bar */}
                        <div
                            className={cn(
                                "group bg-[#1E1F20] border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600 rounded-[24px] md:rounded-[28px] p-2 pr-2 md:pr-4 shadow-xl transition-all relative flex items-end gap-2",
                                isDragging ? "ring-2 ring-purple-500 border-purple-500" : ""
                            )}
                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        >
                            {/* Hidden File Input */}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                            {/* Tools Trigger */}
                            <button
                                onClick={() => setIsToolsOpen(!isToolsOpen)}
                                className={cn("h-10 w-10 md:h-12 md:w-12 rounded-full transition-all bg-[#2C2D2E] hover:bg-[#3C3D3F] text-white shrink-0 flex items-center justify-center")}
                                title="Open Tools"
                            >
                                <Plus className="w-5 h-5 md:w-6 md:h-6" />
                            </button>

                            {/* Input Content */}
                            <div className="flex-1 min-w-0 py-2 md:py-3 relative">
                                {/* Image Preview Chip */}
                                {uploadedImage && (
                                    <div className="relative inline-block mb-2 md:mb-3 mr-2 group/img">
                                        <img src={uploadedImage} alt="Upload" className="h-12 w-12 md:h-16 md:w-16 object-cover rounded-lg md:rounded-xl border border-white/10" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                                            className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-700 text-white rounded-full p-1 hover:bg-red-500 hover:border-red-500 transition-all opacity-0 group-hover/img:opacity-100 shadow-sm"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                <textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    onChange={handleInput}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                                    placeholder={mode === 'redesign' ? "Upload a screenshot or describe a layout..." : "Describe the logo you want to create..."}
                                    className="w-full bg-transparent text-white placeholder-zinc-500 text-base md:text-lg resize-none focus:outline-none max-h-[200px] overflow-y-auto leading-relaxed scrollbar-hide"
                                    rows={1}
                                    style={{ minHeight: '28px' }}
                                />
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-center gap-2 pb-2 shrink-0">
                                {/* Upload Trigger (if no image) */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                                    title="Upload Image"
                                >
                                    <Paperclip size={20} />
                                </button>

                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading || (!prompt.trim() && !uploadedImage && mode === 'redesign')}
                                    className={cn(
                                        "h-10 w-10 md:h-12 md:w-12 rounded-full transition-all flex items-center justify-center",
                                        (prompt.trim() || uploadedImage) && !isLoading
                                            ? "bg-white text-zinc-900 hover:scale-105 shadow-md"
                                            : "bg-[#2C2D2E] text-zinc-600"
                                    )}
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={cn((prompt.trim() || uploadedImage) ? "ml-0.5" : "")} />}
                                </button>
                            </div>
                        </div>

                        {/* Drag Overlay Hint */}
                        {isDragging && (
                            <div className="absolute inset-0 bg-purple-500/20 rounded-[28px] border-2 border-purple-500 border-dashed z-20 flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                                <span className="px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-bold shadow-lg">Drop image here</span>
                            </div>
                        )}

                        {/* Helper Text / Mode Indicator */}
                        <div className="mt-6 flex justify-between items-center px-4">
                            <div className="flex gap-2">
                                <span className={cn("text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 flex items-center gap-2 transition-all hover:bg-white/10 cursor-pointer")} onClick={() => setIsToolsOpen(true)}>
                                    {mode === 'redesign' ? <Monitor size={14} className="text-purple-500" /> : <PenTool size={14} className="text-pink-500" />}
                                    {mode === 'redesign' ? 'Visual Layout' : 'Logo Creator'}
                                    <ChevronDown size={12} className="opacity-50 ml-1" />
                                </span>
                            </div>
                            <div className="text-xs text-zinc-400 hidden sm:block">
                                Powered by <span className="text-zinc-500 font-bold">Gemini 3 Pro</span>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    {mode === 'redesign' && (
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            {[
                                { icon: <ImageIcon size={20} />, title: "Upload Any Design", desc: "Screenshots, mockups, or websites" },
                                { icon: <RefreshCw size={20} />, title: "AI Redesign", desc: "Modern, clean version instantly" },
                                { icon: <Code size={20} />, title: "Export Code", desc: "Production-ready HTML" },
                            ].map((f, i) => (
                                <div key={i} className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3">{f.icon}</div>
                                    <h4 className="font-semibold text-zinc-800 mb-1">{f.title}</h4>
                                    <p className="text-sm text-zinc-500">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Error Toast */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                            <X size={16} />
                            <span className="text-sm font-medium">{error}</span>
                            <button onClick={() => setError(null)} className="ml-1 hover:bg-red-100 p-1 rounded-lg"><X size={14} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subscription Popup */}
            <SubscriptionPopup
                isOpen={showSubscriptionPopup}
                onClose={() => setShowSubscriptionPopup(false)}
                tokensUsed={featureUsage.redesign.used}
                tokensLimit={featureUsage.redesign.limit}
            />
        </div>
    );
}

export default RedesignWelcome;

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, ArrowUp, Link as LinkIcon, Layers, Paperclip, ChevronDown, Check, Sparkles, LayoutGrid, Mic, Youtube, FileText, X, Loader2, Wrench, AlertTriangle, Image as ImageIcon, PenTool, Grid3X3, BarChart3, ChevronRight, Bot, Atom, Lightbulb, Cpu, AudioLines } from 'lucide-react';
import ModelSelector, { ModelType } from './ui/ModelSelector';
import { cn, getApiUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidMetal from './ui/liquid-metal';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import SubscriptionPopup from './SubscriptionPopup';
interface ResearchWelcomeProps {
    onSearch: (query: string, attachments?: AttachmentData[], model?: ModelType, reasoning?: boolean) => void;
    initialQuery?: string;
    className?: string;
    hasApiKey?: boolean;
    userName?: string;
    isWebSearchEnabled?: boolean;
    onToggleWebSearch?: (enabled: boolean) => void;
}

interface AttachmentData {
    type: 'file' | 'audio' | 'youtube' | 'url';
    name: string;
    content: string;
    mimeType?: string;
}

export function ResearchWelcome({
    onSearch,
    initialQuery = '',
    className,
    hasApiKey = true,
    userName,
    isWebSearchEnabled = false,
    onToggleWebSearch
}: ResearchWelcomeProps) {
    const [query, setQuery] = useState(initialQuery);
    const [isFocused, setIsFocused] = useState(false);
    const [attachments, setAttachments] = useState<AttachmentData[]>([]);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showYouTubeInput, setShowYouTubeInput] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [previewData, setPreviewData] = useState<{ title: string; content: string; type: 'file' | 'audio' | 'youtube' | 'url'; mimeType?: string } | null>(null);
    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);

    // Model Selector State
    const [selectedModel, setSelectedModel] = useState<ModelType>('sonar');
    const [withReasoning, setWithReasoning] = useState(false);

    // Usage limits hook
    const { checkFeatureLimit, incrementFeatureUsage, isSubscribed, credits, softLimitReached, featureUsage } = useTokenLimit();

    // Check convert limit before processing
    const checkConvertLimit = (): boolean => {
        const { exceeded } = checkFeatureLimit('convert');
        if (exceeded) {
            setShowSubscriptionPopup(true);
            return false;
        }
        return true;
    };

    const confirmAttachment = () => {
        if (previewData) {
            setAttachments(prev => [...prev, {
                type: previewData.type,
                name: previewData.title,
                content: previewData.content,
                mimeType: previewData.mimeType
            }]);

            // Auto-fill prompt if empty to help user start
            if (!query.trim()) {
                let defaultPrompt = "Please analyze this attached content and provide a summary.";
                if (previewData.type === 'audio') defaultPrompt = "Please transcribe and summarize this audio.";
                if (previewData.type === 'youtube') defaultPrompt = "Please summarize this video transcript.";
                if (previewData.type === 'file' && previewData.title.endsWith('.pdf')) defaultPrompt = "Please summarize this PDF document.";

                setQuery(defaultPrompt);
            }

            setPreviewData(null);
        }
    };

    // Process transcription directly with AI and send to ChatInterface
    const processWithAI = () => {
        if (previewData) {
            // Create attachment
            const attachment: AttachmentData = {
                type: previewData.type,
                name: previewData.title,
                content: previewData.content,
                mimeType: previewData.mimeType
            };

            // Generate prompt based on content type
            let prompt = "Please analyze this content and provide a detailed summary.";
            if (previewData.type === 'audio') prompt = "Berikut adalah transkripsi audio. Tolong rangkum isi audio ini dengan jelas dan berikan poin-poin utamanya:";
            if (previewData.type === 'youtube') prompt = "Berikut adalah transkrip video YouTube. Tolong rangkum konten video ini dengan jelas:";
            if (previewData.type === 'url') prompt = "Berikut adalah konten dari halaman web. Tolong rangkum artikel ini:";
            if (previewData.type === 'file') prompt = "Berikut adalah isi dokumen. Tolong rangkum dokumen ini:";

            // Close modal and immediately send to ChatInterface
            setPreviewData(null);
            onSearch(prompt, [attachment], selectedModel, withReasoning);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const apiUrl = getApiUrl();
    const navigate = useNavigate();

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuery(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    };

    const [showImageGenInput, setShowImageGenInput] = useState(false);
    const [imageGenPrompt, setImageGenPrompt] = useState('');
    const [showKnowledgeInput, setShowKnowledgeInput] = useState(false);
    const [knowledgeText, setKnowledgeText] = useState('');
    const [knowledgeTitle, setKnowledgeTitle] = useState('');

    // Detect if query is an image generation request
    const isImageRequest = (text: string): boolean => {
        const imageKeywords = [
            'buatkan gambar', 'buat gambar', 'generate image', 'create image',
            'gambarkan', 'draw', 'ilustrasi', 'illustration', 'make an image',
            'buat foto', 'generate a picture', 'make a picture', 'design image'
        ];
        const lowerText = text.toLowerCase();
        return imageKeywords.some(keyword => lowerText.includes(keyword));
    };

    // Handle image generation
    const handleImageGeneration = async (prompt: string) => {
        setIsProcessing(true);
        setProcessingMessage('Generating image with AI...');

        try {
            const response = await fetch(`${apiUrl}/api/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (response.ok) {
                const data = await response.json();
                // Increment limit only on success (optional, already handled in hook if we moved logic there, but here we invoke API directly)
                // Assuming we want to navigate immediately to chat with the result
                navigate('/chat/new', {
                    state: {
                        initialPrompt: prompt,
                        generatedImage: data.image
                    }
                });
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to generate image');
            }
        } catch (error) {
            console.error('Image generation error:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (query.trim()) {
                // Check if this is an image generation request
                if (isImageRequest(query)) {
                    handleImageGeneration(query);
                } else {
                    onSearch(query, attachments, selectedModel, withReasoning);
                }
            }
        }
    };

    // Time-based Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // File Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Check limit for non-image files (convert feature)
        if (!checkConvertLimit()) return;

        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            setIsProcessing(true);
            setProcessingMessage(`Processing ${file.name}...`);

            try {
                if (file.type === 'application/pdf') {
                    // Upload to backend for PDF extraction
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await fetch(`${apiUrl}/api/extract-pdf`, {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setPreviewData({
                            type: 'file',
                            title: file.name,
                            content: data.text || 'PDF content extracted',
                            mimeType: 'application/pdf'
                        });
                        // Increment convert usage on success
                        incrementFeatureUsage('convert');
                    }
                } else if (file.type.startsWith('image/')) {
                    // Convert image to base64
                    const reader = new FileReader();
                    reader.onload = () => {
                        setAttachments(prev => [...prev, {
                            type: 'file',
                            name: file.name,
                            content: reader.result as string,
                            mimeType: file.type
                        }]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Text files
                    const text = await file.text();
                    setPreviewData({
                        type: 'file',
                        title: file.name,
                        content: text,
                        mimeType: file.type
                    });
                }
            } catch (error) {
                console.error('File upload error:', error);
            } finally {
                setIsProcessing(false);
                setProcessingMessage('');
            }
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Audio Upload Handler
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Check convert limit
        if (!checkConvertLimit()) return;

        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setProcessingMessage('Transcribing audio...');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${apiUrl}/api/transcribe-audio`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setPreviewData({
                    type: 'audio',
                    title: file.name,
                    content: data.transcript || 'Audio transcribed',
                });
                // Increment convert usage on success
                incrementFeatureUsage('convert');
            }
        } catch (error) {
            console.error('Audio transcription error:', error);
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
            if (audioInputRef.current) audioInputRef.current.value = '';
        }
    };

    // YouTube Transcript Handler
    const handleYouTubeSubmit = async () => {
        // Check convert limit
        if (!checkConvertLimit()) return;

        if (!youtubeUrl.trim()) return;

        setIsProcessing(true);
        setProcessingMessage('Extracting YouTube transcript...');

        try {
            const response = await fetch(`${apiUrl}/api/youtube-transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: youtubeUrl }),
            });

            const data = await response.json();

            if (response.ok && data.transcript) {
                setPreviewData({
                    type: 'youtube',
                    title: data.title || 'YouTube Video',
                    content: data.transcript,
                });
                setYoutubeUrl('');
                setShowYouTubeInput(false);
                // Increment convert usage on success
                incrementFeatureUsage('convert');
            } else {
                alert(data.error || 'Failed to extract transcript. Video may not have captions.');
            }
        } catch (error) {
            console.error('YouTube transcript error:', error);
            alert('Failed to connect to server. Please check if API is running.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    // URL Content Handler
    const handleUrlSubmit = async () => {
        // Check convert limit
        if (!checkConvertLimit()) return;

        if (!urlInput.trim()) return;

        setIsProcessing(true);
        setProcessingMessage('Fetching URL content...');

        try {
            const response = await fetch(`${apiUrl}/api/fetch-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput }),
            });

            if (response.ok) {
                const data = await response.json();
                setPreviewData({
                    type: 'url',
                    title: data.title || urlInput,
                    content: data.content || 'URL content fetched',
                });
                setUrlInput('');
                setShowUrlInput(false);
                // Increment convert usage on success
                incrementFeatureUsage('convert');
            }

        } catch (error) {
            console.error('URL fetch error:', error);
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    // Remove attachment
    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Handle Knowledge Base Embedding
    const handleEmbedDocument = async (text: string, title: string) => {
        setIsProcessing(true);
        setProcessingMessage('Embedding document to Knowledge Base...');
        try {
            // Mock user ID - in real app get from auth
            const userId = 'user_123';
            const response = await fetch(`${apiUrl}/api/embed-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, text, title })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Successfully embedded ${data.chunksProcessed} chunks!`);
            } else {
                alert('Failed to embed: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error embedding document');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    const tools = [
        { icon: <Mic size={14} />, label: 'Audio to Text', description: 'Transcribe audio (2 Credits)', action: () => audioInputRef.current?.click() },
        { icon: <Youtube size={14} />, label: 'YouTube to Text', description: 'Video transcript (2 Credits)', action: () => setShowYouTubeInput(true) },
        { icon: <FileText size={14} />, label: 'PDF to Text', description: 'Extract PDF (3 Credits)', action: () => fileInputRef.current?.click() },
        { icon: <LinkIcon size={14} />, label: 'URL to Text', description: 'Scrape webpage (3 Credits)', action: () => setShowUrlInput(true) },
        {
            icon: <Globe size={14} />, label: 'Add to Knowledge', description: 'Embed for RAG (2 Credits)', action: () => {
                setKnowledgeText('');
                setKnowledgeTitle('');
                setShowKnowledgeInput(true);
            }
        },
        {
            icon: <ImageIcon size={14} />, label: 'Generate Image (Beta)', description: '5 Credits (Locked)', action: () => {
                alert("Fitur ini sedang dalam tahap BETA TEST Noir AI dan dikunci sementara.");
            }
        },
    ];

    const examples = [
        { icon: <LayoutGrid size={14} />, label: "Write a to-do list", query: "Write a to-do list for a personal project" },
        { icon: <Sparkles size={14} />, label: "Generate an email", query: "Generate an email to reply to a job offer" },
        { icon: <Globe size={14} />, label: "Summarize article", query: "Summarize this article in one paragraph" },
        { icon: <Layers size={14} />, label: "Explain AI", query: "How does AI work in a technical capacity" }
    ];

    return (
        <div className={cn(
            "w-full min-h-full flex flex-col items-center justify-start md:justify-center p-4 md:p-6 relative max-w-4xl mx-auto pb-24 md:pb-6 pt-20 md:pt-6",
            className
        )}>
            {/* Hidden File Inputs */}
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.doc,.docx,image/*" onChange={handleFileUpload} className="hidden" multiple />
            <input ref={audioInputRef} type="file" accept="audio/*" capture="user" onChange={handleAudioUpload} className="hidden" />

            {/* Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-sm w-full relative overflow-hidden">
                            {/* Animated Background Mesh */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none" />

                            {/* Animated Waveform for Audio */}
                            {processingMessage.toLowerCase().includes('transcribing') || processingMessage.toLowerCase().includes('audio') ? (
                                <div className="flex items-end justify-center gap-1 h-20 mb-6">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 bg-gradient-to-t from-purple-600 via-indigo-500 to-blue-400 rounded-full"
                                            animate={{
                                                height: [12, 48 + Math.sin(i * 0.5) * 20, 12],
                                                scaleY: [1, 1.2, 1],
                                            }}
                                            transition={{
                                                duration: 0.6 + (i % 3) * 0.1,
                                                repeat: Infinity,
                                                delay: i * 0.08,
                                                ease: [0.4, 0, 0.2, 1]
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-25" />
                                    <div className="relative w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                    </div>
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">Processing</h3>
                            <p className="text-zinc-500 font-medium animate-pulse">{processingMessage}</p>

                            {/* Progress Indicator Line */}
                            <motion.div
                                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result Preview Modal */}
            <AnimatePresence>
                {previewData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
                        onClick={() => setPreviewData(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                        {previewData.type === 'youtube' && <Youtube size={20} className="text-red-500" />}
                                        {previewData.type === 'audio' && <Mic size={20} />}
                                        {previewData.type === 'url' && <LinkIcon size={20} className="text-blue-500" />}
                                        {previewData.type === 'file' && <FileText size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-900 truncate max-w-[300px]">{previewData.title}</h3>
                                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{previewData.type} Content</div>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
                                {previewData.mimeType?.startsWith('image/') ? (
                                    <div className="flex justify-center items-center h-full">
                                        <img
                                            src={previewData.content}
                                            alt={previewData.title}
                                            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                                        />
                                    </div>
                                ) : (
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 leading-relaxed">
                                        {previewData.content}
                                    </pre>
                                )}
                            </div>

                            <div className="p-4 border-t border-zinc-100 bg-white flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(previewData.content);
                                        // Optional: toast 'Copied!'
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                                >
                                    Copy to Clipboard
                                </button>
                                {!previewData.mimeType?.startsWith('image/') && (
                                    <button
                                        onClick={() => handleEmbedDocument(previewData.content, previewData.title)}
                                        className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                                    >
                                        Save to Knowledge
                                    </button>
                                )}
                                <button
                                    onClick={confirmAttachment}
                                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2"
                                >
                                    <Paperclip size={16} />
                                    Attach Only
                                </button>
                                <button
                                    onClick={processWithAI}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    <Sparkles size={16} />
                                    Process with AI
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* YouTube Input Modal */}
            <AnimatePresence>
                {showYouTubeInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowYouTubeInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                    <Youtube className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">YouTube to Text</h3>
                                    <p className="text-xs text-zinc-500">Paste a YouTube video URL</p>
                                </div>
                            </div>
                            <input
                                type="url"
                                value={youtubeUrl}
                                onChange={e => setYoutubeUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowYouTubeInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleYouTubeSubmit}
                                    disabled={!youtubeUrl.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Extract Transcript
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Generation Input Modal */}
            <AnimatePresence>
                {showImageGenInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowImageGenInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-pink-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">Generate Image</h3>
                                    <p className="text-xs text-zinc-500">Describe the image you want to create</p>
                                </div>
                            </div>
                            <textarea
                                value={imageGenPrompt}
                                onChange={e => setImageGenPrompt(e.target.value)}
                                placeholder="A futuristic city with flying cars at sunset..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4 min-h-[100px] resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowImageGenInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowImageGenInput(false);
                                        handleImageGeneration(imageGenPrompt);
                                    }}
                                    disabled={!imageGenPrompt.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Generate
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Knowledge Base Input Modal */}
            <AnimatePresence>
                {showKnowledgeInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowKnowledgeInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-lg"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">Add to Knowledge Base</h3>
                                    <p className="text-xs text-zinc-500">Embed text for semantic search (RAG)</p>
                                </div>
                            </div>

                            <input
                                type="text"
                                value={knowledgeTitle}
                                onChange={e => setKnowledgeTitle(e.target.value)}
                                placeholder="Document Title (Optional)"
                                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-3"
                            />

                            <textarea
                                value={knowledgeText}
                                onChange={e => setKnowledgeText(e.target.value)}
                                placeholder="Paste the text content you want to embed here..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4 min-h-[150px] resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowKnowledgeInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowKnowledgeInput(false);
                                        handleEmbedDocument(knowledgeText, knowledgeTitle || "User Note");
                                    }}
                                    disabled={!knowledgeText.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Embed Document
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* URL Input Modal */}
            <AnimatePresence>
                {showUrlInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowUrlInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <LinkIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">URL to Text</h3>
                                    <p className="text-xs text-zinc-500">Paste any webpage URL</p>
                                </div>
                            </div>
                            <input
                                type="url"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                placeholder="https://example.com/article"
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowUrlInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUrlSubmit}
                                    disabled={!urlInput.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Fetch Content
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center Content Group */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center w-full z-10"
            >

                {/* 3D Orb Visual */}
                {/* 3D Orb Visual */}
                {/* Upgrade Pill */}
                <button
                    onClick={() => !isSubscribed && setShowSubscriptionPopup(true)}
                    className={cn(
                        "mb-8 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm transition-all shadow-sm active:scale-95 group",
                        isSubscribed
                            ? "bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 text-teal-700 cursor-default"
                            : "bg-zinc-50 hover:bg-white border border-zinc-200/60 hover:border-orange-200 hover:shadow-orange-500/10 cursor-pointer"
                    )}
                >
                    {isSubscribed ? (
                        <>
                            <Sparkles size={16} className="text-teal-500" />
                            <span className="font-bold">Pro Plan Active</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} className="text-orange-500 group-hover:animate-pulse" />
                            <span className="font-bold text-orange-500">Upgrade</span>
                            <span className="font-semibold text-zinc-600 group-hover:text-zinc-900">free plan to full access</span>
                        </>
                    )}
                </button>

                {/* Soft Limit Warning */}
                {softLimitReached && (
                    <div className="mb-6 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2 text-yellow-600 text-sm font-medium animate-pulse shadow-sm backdrop-blur-sm">
                        <AlertTriangle size={14} />
                        <span>⚡ {credits} Credits remaining for today. Reset at 00:00.</span>
                    </div>
                )}

                {/* Greeting & Title */}
                <h1 className="text-center mb-10 space-y-1">
                    <span className="block text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                        {getGreeting()}{userName ? `, ${userName}` : ''}
                    </span>
                    <span className="block text-3xl md:text-4xl font-semibold text-zinc-400 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                        What's on your mind?
                    </span>
                </h1>

                {/* Main Input Card */}
                <div className={cn(
                    "w-full max-w-3xl bg-white dark:bg-black/40 dark:border-white/10 dark:backdrop-blur-md rounded-2xl border transition-all duration-300 relative",
                    isFocused
                        ? "shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] border-lime-500"
                        : "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] border-zinc-200"
                )}>
                    {/* Deep Dive Indicator */}
                    <AnimatePresence mode="wait">
                        {isWebSearchEnabled && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="bg-[#1A1A1A] text-white border-b border-white/5 rounded-t-2xl"
                            >
                                <div className="px-4 py-2 flex items-center justify-between text-xs font-medium">
                                    <div className="flex items-center gap-2 text-cyan-400">
                                        <Globe size={12} />
                                        <span>Connected Sources Active</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded bg-white/10">Tavily</span>
                                        <span className="px-1.5 py-0.5 rounded bg-white/10">Google</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="px-4 pt-3 flex flex-wrap gap-2">
                            {attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-sm">
                                    {att.type === 'youtube' && <Youtube size={14} className="text-red-500" />}
                                    {att.type === 'audio' && <Mic size={14} className="text-purple-500" />}
                                    {att.type === 'url' && <LinkIcon size={14} className="text-blue-500" />}
                                    {att.type === 'file' && <FileText size={14} className="text-zinc-500" />}
                                    <span className="text-zinc-700 font-medium truncate max-w-[150px]">{att.name}</span>
                                    <button onClick={() => removeAttachment(i)} className="text-zinc-400 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Text Area */}
                    <div className="p-4">
                        <textarea
                            value={query}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={attachments.length > 0 ? "Ask about the attached content..." : "Ask AI a question or make a request..."}
                            className="w-full bg-transparent border-none text-lg text-zinc-800 dark:text-zinc-100 placeholder-zinc-400/80 focus:outline-none resize-none min-h-[40px] max-h-[200px] font-medium"
                            style={{ padding: '0 0 10px 0' }}
                        />
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="w-full flex items-center justify-between px-3 pb-3">
                        {/* Left Actions: Deeper Research, Image, Idea */}
                        <div className="flex items-center gap-2">
                            {/* Deeper Research Pill */}
                            <button
                                onClick={() => setWithReasoning(!withReasoning)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                                    withReasoning
                                        ? "bg-orange-50 text-orange-600 border-orange-200 ring-1 ring-orange-200"
                                        : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                                )}
                            >
                                <Atom size={14} className={cn(withReasoning ? "animate-spin-slow" : "")} />
                                Deeper Research
                            </button>

                            {/* Image Gen Trigger */}
                            <button onClick={() => setShowImageGenInput(true)} className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 rounded-lg transition-colors border border-transparent hover:border-zinc-200" title="Generate Image">
                                <ImageIcon size={18} strokeWidth={1.5} />
                            </button>

                            {/* Ideas / Surprise Me */}
                            <button onClick={() => setQuery(examples[Math.floor(Math.random() * examples.length)].query)} className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 rounded-lg transition-colors border border-transparent hover:border-zinc-200" title="Generate Idea">
                                <Lightbulb size={18} strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Right Actions: Cpu, Globe, Attach, Voice, Send */}
                        <div className="flex items-center gap-2">
                            {/* Model / Cpu */}
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                                disabled={isProcessing}
                                withReasoning={withReasoning}
                                onReasoningToggle={() => setWithReasoning(!withReasoning)}
                                isSubscribed={isSubscribed}
                            >
                                <button className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors" title="Select Model">
                                    <Cpu size={20} strokeWidth={1.5} />
                                </button>
                            </ModelSelector>

                            {/* Globe / Web */}
                            <button
                                onClick={() => onToggleWebSearch && onToggleWebSearch(!isWebSearchEnabled)}
                                className={cn(
                                    "p-2 text-zinc-400 hover:text-zinc-600 transition-colors",
                                    isWebSearchEnabled && "text-blue-600"
                                )}
                                title="Web Search"
                            >
                                <Globe size={20} strokeWidth={1.5} />
                            </button>

                            {/* Attach */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-zinc-400 hover:text-zinc-600 transition-all"
                                title="Attach file"
                            >
                                <Paperclip size={20} strokeWidth={1.5} />
                            </button>

                            {/* Mic / Voice */}
                            <button
                                onClick={() => audioInputRef.current?.click()}
                                className="p-2 text-zinc-400 hover:text-zinc-600 transition-all hidden sm:flex"
                                title="Voice to Text"
                            >
                                <AudioLines size={20} strokeWidth={1.5} />
                            </button>

                            {/* Send Button */}
                            <button
                                onClick={() => {
                                    if (query.trim() || attachments.length > 0) {
                                        if (isImageRequest(query)) {
                                            handleImageGeneration(query);
                                        } else {
                                            onSearch(query, attachments, selectedModel, withReasoning);
                                        }
                                    }
                                }}
                                disabled={(!query.trim() && attachments.length === 0) || isProcessing}
                                className={cn(
                                    "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ml-1 shadow-lg",
                                    (!query.trim() && attachments.length === 0) || isProcessing
                                        ? "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
                                        : "bg-lime-500 hover:bg-lime-600 text-white shadow-lime-200 transform hover:scale-105"
                                )}
                            >
                                <ArrowUp size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Example Cards */}
                <div className="w-full max-w-4xl mt-12">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 px-1 text-center md:text-left">
                        Get started with an example below
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {examples.map((ex, i) => (
                            <button
                                key={i}
                                onClick={() => onSearch(ex.query)}
                                className="text-left p-4 rounded-xl bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 transition-all duration-300 group h-full flex flex-col justify-between gap-4"
                            >
                                <span className="text-sm text-zinc-600 font-medium group-hover:text-zinc-900 transition-colors">
                                    {ex.label}
                                </span>
                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400">
                                    {ex.icon}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </motion.div>


            {/* Loading Overlay removed - using the one at line ~447 with improved audio waveform animation */}

            {/* Subscription Popup */}
            <SubscriptionPopup
                isOpen={showSubscriptionPopup}
                onClose={() => setShowSubscriptionPopup(false)}
                tokensUsed={featureUsage.convert.used}
                tokensLimit={featureUsage.convert.limit}
            />
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, ArrowUp, Link as LinkIcon, Layers, Plus, Paperclip, ChevronDown, Check, Sparkles, LayoutGrid, Mic, Youtube, FileText, X, Loader2, Wrench, AlertTriangle, Image as ImageIcon, PenTool, Code, LineChart, Hammer, GraduationCap, AudioLines, Lightbulb, ChevronRight } from 'lucide-react';
import ModelSelector, { ModelType } from './ui/ModelSelector';
import { cn, getApiUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import SubscriptionPopup from './SubscriptionPopup';
import VoiceDictationModal from './chat/VoiceDictationModal';

interface ResearchWelcomeProps {
    onSearch: (query: string, attachments?: AttachmentData[], model?: ModelType, reasoning?: boolean, featureType?: string) => void;
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
    
    // Sync query if initialQuery changes (e.g., from localStorage after mount)
    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    const [isFocused, setIsFocused] = useState(false);
    const [attachments, setAttachments] = useState<AttachmentData[]>([]);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showAIToolsMenu, setShowAIToolsMenu] = useState(false);
    const [showYouTubeInput, setShowYouTubeInput] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [previewData, setPreviewData] = useState<{ title: string; content: string; type: 'file' | 'audio' | 'youtube' | 'url'; mimeType?: string } | null>(null);
    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
    const [showDictation, setShowDictation] = useState(false);


    // Model Selector State
    const [selectedModel, setSelectedModel] = useState<ModelType>('sonar');
    const [withReasoning, setWithReasoning] = useState(true);

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

    // Feature Prompt Modal State
    const [selectedFeature, setSelectedFeature] = useState<{ label: string; icon: React.ReactNode; query: string; options?: {title: string; prompt: string}[] } | null>(null);
    const [featurePrompt, setFeaturePrompt] = useState('');

    const [greeting, setGreeting] = useState("What shall we think through?");

    useEffect(() => {
        const phrases = [
            "What shall we think through?",
            "How can I help you today?",
            "What's on your mind?",
            "Let's explore something new.",
            "Ready to brainstorm?",
            "What are we working on?",
            "Let's build something great."
        ];
        setGreeting(phrases[Math.floor(Math.random() * phrases.length)]);
    }, []);

    const handleFeatureSelect = (feature: any) => {
        setSelectedFeature(feature);
        setFeaturePrompt('');
    };

    const handleFeatureSubmit = () => {
        if (!selectedFeature || !featurePrompt.trim()) return;

        // Construct the full query based on the feature template
        const fullQuery = `${selectedFeature.query} ${featurePrompt}`;

        // Close modal
        setSelectedFeature(null);

        // Send to streaming flow
        onSearch(fullQuery, [], undefined, undefined, selectedFeature.label);
    };

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

    // Handle image generation via SumoPod gpt-image-1
    const handleImageGeneration = async (prompt: string) => {
        setIsProcessing(true);
        setProcessingMessage('Generating image with AI...');

        try {
            const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
            if (!apiKey) throw new Error('SumoPod API Key not configured');

            const response = await fetch('https://api.sumopod.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-image-1',
                    prompt,
                    n: 1,
                    size: '1024x1024',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;
                if (imageUrl) {
                    navigate('/chat/new', {
                        state: {
                            initialPrompt: prompt,
                            generatedImage: imageUrl.startsWith('http') ? imageUrl : `data:image/png;base64,${imageUrl}`
                        }
                    });
                    incrementFeatureUsage('convert');
                } else {
                    alert('No image was generated. Please try again.');
                }
            } else {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                alert(error.error?.message || error.error || 'Failed to generate image');
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
                    // Read PDF as base64 and send to SumoPod for text extraction
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
                    if (!apiKey) throw new Error('SumoPod API Key not configured');

                    const response = await fetch('https://api.sumopod.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: 'gpt-5-mini',
                            messages: [{
                                role: 'user',
                                content: [
                                    { type: 'file', file: { filename: file.name, file_data: `data:application/pdf;base64,${base64}` } },
                                    { type: 'text', text: 'Extract all readable text content from this PDF document. Return only the extracted text, maintaining the original structure and formatting as much as possible.' }
                                ]
                            }],
                            max_tokens: 4096,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const extractedText = data.choices?.[0]?.message?.content || 'PDF content extracted';
                        setPreviewData({
                            type: 'file',
                            title: file.name,
                            content: extractedText,
                            mimeType: 'application/pdf'
                        });
                        incrementFeatureUsage('convert');
                    } else {
                        const errData = await response.json().catch(() => ({}));
                        alert(`PDF extraction failed: ${errData.error?.message || 'Unknown error'}`);
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

    // Audio Upload Handler — SumoPod whisper-1
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!checkConvertLimit()) return;

        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setProcessingMessage('Transcribing audio with Whisper...');

        try {
            const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
            if (!apiKey) throw new Error('SumoPod API Key not configured');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.sumopod.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setPreviewData({
                    type: 'audio',
                    title: file.name,
                    content: data.text || 'Audio transcribed',
                });
                incrementFeatureUsage('convert');
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`Transcription failed: ${errData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Audio transcription error:', error);
            alert('Audio transcription failed. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
            if (audioInputRef.current) audioInputRef.current.value = '';
        }
    };

    // YouTube Transcript Handler — SumoPod gpt-5-mini
    const handleYouTubeSubmit = async () => {
        if (!checkConvertLimit()) return;
        if (!youtubeUrl.trim()) return;

        setIsProcessing(true);
        setProcessingMessage('Analyzing YouTube video...');

        try {
            const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
            if (!apiKey) throw new Error('SumoPod API Key not configured');

            const response = await fetch('https://api.sumopod.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-5-mini',
                    messages: [{
                        role: 'user',
                        content: `Please analyze and summarize this YouTube video. Provide key points and a detailed transcript/summary of the content: ${youtubeUrl}`
                    }],
                    max_tokens: 4096,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const summary = data.choices?.[0]?.message?.content || 'Could not analyze video';
                setPreviewData({
                    type: 'youtube',
                    title: `YouTube: ${youtubeUrl}`,
                    content: summary,
                });
                setYoutubeUrl('');
                setShowYouTubeInput(false);
                incrementFeatureUsage('convert');
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`YouTube analysis failed: ${errData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('YouTube analysis error:', error);
            alert('Failed to analyze YouTube video. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    // URL Content Handler — SumoPod gpt-5-mini
    const handleUrlSubmit = async () => {
        if (!checkConvertLimit()) return;
        if (!urlInput.trim()) return;

        setIsProcessing(true);
        setProcessingMessage('Analyzing webpage content...');

        try {
            const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
            if (!apiKey) throw new Error('SumoPod API Key not configured');

            const response = await fetch('https://api.sumopod.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-5-mini',
                    messages: [{
                        role: 'user',
                        content: `Please fetch, read, and extract the main text content from this webpage URL. Provide a clean, well-formatted version of the page content: ${urlInput}`
                    }],
                    max_tokens: 4096,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || 'Could not extract content';
                setPreviewData({
                    type: 'url',
                    title: urlInput,
                    content,
                });
                setUrlInput('');
                setShowUrlInput(false);
                incrementFeatureUsage('convert');
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`URL analysis failed: ${errData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('URL fetch error:', error);
            alert('Failed to analyze webpage. Please try again.');
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

    // Attach tools (+ dropdown)
    const attachTools = [
        { icon: <Sparkles size={14} />, label: 'Generate PDF', description: 'Type a PDF request', action: () => { setQuery('Buatkan PDF dokumen: '); } },
        { icon: <ImageIcon size={14} />, label: 'Upload Image', description: 'Attach images', action: () => fileInputRef.current?.click() },
        { icon: <FileText size={14} />, label: 'Upload Document', description: 'PDF, TXT, MD, DOCX', action: () => fileInputRef.current?.click() },
        { icon: <Globe size={14} />, label: 'Web Search', description: 'Search the web', action: () => onToggleWebSearch && onToggleWebSearch(!isWebSearchEnabled) },
        { icon: <Mic size={14} />, label: 'Voice Dictation', description: 'Speak to type', action: () => setShowDictation(true) },
    ];

    // AI Conversion tools (Wrench dropdown)
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
            icon: <ImageIcon size={14} />, label: 'Generate Image', description: 'AI Image (5 Credits)', action: () => {
                if (!checkConvertLimit()) return;
                const prompt = window.prompt('Describe the image you want to generate:');
                if (prompt && prompt.trim()) {
                    handleImageGeneration(prompt.trim());
                }
            }
        },
    ];

    const suggestions = [
        { 
            icon: <Search size={16} className="text-stone-400" />, 
            label: "Research", 
            query: "Can you research about ",
            options: [
                { title: "Explore latest AI trends", prompt: "Can you research and summarize the latest trends in Artificial Intelligence?" },
                { title: "Understand a new concept", prompt: "Help me understand the basics and key concepts of [Topic]: " },
                { title: "Compare technologies", prompt: "Can you compare the pros and cons of [Option A] and [Option B]?" },
                { title: "Market research", prompt: "Provide a market research overview for [Industry/Product]: " }
            ]
        },
        { 
            icon: <FileText size={16} className="text-stone-400" />, 
            label: "Summarize", 
            query: "Please summarize ",
            options: [
                { title: "Summarize an article", prompt: "Can you summarize the following article, highlighting the main points? " },
                { title: "Extract action items", prompt: "Please extract the key action items from this text: " },
                { title: "Explain like I'm 5", prompt: "Summarize this complex topic as if you were explaining it to a 5-year-old: " },
                { title: "Executive summary", prompt: "Create a brief executive summary for the following document: " }
            ]
        },
        { 
            icon: <Lightbulb size={16} className="text-stone-400" />, 
            label: "Brainstorm", 
            query: "Help me brainstorm ideas for ",
            options: [
                { title: "Startup ideas", prompt: "Brainstorm 5 innovative startup ideas in the field of " },
                { title: "Content creation", prompt: "Give me 10 engaging blog post topics about " },
                { title: "Problem solving", prompt: "I'm facing this problem: [describe]. Can you brainstorm potential creative solutions?" },
                { title: "Marketing campaign", prompt: "Brainstorm a creative marketing campaign for " }
            ]
        },
        { 
            icon: <Globe size={16} className="text-stone-400" />, 
            label: "Translate", 
            query: "Translate this text into ",
            options: [
                { title: "Translate to English", prompt: "Translate the following text to professional English: " },
                { title: "Translate to Indonesian", prompt: "Tolong terjemahkan teks berikut ke dalam bahasa Indonesia yang natural: " },
                { title: "Translate to Japanese", prompt: "Translate the following text to Japanese (formal): " },
                { title: "Improve translation", prompt: "Please review and improve this translation to sound more native: " }
            ]
        },
        { 
            icon: <LineChart size={16} className="text-stone-400" />, 
            label: "Analyze", 
            query: "Can you analyze ",
            options: [
                { title: "Analyze text sentiment", prompt: "Analyze the tone and sentiment of the following text: " },
                { title: "Code review", prompt: "Can you analyze this code snippet and suggest improvements or highlight bugs? " },
                { title: "Business strategy", prompt: "Analyze the potential risks and benefits of this strategic decision: " },
                { title: "Data interpretation", prompt: "Help me interpret this data and identify key trends: " }
            ]
        }
    ];

    return (
        <div className={cn(
            "w-full min-h-full flex flex-col items-center justify-center p-4 md:p-6 relative max-w-3xl mx-auto",
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

            {/* Feature Prompt Modal Removed - Replaced with Inline Dropdown */}

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center w-full z-10 font-sans"
            >
                {/* Upgrade Pill */}
                <div className="mb-12 flex justify-center">
                    {!isSubscribed ? (
                        <button 
                            onClick={() => setShowSubscriptionPopup(true)}
                            className="text-xs font-medium text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-full transition-colors"
                        >
                            Free plan · <span className="text-stone-700">Upgrade</span>
                        </button>
                    ) : (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            Pro Plan Active
                        </span>
                    )}
                </div>

                {/* Soft Limit Warning */}
                {softLimitReached && (
                    <div className="mb-6 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2 text-yellow-600 text-sm font-medium animate-pulse shadow-sm backdrop-blur-sm">
                        <AlertTriangle size={14} />
                        <span>⚡ {credits} Credits remaining for today. Reset at 00:00.</span>
                    </div>
                )}

                {/* Greeting & Title */}
                <h1 className="flex items-center text-center gap-3 text-4xl md:text-[44px] text-stone-800 tracking-tight font-serif mb-8 md:mb-12" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    <span>{userName ? `${greeting.replace('?', `, ${userName}?`).replace('.', `, ${userName}.`)}` : greeting}</span>
                </h1>

                {/* Main Input Card — Clean Layout */}
                <div className={cn(
                    "w-full max-w-3xl bg-white rounded-2xl border transition-all duration-200 relative",
                    isFocused
                        ? "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border-stone-300"
                        : "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border-stone-200"
                )}>
                    {/* Web Search Indicator */}
                    <AnimatePresence mode="wait">
                        {isWebSearchEnabled && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pt-2"
                            >
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md text-xs font-medium">
                                    <Globe size={12} />
                                    Web Search On
                                    <button onClick={() => onToggleWebSearch && onToggleWebSearch(false)} className="ml-1 hover:text-stone-800">
                                        <X size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="px-4 pt-4 flex flex-wrap gap-2">
                            {attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-sm">
                                    {att.type === 'youtube' && <Youtube size={14} className="text-stone-500" />}
                                    {att.type === 'audio' && <Mic size={14} className="text-stone-500" />}
                                    {att.type === 'url' && <LinkIcon size={14} className="text-stone-500" />}
                                    {att.type === 'file' && <FileText size={14} className="text-stone-500" />}
                                    <span className="text-stone-700 font-medium truncate max-w-[150px]">{att.name}</span>
                                    <button onClick={() => removeAttachment(i)} className="text-stone-400 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Text Area */}
                    <div className="p-4 pt-4 pb-2">
                        <textarea
                            value={query}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="How can I help you today?"
                            className="w-full bg-transparent border-none text-[15px] text-stone-800 placeholder-stone-400 focus:outline-none resize-none min-h-[36px] max-h-[400px] leading-relaxed font-normal"
                            style={{ height: '36px' }}
                        />
                    </div>

                    {/* Bottom Bar — Clean Layout */}
                    <div className="w-full flex items-center justify-between px-3 pb-3">
                        {/* Left: + Button */}
                        <div className="flex items-center gap-1 relative">
                            {/* + Attach Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowToolsMenu(!showToolsMenu); setShowAIToolsMenu(false); }}
                                    className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                                        showToolsMenu
                                            ? "bg-stone-200 text-stone-700"
                                            : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                                    )}
                                    title="Attach files"
                                >
                                    <Plus size={20} strokeWidth={2} />
                                </button>
                                {showToolsMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-52 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden z-50">
                                        {attachTools.map((tool, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { tool.action(); setShowToolsMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                                            >
                                                <span className="text-stone-500">{tool.icon}</span>
                                                <div className="text-left">
                                                    <div className="font-medium">{tool.label}</div>
                                                    <div className="text-[10px] text-stone-400">{tool.description}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Optional: AI Tools */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowAIToolsMenu(!showAIToolsMenu); setShowToolsMenu(false); }}
                                    className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                                        showAIToolsMenu
                                            ? "bg-stone-200 text-stone-700"
                                            : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                                    )}
                                    title="AI Tools"
                                >
                                    <Wrench size={16} strokeWidth={1.8} />
                                </button>
                                {showAIToolsMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden z-50">
                                        <div className="px-4 py-2 border-b border-stone-100">
                                            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">AI Tools</span>
                                        </div>
                                        {tools.map((tool, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { tool.action(); setShowAIToolsMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                                            >
                                                <span className="text-stone-500">{tool.icon}</span>
                                                <div className="text-left">
                                                    <div className="font-medium">{tool.label}</div>
                                                    <div className="text-[10px] text-stone-400">{tool.description}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Model Name, Voice, Send */}
                        <div className="flex items-center gap-1.5">
                            {/* Model Name Label */}
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                                disabled={isProcessing}
                                withReasoning={withReasoning}
                                onReasoningToggle={() => setWithReasoning(!withReasoning)}
                                isSubscribed={isSubscribed}
                            >
                                <button className="flex items-center gap-1.5 px-2 py-1.5 text-stone-500 hover:text-stone-800 transition-colors text-xs font-semibold">
                                    <span>
                                        {(() => {
                                            const names: Record<string, string> = {
                                                'claude-sonnet': 'Sonnet 4.6',
                                                'claude-opus': 'Opus 4.1',
                                                'sonar': 'NoirSync',
                                            };
                                            return names[selectedModel] || selectedModel;
                                        })()}
                                    </span>
                                    <ChevronDown size={12} strokeWidth={2.5} />
                                </button>
                            </ModelSelector>

                            {/* Voice Button */}
                            <button
                                onClick={() => setShowDictation(true)}
                                className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-lg transition-colors hover:bg-stone-100"
                                title="Voice Input"
                            >
                                <Mic size={16} strokeWidth={2} />
                            </button>

                            {/* Send Button - Only visible when typing or attachments added */}
                            <AnimatePresence>
                                {(query.trim() || attachments.length > 0) && (
                                    <motion.button
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        onClick={() => {
                                            if (isImageRequest(query)) handleImageGeneration(query);
                                            else onSearch(query, attachments, selectedModel, withReasoning);
                                        }}
                                        disabled={isProcessing}
                                        className={cn(
                                            "w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                            isProcessing
                                                ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                                                : "bg-[#E5694A] hover:bg-[#D55839] text-white"
                                        )}
                                    >
                                        <ArrowUp size={16} strokeWidth={2.5} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Suggestions Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-3xl">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setSelectedFeature(selectedFeature?.label === suggestion.label ? null : suggestion as any);
                                setFeaturePrompt('');
                            }}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[13px] font-medium transition-colors shadow-sm",
                                selectedFeature?.label === suggestion.label
                                    ? "bg-stone-100 border-stone-300 text-stone-800" 
                                    : "bg-white border-stone-200 hover:bg-stone-50 text-stone-600"
                            )}
                        >
                            {suggestion.icon}
                            {suggestion.label}
                        </button>
                    ))}
                </div>

                {/* Feature Options Dropdown */}
                <AnimatePresence>
                    {selectedFeature && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-3xl mt-3 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                                <div className="flex items-center gap-2 text-stone-700 text-sm font-medium">
                                    {selectedFeature.icon}
                                    {selectedFeature.label}
                                </div>
                                <button onClick={() => setSelectedFeature(null)} className="text-stone-400 hover:text-stone-600 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex flex-col">
                                {selectedFeature.options?.map((opt: any, i: number) => (
                                    <button 
                                        key={i}
                                        onClick={() => {
                                            setQuery(opt.prompt);
                                            setSelectedFeature(null);
                                        }}
                                        className="text-left px-4 py-3 text-[14px] text-stone-600 hover:bg-stone-50 border-b border-stone-100 last:border-0 flex items-center justify-between group transition-colors"
                                    >
                                        <span>{opt.title}</span>
                                        <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>


            {/* Loading Overlay removed - using the one at line ~447 with improved audio waveform animation */}

            {/* Subscription Popup */}
            <SubscriptionPopup
                isOpen={showSubscriptionPopup}
                onClose={() => setShowSubscriptionPopup(false)}
                tokensUsed={featureUsage.convert.used}
                tokensLimit={featureUsage.convert.limit}
            />

            <VoiceDictationModal
                isOpen={showDictation}
                onClose={() => setShowDictation(false)}
                onInsert={(text) => {
                    setQuery((prev) => prev ? prev + ' ' + text : text);
                }}
            />


        </div>
    );
}

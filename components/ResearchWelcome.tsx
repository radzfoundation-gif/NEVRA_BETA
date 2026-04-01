import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowUp, Link as LinkIcon, Layers, Plus, Paperclip, ChevronDown, Check, Sparkles, LayoutGrid, Mic, Youtube, FileText, X, Loader2, Wrench, AlertTriangle, Image as ImageIcon, PenTool, Code, LineChart, Hammer, GraduationCap, AudioLines, Lightbulb, ChevronRight, Target, BookOpen, PenLine, CircleDashed, Brain, Search, Palette, Folder, Github, Plug, SquareTerminal, Wand2, Camera } from 'lucide-react';
import ModelSelector, { ModelType } from './ui/ModelSelector';
import { cn, getApiUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AlertModal from './ui/AlertModal';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import SubscriptionPopup from './SubscriptionPopup';
import VoiceDictationModal from './chat/VoiceDictationModal';
import { useUser } from '@/lib/authContext';
import { getSkills } from '@/lib/skillsApi';

const TOOL_GROUPS = [
    [
        { id: 'upload_file', label: 'Add files or photos', icon: Paperclip },
        { id: 'camera', label: 'Take a screenshot', icon: Camera },
        { id: 'project', label: 'Add to project', icon: Folder, hasChevron: true },
        { id: 'github', label: 'Add from GitHub', icon: Github },
    ],
    [
        { id: 'skills', label: 'Skills', icon: SquareTerminal, hasChevron: true },
        { id: 'connectors', label: 'Add connectors', icon: Plug },
    ],
    [
        { id: 'web', label: 'Web search', icon: Globe },
        { id: 'styles', label: 'Use style', icon: Wand2 },
    ]
];

const WRITING_STYLES = [
    { id: 'normal', label: 'Normal', prompt: '' },
    { id: 'learning', label: 'Learning', prompt: 'Explain in a clear, educational way with examples.' },
    { id: 'concise', label: 'Concise', prompt: 'Be brief and to the point. No fluff.' },
    { id: 'explanatory', label: 'Explanatory', prompt: 'Explain thoroughly with context and reasoning.' },
    { id: 'formal', label: 'Formal', prompt: 'Use formal, professional language.' },
];


// Custom Shark Icon for Deep Research
const SharkIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M2 12c0 0 5-3 8-3s5 2 7 2 4-2 7-2c0 0-2 6-7 6s-5-2-7-2-4 1-6 1c0 0 2-2 5-2" />
        <path d="M11 9c0 0 0-5 3-7 0 0 0 5-3 7" />
    </svg>
);

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
    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
    const [showDictation, setShowDictation] = useState(false);

    const { user } = useUser();
    const [showStyleSubmenu, setShowStyleSubmenu] = useState(false);
    const [showSkillSubmenu, setShowSkillSubmenu] = useState(false);
    const [userSkills, setUserSkills] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
    const [activeStyle, setActiveStyle] = useState<string | null>(null);
    const toolsMenuRef = useRef<HTMLDivElement>(null);

    // Load skills from Supabase
    useEffect(() => {
        if (!user?.id) return;
        getSkills(user.id)
            .then(data => setUserSkills(data.map(s => ({ id: s.id, name: s.name, enabled: s.enabled }))))
            .catch(() => { });
    }, [user?.id]);

    // Close tools menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setShowToolsMenu(false);
                setShowStyleSubmenu(false);
                setShowSkillSubmenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle tool selection from + dropdown
    const handleToolSelect = (toolId: string) => {
        if (navigator.vibrate) navigator.vibrate(50);

        switch (toolId) {
            case 'upload_file':
                setShowToolsMenu(false);
                fileInputRef.current?.click();
                break;
            case 'camera':
                setShowToolsMenu(false);
                setAlertConfig({
                    isOpen: true,
                    title: 'Screenshots',
                    message: 'Fitur tangkapan layar langsung akan segera hadir di Noir!',
                    type: 'development'
                });
                break;
            case 'project':
                setShowToolsMenu(false);
                setAlertConfig({
                    isOpen: true,
                    title: 'Projects',
                    message: 'Noir Workspace akan segera hadir! Nantikan fitur kolaborasi proyek yang lebih canggih.',
                    type: 'development'
                });
                break;
            case 'github':
                setShowToolsMenu(false);
                setAlertConfig({
                    isOpen: true,
                    title: 'GitHub Integration',
                    message: 'Hubungkan repositori GitHub Anda langsung ke Noir untuk analisis kode yang lebih mendalam.',
                    type: 'development'
                });
                break;
            case 'connectors':
                setShowToolsMenu(false);
                setAlertConfig({
                    isOpen: true,
                    title: 'Connectors',
                    message: 'Hubungkan Noir dengan aplikasi favorit Anda untuk sinkronisasi data real-time.',
                    type: 'development'
                });
                break;
            case 'skills':
                setShowSkillSubmenu(prev => !prev);
                setShowStyleSubmenu(false);
                break;
            case 'styles':
                setShowStyleSubmenu(prev => !prev);
                setShowSkillSubmenu(false);
                break;
            case 'web':
                setShowToolsMenu(false);
                onToggleWebSearch && onToggleWebSearch(!isWebSearchEnabled);
                break;
        }
    };

    const handleSelectStyle = (styleId: string) => {
        const style = WRITING_STYLES.find(s => s.id === styleId);
        if (!style) return;
        setActiveStyle(styleId === 'normal' ? null : styleId);
        setShowStyleSubmenu(false);
        setShowToolsMenu(false);
    };


    // Model Selector State
    const [selectedModel, setSelectedModel] = useState<ModelType>('sonnet');
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

    // Process transcription directly with AI and send to ChatInterface
    const processWithAI = () => {
        // This function is no longer used since we directly add attachments
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
    const [selectedFeature, setSelectedFeature] = useState<{ label: string; icon: React.ReactNode; query: string; options?: { title: string; prompt: string }[] } | null>(null);
    const [featurePrompt, setFeaturePrompt] = useState('');

    const [greeting, setGreeting] = useState("What shall we think through?");

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'info' | 'development' | 'upgrade';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'development'
    });

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
                    setAlertConfig({
                        isOpen: true,
                        title: 'Image Generation',
                        message: 'Maaf, tidak ada gambar yang dihasilkan. Sila coba lagi dengan prompt yang berbeda.',
                        type: 'info'
                    });
                }
            } else {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                setAlertConfig({
                    isOpen: true,
                    title: 'Generation Failed',
                    message: error.error?.message || error.error || 'Gagal menghasilkan gambar. Sila periksa koneksi atau kredit Anda.',
                    type: 'info'
                });
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
                            model: 'seed-2-0-pro-free',
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
                        setAttachments(prev => [...prev, {
                            type: 'file',
                            name: file.name,
                            content: extractedText,
                            mimeType: 'application/pdf'
                        }]);
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
                    setAttachments(prev => [...prev, {
                        type: 'file',
                        name: file.name,
                        content: text,
                        mimeType: file.type
                    }]);
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
                setAttachments(prev => [...prev, {
                    type: 'audio',
                    name: file.name,
                    content: data.text || 'Audio transcribed',
                }]);
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

    // YouTube Transcript Handler — SumoPod seed-2-0-pro-free
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
                    model: 'seed-2-0-pro-free',
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
                setAttachments(prev => [...prev, {
                    type: 'youtube',
                    name: `YouTube: ${youtubeUrl}`,
                    content: summary,
                }]);
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

    // URL Content Handler — SumoPod seed-2-0-pro-free
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
                    model: 'seed-2-0-pro-free',
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
                setAttachments(prev => [...prev, {
                    type: 'url',
                    name: urlInput,
                    content,
                }]);
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
                setAlertConfig({
                    isOpen: true,
                    title: 'Knowledge Success',
                    message: `Berhasil menambahkan ${data.chunksProcessed} bagian informasi ke dalam basis pengetahuan Anda.`,
                    type: 'info'
                });
            } else {
                setAlertConfig({
                    isOpen: true,
                    title: 'Upload Failed',
                    message: 'Gagal mengupload dokumen: ' + data.error,
                    type: 'info'
                });
            }
        } catch (e) {
            console.error(e);
            alert('Error embedding document');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    // Suggestions
    const suggestions = [
        {
            icon: <SharkIcon size={16} className={cn("transition-colors", withReasoning ? "text-purple-500" : "text-stone-400")} />,
            label: "Research",
            query: "Can you deep research about ",
            action: () => setWithReasoning(true),
            options: [
                { title: "In-depth technology analysis", prompt: "Conduct an in-depth research and analysis of [Technology]: " },
                { title: "Market competitive landscape", prompt: "Research the current competitive landscape for [Industry]: " },
                { title: "Scientific breakthrough review", prompt: "Find and analyze recent scientific breakthroughs in [Field]: " },
                { title: "Comprehensive case study", prompt: "Perform a comprehensive research-based case study on [Topic]: " }
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
            "w-full min-h-full flex flex-col items-center justify-center px-3 py-4 pt-10 md:p-6 md:pt-16 relative max-w-3xl mx-auto",
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
                <div className="mb-6 md:mb-12 flex justify-center">
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
                <h1 className="flex items-center text-center gap-3 text-2xl md:text-[44px] text-stone-800 tracking-tight font-serif mb-5 md:mb-12" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    <span>{userName ? `${greeting.replace('?', `, ${userName}?`).replace('.', `, ${userName}.`)}` : greeting}</span>
                </h1>

                {/* Main Input Card — Clean Layout */}
                <div className={cn(
                    "w-full max-w-3xl bg-white rounded-2xl border transition-all duration-200 relative",
                    isFocused
                        ? "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border-stone-300"
                        : "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border-stone-200"
                )}>
                    {/* Web Search & Deep Research Indicators */}
                    <AnimatePresence mode="wait">
                        <div className="flex flex-wrap items-center gap-2 px-4 pt-2">
                            {isWebSearchEnabled && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
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

                            {withReasoning && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 border border-purple-100/50 rounded-md text-xs font-medium">
                                        <SharkIcon size={12} />
                                        Deep Research On
                                        <button onClick={() => setWithReasoning(false)} className="ml-1 hover:text-purple-800">
                                            <X size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {activeStyle && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <button
                                        onClick={() => setActiveStyle(null)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 border border-orange-100/50 rounded-md text-xs font-medium hover:bg-orange-100 transition-colors"
                                    >
                                        <Wand2 size={12} />
                                        Style: {WRITING_STYLES.find(s => s.id === activeStyle)?.label}
                                        <X size={12} className="ml-1" />
                                    </button>
                                </motion.div>
                            )}
                        </div>
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
                                    <span className="text-stone-700 font-medium truncate max-w-[100px] sm:max-w-[150px]">{att.name}</span>
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
                        {/* Left: + Button with Dropdown */}
                        <div className="flex items-center gap-1 relative" ref={toolsMenuRef}>
                            <button
                                onClick={() => setShowToolsMenu(!showToolsMenu)}
                                className={cn(
                                    "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                                    showToolsMenu
                                        ? "bg-stone-200 text-stone-700"
                                        : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                                )}
                                title="Attach menu"
                            >
                                <Plus size={20} strokeWidth={1.8} />
                            </button>

                            {/* Tools Dropdown */}
                            {showToolsMenu && (
                                <div className="absolute bottom-full left-0 mb-2 flex items-end gap-1 z-50">
                                    {/* Main menu */}
                                    <div className="w-[85vw] max-w-[224px] sm:w-56 bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 py-1.5">
                                        {TOOL_GROUPS.map((group, groupIdx) => (
                                            <React.Fragment key={groupIdx}>
                                                <div className="flex flex-col">
                                                    {group.map((tool) => {
                                                        const Icon = tool.icon;
                                                        const isWebActive = tool.id === 'web' && isWebSearchEnabled;
                                                        const isStyleActive = tool.id === 'styles' && !!activeStyle;
                                                        const isActive = isWebActive || isStyleActive;
                                                        return (
                                                            <button
                                                                key={tool.id}
                                                                onClick={() => handleToolSelect(tool.id)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-colors mx-1.5 rounded-lg text-left",
                                                                    (tool.id === 'styles' && showStyleSubmenu) || (tool.id === 'skills' && showSkillSubmenu) ? "bg-stone-100" : "hover:bg-stone-50"
                                                                )}
                                                                style={{ width: 'calc(100% - 12px)' }}
                                                            >
                                                                <div className={cn("flex justify-center items-center w-5", isActive ? "text-blue-500" : "text-stone-700")}>
                                                                    <Icon size={16} strokeWidth={1.8} />
                                                                </div>
                                                                <span className={cn("flex-1", isActive ? "text-blue-600 font-medium" : "text-stone-700")}>{tool.label}</span>
                                                                {tool.id === 'styles' ? (
                                                                    <ChevronRight size={14} className={cn("text-stone-400 ml-auto transition-transform duration-150", showStyleSubmenu && "rotate-90")} strokeWidth={2} />
                                                                ) : tool.id === 'skills' ? (
                                                                    <ChevronRight size={14} className={cn("text-stone-400 ml-auto transition-transform duration-150", showSkillSubmenu && "rotate-90")} strokeWidth={2} />
                                                                ) : (tool as any).hasChevron ? (
                                                                    <ChevronRight size={14} className="text-stone-400 ml-auto" strokeWidth={2} />
                                                                ) : isWebActive ? (
                                                                    <Check size={16} className="text-blue-500 ml-auto" strokeWidth={2.5} />
                                                                ) : null}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {groupIdx < TOOL_GROUPS.length - 1 && (
                                                    <div className="h-px bg-stone-100 my-1.5 mx-3" />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* Skill submenu */}
                                    {showSkillSubmenu && (
                                        <div className="w-44 bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-left-1 duration-150 py-1.5">
                                            {userSkills.filter(s => s.enabled).length === 0 ? (
                                                <div className="px-3 py-3 text-[12px] text-stone-400 text-center">
                                                    Belum ada skill aktif
                                                </div>
                                            ) : (
                                                userSkills.filter(s => s.enabled).map(skill => (
                                                    <div key={skill.id} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] mx-1.5 rounded-lg" style={{ width: 'calc(100% - 12px)' }}>
                                                        <SquareTerminal size={14} className="text-stone-400 shrink-0" strokeWidth={1.8} />
                                                        <span className="text-stone-700 truncate">{skill.name}</span>
                                                    </div>
                                                ))
                                            )}
                                            <div className="h-px bg-stone-100 my-1.5 mx-3" />
                                            <button
                                                onClick={() => { setShowSkillSubmenu(false); setShowToolsMenu(false); navigate('/skills'); }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-stone-50 transition-colors mx-1.5 rounded-lg text-left"
                                                style={{ width: 'calc(100% - 12px)' }}
                                            >
                                                <Wrench size={14} className="text-stone-500 shrink-0" strokeWidth={1.8} />
                                                <span className="text-stone-700">Manage skills</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Style submenu */}
                                    {showStyleSubmenu && (
                                        <div className="w-44 bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-left-1 duration-150 py-1.5">
                                            {WRITING_STYLES.map((style) => {
                                                const isSelected = activeStyle === style.id || (!activeStyle && style.id === 'normal');
                                                return (
                                                    <button
                                                        key={style.id}
                                                        onClick={() => handleSelectStyle(style.id)}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-stone-50 transition-colors mx-1.5 rounded-lg text-left"
                                                        style={{ width: 'calc(100% - 12px)' }}
                                                    >
                                                        <Wand2 size={14} className={isSelected ? "text-blue-500" : "text-stone-400"} strokeWidth={1.8} />
                                                        <span className={cn("flex-1", isSelected ? "text-blue-600 font-medium" : "text-stone-700")}>{style.label}</span>
                                                        {isSelected && <Check size={13} className="text-blue-500 shrink-0" strokeWidth={2.5} />}
                                                    </button>
                                                );
                                            })}
                                            <div className="h-px bg-stone-100 my-1.5 mx-3" />
                                            <button
                                                onClick={() => { setShowStyleSubmenu(false); setShowToolsMenu(false); setAlertConfig({ isOpen: true, title: 'Custom Styles', message: 'Fitur buat & edit style kustom akan segera hadir!', type: 'development' }); }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-stone-50 transition-colors mx-1.5 rounded-lg text-left"
                                                style={{ width: 'calc(100% - 12px)' }}
                                            >
                                                <Plus size={14} className="text-stone-500 shrink-0" strokeWidth={2} />
                                                <span className="text-stone-700">Create &amp; edit styles</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                                'sonnet': 'Fast Thinking',
                                                'sonar': 'Fast Thinking',
                                                'opus': 'Pro',
                                                'philos': 'Noir Philos',
                                                'haiku': 'Haiku',
                                            };
                                            const name = names[selectedModel] || selectedModel;
                                            return (
                                                <span className="flex items-center gap-1">
                                                    {name}
                                                    {selectedModel === 'philos' && (
                                                        <span className="px-1.5 py-0.5 rounded-full border border-stone-200 text-stone-400 text-[9px] font-medium bg-stone-50">
                                                            Soon
                                                        </span>
                                                    )}
                                                </span>
                                            );
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
                <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 mt-3 md:mt-4 max-w-3xl">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (suggestion.action) suggestion.action();
                                setSelectedFeature(selectedFeature?.label === suggestion.label ? null : suggestion as any);
                                setFeaturePrompt('');
                            }}
                            className={cn(
                                "flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-full border text-[12px] md:text-[13px] font-medium transition-colors shadow-sm",
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

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import {
    Plus, X, FileText, Camera, Image as ImageIcon,
    ArrowUp, Globe, Paperclip, ChevronDown, Mic,
    Code2, Target, Sparkles, PenLine, BookOpen, AudioLines, Search, Square, Wrench, Check, Brain, Palette, Folder, Github, Plug, SquareTerminal, ChevronRight, Wand2
} from 'lucide-react';

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
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import { FREE_TOKEN_LIMIT } from '@/lib/tokenLimit';
import { ParsedDocument } from '@/lib/documentParser';
import { AppMode } from '@/lib/modeDetector';
import ModelSelector, { ModelType } from '@/components/ui/ModelSelector';
import VoiceDictationModal from './VoiceDictationModal';
import FileUploadButton from './FileUploadButton';
import AlertModal from '@/components/ui/AlertModal';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ChatInputProps {
    input: string;
    setInput: (value: string | ((prev: string) => string)) => void;
    handleSend: (deepDive?: boolean) => void;
    handleStop?: () => void;
    isTyping: boolean;
    attachedImages: string[];
    removeImage: (index: number) => void;
    appMode: AppMode;
    isMobile: boolean;
    isSubscribed: boolean;
    tokensUsed: number;
    enableWebSearch: boolean;
    setEnableWebSearch: (enabled: boolean) => void;
    setShowQuiz: (show: boolean) => void;
    setShowNotes: (show: boolean) => void;
    setShowDashboard: (show: boolean) => void;
    setShowFlashcards: (show: boolean) => void;
    setShowVoiceCall: (show: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    documentInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleCameraCapture: () => void;
    setUploadedDocument: (doc: ParsedDocument | null) => void;
    setShowDocumentViewer: (show: boolean) => void;
    uploadedDocument: ParsedDocument | null;
    messagesLength: number;
    deepDiveRemaining?: number;
    toggleCanvas?: () => void;
    // New Props for Controlled State
    selectedModel: ModelType;
    onModelChange: (model: ModelType) => void;
    withReasoning: boolean;
    setWithReasoning: (enabled: boolean) => void;
    comparisonMode?: boolean;
    onComparisonModeToggle?: (enabled: boolean) => void;
    // New Props for File Upload
    attachedFiles?: File[];
    onFilesSelected?: (files: File[]) => void;
    removeFile?: (index: number) => void;
    // Deep Research
    deepResearchMode?: boolean;
    onToggleDeepResearch?: (enabled: boolean) => void;
}

// Tool groups for the segmented + dropdown
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

// Quick action pills
const QUICK_ACTIONS = [
    { id: 'code', label: 'Code', icon: Code2 },
    { id: 'strategize', label: 'Strategize', icon: Target },
    { id: 'create', label: 'Create', icon: Sparkles },
    { id: 'write', label: 'Write', icon: PenLine },
    { id: 'learn', label: 'Learn', icon: BookOpen },
];

// Human-readable model display names
const MODEL_DISPLAY_NAMES: Record<string, string> = {
    'sonar': 'Fast Thinking',
    'sonnet': 'Fast Thinking',
    'opus': 'Pro',
    'haiku': 'Haiku',
};

const ChatInput: React.FC<ChatInputProps> = ({
    input,
    setInput,
    handleSend,
    handleStop,
    isTyping,
    attachedImages,
    removeImage,
    appMode,
    isMobile,
    isSubscribed,
    tokensUsed,
    enableWebSearch,
    setEnableWebSearch,
    setShowQuiz,
    setShowNotes,
    setShowDashboard,
    setShowFlashcards,
    setShowVoiceCall,
    fileInputRef,
    documentInputRef,
    handleFileChange,
    handleCameraCapture,
    setUploadedDocument,
    setShowDocumentViewer,
    uploadedDocument,
    messagesLength,
    deepDiveRemaining = 2,
    toggleCanvas,
    selectedModel,
    onModelChange,
    withReasoning,
    setWithReasoning,
    comparisonMode,
    onComparisonModeToggle,
    attachedFiles = [],
    onFilesSelected,
    removeFile,
    deepResearchMode = false,
    onToggleDeepResearch,
}) => {
    const { credits } = useTokenLimit();
    const [showDictation, setShowDictation] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);

    const [isFocused, setIsFocused] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const combinedInputRef = useRef<HTMLInputElement>(null);
    const toolsMenuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // NoirSync handles model routing automatically - no manual deep dive model check needed
    const isDeepDiveModel = false;

    // Close tools menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setShowToolsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-collapse when input is cleared
    useEffect(() => {
        if (!input && textareaRef.current) {
            textareaRef.current.style.height = '28px';
        }
    }, [input]);

    // Handle tool selection from + dropdown
    const handleToolSelect = (toolId: string) => {
        // Add custom vibration or haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        setShowToolsMenu(false);
        switch (toolId) {
            case 'upload_file':
                combinedInputRef.current?.click();
                break;
            case 'camera':
                cameraInputRef.current?.click();
                break;
            case 'project':
                setAlertConfig({
                    isOpen: true,
                    title: 'Projects',
                    message: 'Noir Workspace akan segera hadir! Nantikan fitur kolaborasi proyek yang lebih canggih.',
                    type: 'development'
                });
                break;
            case 'github':
                setAlertConfig({
                    isOpen: true,
                    title: 'GitHub Integration',
                    message: 'Hubungkan repositori GitHub Anda langsung ke Noir untuk analisis kode yang lebih mendalam.',
                    type: 'development'
                });
                break;
            case 'connectors':
                setAlertConfig({
                    isOpen: true,
                    title: 'Connectors',
                    message: 'Integrasikan Google Drive, Notion, dan tool lainnya untuk memperkaya basis pengetahuan AI Anda.',
                    type: 'development'
                });
                break;
            case 'skills':
                setAlertConfig({
                    isOpen: true,
                    title: 'Noir Skills',
                    message: 'Tingkatkan kemampuan AI dengan mengaktifkan skill khusus seperti akses basis data atau pencarian web spesifik.',
                    type: 'development'
                });
                break;
            case 'styles':
                setAlertConfig({
                    isOpen: true,
                    title: 'Writing Styles',
                    message: 'Ubah gaya penulisan AI secara instan. Mulai dari gaya akademis hingga gaya kreatif.',
                    type: 'development'
                });
                break;
            case 'web':
                setEnableWebSearch(!enableWebSearch);
                break;
        }
    };

    // Handle quick action pills
    const handleQuickAction = (actionId: string) => {
        const prompts: Record<string, string> = {
            code: 'Help me write code for ',
            strategize: 'Help me create a strategy for ',
            create: 'Help me create ',
            write: 'Help me write ',
            learn: 'Teach me about ',
        };
        setInput(prompts[actionId] || '');
        textareaRef.current?.focus();
    };

    // Hidden inputs for file upload
    const renderHiddenInputs = () => (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileChange}
            />
            <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
            />
            <input
                type="file"
                ref={documentInputRef}
                className="hidden"
                accept=".pdf,.docx,.txt,.md,.csv,.doc"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                        const { parseDocument } = await import('@/lib/documentParser');
                        const parsed = await parseDocument(file);
                        setUploadedDocument(parsed);
                        setShowDocumentViewer(true);
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        setAlertConfig({
                            isOpen: true,
                            title: 'Parsing Error',
                            message: `Maaf, terjadi kesalahan saat membaca dokumen tersebut: ${errorMessage}`,
                            type: 'info'
                        });
                    }
                    if (documentInputRef.current) documentInputRef.current.value = '';
                }}
            />
            {/* Combined Input for Upload Files menu item */}
            <input
                type="file"
                ref={combinedInputRef}
                className="hidden"
                multiple
                accept="image/*,.pdf,.docx,.txt,.md,.csv,.doc"
                onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    
                    const images = files.filter(f => f.type.startsWith('image/'));
                    const docs = files.filter(f => !f.type.startsWith('image/'));

                    if (images.length) {
                        handleFileChange({ target: { files: images } } as unknown as React.ChangeEvent<HTMLInputElement>);
                    }
                    if (docs.length && onFilesSelected) {
                        onFilesSelected(docs as any);
                    }
                    if (combinedInputRef.current) combinedInputRef.current.value = '';
                }}
            />
        </>
    );

    const modelDisplayName = MODEL_DISPLAY_NAMES[selectedModel] || selectedModel;

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe md:pb-4 bg-transparent z-20">
            {renderHiddenInputs()}

            <div className="max-w-2xl mx-auto w-full px-4 md:px-0">
                {/* Main Input Container — Claude-style */}
                <div className={cn(
                    "w-full bg-white rounded-2xl flex flex-col transition-all duration-200 relative border",
                    isFocused
                        ? "shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] border-stone-300"
                        : "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border-stone-200"
                )}>

                    {/* Attached Images Preview */}
                    {attachedImages.length > 0 && (
                        <div className="w-full px-4 pt-3">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {attachedImages.map((img, idx) => (
                                    <div key={idx} className="relative group shrink-0">
                                        <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-black/5" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white rounded-full p-1 shadow-md hover:bg-zinc-700 transition-all z-10"
                                        >
                                            <X size={10} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attached Files Preview */}
                    {attachedFiles.length > 0 && (
                        <div className="w-full px-4 pt-3">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {attachedFiles.map((file, idx) => (
                                    <div key={idx} className="relative group shrink-0 flex items-center gap-2 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg">
                                        <FileText size={14} className="text-stone-500" />
                                        <span className="text-xs font-medium text-stone-700 max-w-[120px] sm:max-w-[200px] truncate">{file.name}</span>
                                        <button
                                            onClick={() => removeFile?.(idx)}
                                            className="ml-1 text-stone-400 hover:text-stone-700"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Mode Badges */}
                    {(enableWebSearch) && (
                        <div className="px-4 pt-2 flex gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                                <Globe size={12} />
                                Web Search On
                                <button onClick={() => setEnableWebSearch(false)} className="ml-1 hover:text-blue-800">
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Textarea */}
                    <div className="flex-1 min-w-0 py-3 px-4">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(isDeepDiveModel && withReasoning))}
                            onFocus={(e) => {
                                setIsFocused(true);
                                if (input) {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                }
                            }}
                            onBlur={() => setIsFocused(false)}
                            placeholder={isTyping ? "AI is processing..." : "How can I help you today?"}
                            disabled={isTyping}
                            className={cn(
                                "w-full bg-transparent border-0 text-gray-800 placeholder-stone-400 focus:outline-none resize-none max-h-[200px] text-base leading-relaxed font-normal scrollbar-none",
                                isTyping && "opacity-60 cursor-not-allowed"
                            )}
                            style={{ height: '28px', minHeight: '28px' }}
                        />
                    </div>

                    {/* Bottom Bar — Claude Layout */}
                    <div className="w-full flex items-center justify-between px-3 pb-3 gap-2">
                        {/* Left: + Button with Dropdown */}
                        <div className="flex items-center gap-1 relative" ref={toolsMenuRef}>
                            <button
                                onClick={() => setShowToolsMenu(!showToolsMenu)}
                                className={cn(
                                    "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                                    isTyping ? "opacity-30 cursor-not-allowed" : showToolsMenu
                                        ? "bg-stone-200 text-stone-700"
                                        : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                                )}
                                disabled={isTyping}
                                title="Attach menu"
                            >
                                <Plus size={20} strokeWidth={1.8} />
                            </button>



                            {/* Tools Dropdown */}
                            {showToolsMenu && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mb-2 w-[85vw] max-w-[224px] sm:w-56 bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 py-1.5">
                                    {TOOL_GROUPS.map((group, groupIdx) => (
                                        <React.Fragment key={groupIdx}>
                                            <div className="flex flex-col">
                                                {group.map((tool) => {
                                                    const Icon = tool.icon;
                                                    const isActive = (tool.id === 'web' && enableWebSearch);
                                                    return (
                                                        <button
                                                            key={tool.id}
                                                            onClick={() => handleToolSelect(tool.id)}
                                                            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] hover:bg-stone-50 transition-colors mx-1.5 rounded-lg text-left"
                                                            style={{ width: 'calc(100% - 12px)' }}
                                                        >
                                                            <div className={cn("flex justify-center items-center w-5", isActive ? "text-blue-500" : "text-stone-700")}>
                                                                <Icon size={16} strokeWidth={1.8} />
                                                            </div>
                                                            <span className={cn("flex-1", isActive ? "text-blue-600 font-medium" : "text-stone-700")}>{tool.label}</span>
                                                            
                                                            {(tool as any).hasChevron && (
                                                                <ChevronRight size={14} className="text-stone-400 ml-auto" strokeWidth={2} />
                                                            )}
                                                            {isActive && (
                                                                <Check size={16} className="text-blue-500 ml-auto" strokeWidth={2.5} />
                                                            )}
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
                            )}
                        </div>

                        {/* Right: Model Selector + Voice + Send */}
                        <div className="flex items-center gap-1.5">
                            {/* Model Name Button (Claude style: "Sonnet 4.6 ∨") */}
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={onModelChange}
                                disabled={isTyping}
                                withReasoning={withReasoning}
                                onReasoningToggle={() => {
                                    setWithReasoning(!withReasoning);
                                    onToggleDeepResearch?.(!withReasoning);
                                }}
                                isSubscribed={isSubscribed}
                                comparisonMode={comparisonMode}
                                onComparisonModeToggle={onComparisonModeToggle}
                            >
                                <button className="flex items-center gap-1 px-2 py-1.5 text-stone-400 hover:text-stone-600 transition-colors text-sm font-medium">
                                    <span className="hidden sm:inline">{modelDisplayName}</span>
                                    <span className="sm:hidden text-xs">AI</span>
                                    <ChevronDown size={14} strokeWidth={2} />
                                </button>
                            </ModelSelector>

                            {/* Voice Button */}
                            <button
                                onClick={() => setShowDictation(true)}
                                disabled={isTyping}
                                className={cn(
                                    "w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-lg transition-colors hover:bg-stone-100",
                                    isTyping && "opacity-30 cursor-not-allowed"
                                )}
                                title="Voice Input"
                            >
                                <AudioLines size={18} strokeWidth={1.8} />
                            </button>

                            {/* Send / Stop Button */}
                            <button
                                onClick={() => isTyping ? handleStop?.() : handleSend(isDeepDiveModel && withReasoning)}
                                disabled={!isTyping && (!input.trim() && attachedImages.length === 0 && attachedFiles.length === 0)}
                                className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ml-0.5",
                                    !isTyping && (!input.trim() && attachedImages.length === 0 && attachedFiles.length === 0)
                                        ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                                        : isTyping 
                                            ? "bg-stone-800 hover:bg-red-600 text-white" 
                                            : "bg-stone-800 hover:bg-stone-900 text-white transform hover:scale-105"
                                )}
                                title={isTyping ? "Stop generating" : "Send message"}
                            >
                                {isTyping ? (
                                    <Square size={14} fill="currentColor" strokeWidth={0} />
                                ) : (
                                    <ArrowUp size={18} strokeWidth={2.5} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Action Pills — Below the input box */}
                {messagesLength === 0 && (
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        {QUICK_ACTIONS.map(action => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action.id)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm hover:shadow"
                                >
                                    <Icon size={14} strokeWidth={1.8} />
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Footer Disclaimer */}
                <div className="text-center mt-2">
                    <p className="text-[11px] text-stone-400">Noir is AI and can make mistakes. Please double-check responses.</p>
                </div>
            </div>

            <VoiceDictationModal
                isOpen={showDictation}
                onClose={() => setShowDictation(false)}
                onInsert={(text) => {
                    setInput((prev) => prev ? prev + ' ' + text : text);
                }}
            />

        </div >
    );
};

export default ChatInput;

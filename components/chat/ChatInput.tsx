import React, { useState, useRef, useEffect } from 'react';
import {
    Plus, Search, Image as ImageIcon, X, FileText, Camera,
    GraduationCap, BarChart3, Zap, Phone, MoreVertical, Layout,
    ArrowUp, Globe, Paperclip, ChevronDown, Check, Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import { FREE_TOKEN_LIMIT } from '@/lib/tokenLimit';
import { ParsedDocument } from '@/lib/documentParser';
import { AppMode } from '@/lib/modeDetector';
import ModelSelector, { ModelType } from '@/components/ui/ModelSelector';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSend: (deepDive?: boolean) => void;
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
}

const ChatInput: React.FC<ChatInputProps> = ({
    input,
    setInput,
    handleSend,
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
    toggleCanvas
}) => {
    const { credits } = useTokenLimit();

    const [selectedModel, setSelectedModel] = useState<ModelType>('flash');
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const toolsMenuRef = useRef<HTMLDivElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
                setShowAttachmentMenu(false);
            }
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setShowToolsMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hidden inputs for file upload
    const renderHiddenInputs = () => (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                // Removed capture="environment" to default to Gallery/File Picker
                onChange={handleFileChange}
            />
            {/* Dedicated Camera Input */}
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
                accept=".pdf,.docx,.txt,.md"
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
                        alert(`Failed to parse document: ${errorMessage}`);
                    }
                    if (documentInputRef.current) documentInputRef.current.value = '';
                }}
            />
        </>
    );

    // Looping Typewriter effect for placeholder
    const [placeholderText, setPlaceholderText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(100);

    const phrases = [
        "Ask anything with Nevra...",
        "Generate code & images...",
        "Analyze complex data...",
        "Summarize documents..."
    ];

    useEffect(() => {
        const handleTyping = () => {
            const i = loopNum % phrases.length;
            const fullText = phrases[i];

            setPlaceholderText(isDeleting
                ? fullText.substring(0, placeholderText.length - 1)
                : fullText.substring(0, placeholderText.length + 1)
            );

            setTypingSpeed(isDeleting ? 50 : 100);

            if (!isDeleting && placeholderText === fullText) {
                setTimeout(() => setIsDeleting(true), 2000); // Pause at end
            } else if (isDeleting && placeholderText === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
                setTypingSpeed(500); // Pause before typing next
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [placeholderText, isDeleting, loopNum, typingSpeed]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-collapse when input is cleared (message sent)
    useEffect(() => {
        if (!input && textareaRef.current) {
            textareaRef.current.style.height = '28px';
        }
    }, [input]);

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe md:pb-4 bg-transparent z-20">
            {renderHiddenInputs()}

            {/* Attached Images Preview */}

            <div className="max-w-2xl mx-auto w-full px-4 md:px-0">
                {/* Main Input Container - Compact Clean White Card Style */}
                <div className={cn(
                    "w-full bg-white rounded-3xl flex flex-col p-1 transition-all duration-200 relative border border-gray-200/60 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]", // Changed shadow direction for bottom bar
                    isFocused && "border-gray-300" // Subtle border color change only, no ring or shadow expansion
                )}>

                    {/* Attached Images Preview Inside Card */}
                    {attachedImages.length > 0 && (
                        <div className="w-full mb-1 px-2 pt-1">
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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

                    <div className="flex-1 min-w-0 py-0.5 px-2 flex items-center">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(selectedModel === 'deep_dive'))}
                            onFocus={(e) => {
                                setIsFocused(true);
                                // Auto-expand on focus if there is content
                                if (input) {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                }
                            }}
                            onBlur={(e) => {
                                setIsFocused(false);
                                // Auto-collapse on blur
                                e.target.style.height = '28px';
                            }}
                            placeholder={placeholderText}
                            className="w-full bg-transparent border-0 text-gray-800 placeholder-gray-400 focus:outline-none resize-none max-h-[200px] text-base leading-relaxed font-normal scrollbar-none transition-all duration-200 ease-in-out"
                            style={{ height: '28px', minHeight: '28px', paddingTop: '4px' }}
                        />
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="w-full flex items-center justify-between pl-2 pr-2 pb-1.5 mt-0.5">
                        {/* Left Actions (Tools Menu) */}
                        <div className="flex items-center gap-1">
                            <div className="relative flex items-center gap-1" ref={toolsMenuRef}>
                                <button
                                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                                    className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                                >
                                    <Plus size={18} className={cn("transition-transform duration-200", showToolsMenu && "rotate-45")} strokeWidth={2} />
                                </button>

                                {/* Token Badge - Integrated here next to Plus */}
                                {!isSubscribed && (
                                    <div className="flex items-center justify-center h-6 min-w-[32px] px-1.5 bg-yellow-100/50 text-yellow-700 rounded-lg text-[10px] font-bold shrink-0 border border-yellow-200/50 select-none shadow-sm" title={`${credits} prompts remaining`}>
                                        <span className="leading-none">{credits}</span>
                                    </div>
                                )}

                                {/* Canvas/Layout Toggle - Restored */}
                                <button
                                    className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors hidden sm:flex"
                                    title="Toggle Canvas"
                                    onClick={toggleCanvas}
                                >
                                    <Layout size={20} strokeWidth={2} />
                                </button>

                                {/* Consolidated Tools Menu */}
                                {showToolsMenu && (
                                    <div className="absolute bottom-12 left-0 w-64 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 py-1.5">

                                        <button
                                            onClick={() => {
                                                fileInputRef.current?.click();
                                                setShowToolsMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 transition-colors text-sm text-zinc-700"
                                        >
                                            <ImageIcon size={16} className="text-zinc-500" />
                                            <span>Photo Library</span>
                                        </button>

                                        {/* Mobile Camera Option */}
                                        <button
                                            onClick={() => {
                                                if (isMobile) cameraInputRef.current?.click();
                                                else handleCameraCapture();
                                                setShowToolsMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 transition-colors text-sm text-zinc-700"
                                        >
                                            <Camera size={16} className="text-zinc-500" />
                                            <span>{isMobile ? "Take Photo" : "Take Screenshot"}</span>
                                        </button>

                                        <div className="h-[1px] bg-zinc-100 my-1 mx-2" />

                                        {/* Token Badge for Menu (More visible option) */}
                                        {!isSubscribed && (
                                            <div className="px-3 py-2 flex items-center justify-between bg-yellow-50/50 mx-2 rounded-lg border border-yellow-100 mb-1">
                                                <div className="flex items-center gap-2 text-yellow-700">
                                                    <Zap size={14} className="fill-yellow-500 text-yellow-500" />
                                                    <span className="text-xs font-medium">{credits} prompts left</span>
                                                </div>
                                                <span className="text-[10px] text-yellow-600">Free</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => {
                                                setEnableWebSearch(!enableWebSearch);
                                                setShowToolsMenu(false);
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-50 transition-colors text-sm text-zinc-700 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Globe size={16} className={cn("text-zinc-500", enableWebSearch && "text-blue-500")} />
                                                <span>Web search</span>
                                            </div>
                                            {enableWebSearch && <Check size={14} className="text-blue-500" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pb-1.5 pr-1.5 self-end">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                                disabled={isTyping}
                                deepDiveRemaining={deepDiveRemaining}
                                enableWebSearch={enableWebSearch}
                                onWebSearchToggle={() => setEnableWebSearch(!enableWebSearch)}
                            />

                            <button
                                onClick={() => handleSend(selectedModel === 'deep_dive')}
                                disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
                                className={cn(
                                    "w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200",
                                    (!input.trim() && attachedImages.length === 0) || isTyping
                                        ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                                        : "bg-[#eaac94] text-white hover:bg-[#d6a992] shadow-sm"
                                )}
                            >
                                <ArrowUp size={18} className={cn(isTyping && "animate-pulse")} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center mt-2">
                    <p className="text-[11px] text-zinc-400">Nevra is AI and can make mistakes. Please double-check responses.</p>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;


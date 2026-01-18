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

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSend: () => void;
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
    messagesLength
}) => {
    const { credits } = useTokenLimit();


    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const toolsMenuRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="relative p-4 pb-6 md:pb-8 bg-transparent shrink-0 z-20">
            {renderHiddenInputs()}

            {/* Attached Images Preview */}
            {attachedImages.length > 0 && (
                <div className="max-w-3xl mx-auto w-full mb-2 px-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {attachedImages.map((img, idx) => (
                            <div key={idx} className="relative group shrink-0">
                                <img src={img} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-black/5" />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute -top-1 -right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-all"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-3xl mx-auto w-full">
                {/* Main Input Container - ChatGPT Style */}
                <div className={cn(
                    "w-full bg-[#f4f4f4] rounded-[26px] flex items-end p-1.5 transition-all duration-200 relative",
                    isFocused && "bg-[#f0f0f0] ring-1 ring-black/5"
                )}>

                    {/* Left Actions (Attach) */}
                    <div className="flex items-center gap-1 pb-1.5 pl-2">
                        <div className="relative" ref={attachmentMenuRef}>
                            <button
                                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                                className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition-colors"
                            >
                                <Paperclip size={20} />
                            </button>
                            {/* Attachment Menu */}
                            {showAttachmentMenu && (
                                <div className="absolute bottom-12 left-0 w-56 bg-white border border-black/5 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 p-1.5">
                                    <button
                                        onClick={() => {
                                            documentInputRef.current?.click();
                                            setShowAttachmentMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-100 rounded-xl transition-colors text-sm text-zinc-700"
                                    >
                                        <FileText size={18} className="text-green-600 shrink-0" />
                                        <span>Upload Document</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            fileInputRef.current?.click();
                                            setShowAttachmentMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-100 rounded-xl transition-colors text-sm text-zinc-700"
                                    >
                                        <ImageIcon size={18} className="text-blue-600 shrink-0" />
                                        <span>Upload Image</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Area */}
                    <div className="flex-1 min-w-0 py-2.5 px-2">
                        <textarea
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={appMode === 'tutor' ? "Message Nevra..." : "Describe your app..."}
                            className="w-full bg-transparent border-0 text-zinc-900 placeholder-zinc-500 focus:outline-none resize-none max-h-[200px] py-1 text-base leading-relaxed"
                            style={{ height: '44px' }}
                        />
                    </div>

                    {/* Right Actions (Send) */}
                    <div className="flex items-center gap-1 pb-1.5 pr-1.5">
                        {/* Optional Web Search Toggle */}
                        {appMode === 'tutor' && (
                            <button
                                onClick={() => setEnableWebSearch(!enableWebSearch)}
                                className={cn(
                                    "p-2 rounded-full transition-colors",
                                    enableWebSearch ? "bg-blue-100/50 text-blue-600" : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5"
                                )}
                                title="Web Search"
                            >
                                <Globe size={20} />
                            </button>
                        )}

                        <button
                            onClick={() => handleSend()}
                            disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
                            className={cn(
                                "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200",
                                (!input.trim() && attachedImages.length === 0) || isTyping
                                    ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                                    : "bg-black text-white hover:bg-zinc-800"
                            )}
                        >
                            <ArrowUp size={16} />
                        </button>
                    </div>

                </div>

                {/* Footer Info */}
                <div className="text-center mt-2 flex flex-col items-center gap-1">
                    {!isSubscribed && (
                        <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 bg-white/50 dark:bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm transition-colors border border-black/5 dark:border-white/10">
                            {typeof credits === 'number' ? `${credits} prompts remaining today` : 'Unlimited prompts'}
                        </span>
                    )}
                    <span className="text-[10px] text-zinc-400">
                        Nevra can make mistakes. Check important info.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;

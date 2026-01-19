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
    deepDiveRemaining = 2
}) => {
    const { credits } = useTokenLimit();

    const [selectedModel, setSelectedModel] = useState<ModelType>('flash');
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

            <div className="max-w-3xl mx-auto w-full px-4 md:px-0">
                {/* Main Input Container - Soft/Clean Style - Highly Transparent */}
                <div className={cn(
                    "w-full bg-white/10 backdrop-blur-md rounded-[26px] flex items-end p-1.5 transition-all duration-200 relative border border-white/10 shadow-sm hover:shadow-md",
                    isFocused && "bg-white/30 ring-1 ring-purple-100/30 shadow-md"
                )}>

                    {/* Left Actions (Attach) */}
                    <div className="flex items-center gap-1 pb-1.5 pl-2">
                        <div className="relative" ref={attachmentMenuRef}>
                            <button
                                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <Paperclip size={20} strokeWidth={1.5} />
                            </button>
                            {/* Attachment Menu */}
                            {showAttachmentMenu && (
                                <div className="absolute bottom-12 left-0 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 p-1.5">
                                    <button
                                        onClick={() => {
                                            documentInputRef.current?.click();
                                            setShowAttachmentMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-sm text-gray-700"
                                    >
                                        <FileText size={18} className="text-green-600 shrink-0" strokeWidth={1.5} />
                                        <span>Upload Document</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            fileInputRef.current?.click();
                                            setShowAttachmentMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-sm text-gray-700"
                                    >
                                        <ImageIcon size={18} className="text-blue-600 shrink-0" strokeWidth={1.5} />
                                        <span>Upload Image</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Model Selector with Web Search Integration */}
                        <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            disabled={isTyping}
                            deepDiveRemaining={deepDiveRemaining}
                            enableWebSearch={enableWebSearch}
                            onWebSearchToggle={() => setEnableWebSearch(!enableWebSearch)}
                        />
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
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(selectedModel === 'deep_dive'))}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={appMode === 'tutor' ? "Ask something..." : "Describe your app..."}
                            className="w-full bg-transparent border-0 text-gray-800 placeholder-gray-400 focus:outline-none resize-none max-h-[200px] py-1 text-base leading-relaxed"
                            style={{ height: '44px' }}
                        />
                    </div>

                    {/* Right Actions (Send) */}
                    <div className="flex items-center gap-1 pb-1.5 pr-1.5">

                        <button
                            onClick={() => handleSend(selectedModel === 'deep_dive')}
                            disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95",
                                (!input.trim() && attachedImages.length === 0) || isTyping
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
                                    : "bg-gradient-to-r from-[#F0ABFC] to-[#A78BFA] text-white"
                            )}
                        >
                            <ArrowUp size={20} className={cn(isTyping && "animate-pulse")} strokeWidth={2.5} />
                        </button>
                    </div>

                </div>

                {/* Footer Info */}
                <div className="text-center mt-3 pb-safe flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    {!isSubscribed && (
                        <span className="text-[10px] font-medium text-gray-600 bg-white/30 px-3 py-1 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">
                            {typeof credits === 'number' ? `${credits} prompts remaining today` : 'Unlimited prompts'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInput;

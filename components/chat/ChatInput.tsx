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

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe md:pb-8 bg-transparent z-20">
            {renderHiddenInputs()}

            {/* Attached Images Preview */}

            <div className="max-w-2xl mx-auto w-full px-4 md:px-0">
                {/* Main Input Container - Compact Clean White Card Style */}
                <div className={cn(
                    "w-full bg-white rounded-3xl flex flex-col p-2 transition-all duration-200 relative border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                    isFocused && "shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/5"
                )}>

                    {/* Attached Images Preview Inside Card */}
                    {attachedImages.length > 0 && (
                        <div className="w-full mb-2 px-2 pt-2">
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

                    <div className="w-full flex items-end">
                        {/* Left Actions (Tools Menu) */}
                        <div className="flex items-center gap-1 pb-1.5 pl-2">
                            <div className="relative" ref={toolsMenuRef}>
                                <button
                                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                                    className="p-2 rounded-full text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                                >
                                    <Plus size={20} className={cn("transition-transform duration-200", showToolsMenu && "rotate-45")} strokeWidth={2} />
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

                                        <button
                                            onClick={() => {
                                                if (isMobile) {
                                                    cameraInputRef.current?.click();
                                                } else {
                                                    handleCameraCapture();
                                                }
                                                setShowToolsMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 transition-colors text-sm text-zinc-700"
                                        >
                                            <Camera size={16} className="text-zinc-500" />
                                            <span>{isMobile ? "Take Photo" : "Take Screenshot"}</span>
                                        </button>

                                        <div className="h-[1px] bg-zinc-100 my-1 mx-2" />

                                        <button
                                            onClick={() => {
                                                setEnableWebSearch(!enableWebSearch);
                                                // Don't close menu immediately to let user see toggle state change if desired, or close it.
                                                // Let's close it for cleaner UX like a menu action.
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
                                className="w-full bg-transparent border-0 text-gray-800 placeholder-gray-400 focus:outline-none resize-none max-h-[200px] py-2 text-base leading-relaxed font-normal"
                                style={{ height: '40px', minHeight: '40px' }}
                            />
                        </div>

                        {/* Right Actions (Send & Model) */}
                        <div className="flex items-center gap-2 pb-1.5 pr-1.5 self-end">
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
                                    "w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-zinc-100",
                                    isTyping
                                        ? "text-zinc-300 cursor-not-allowed"
                                        : "text-zinc-900"
                                )}
                            >
                                <ArrowUp size={18} className={cn(isTyping && "animate-pulse")} strokeWidth={2.5} />
                            </button>
                        </div>
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


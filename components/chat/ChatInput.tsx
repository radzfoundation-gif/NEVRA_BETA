import React, { useState, useRef, useEffect } from 'react';
import {
    Plus, Search, Image as ImageIcon, X, FileText, Camera,
    GraduationCap, BarChart3, Zap, Phone, MoreVertical, Layout,
    ArrowUp, Globe, Paperclip, ChevronDown, Check, Sparkles,
    Mic, Grid3X3, PenTool
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
    // Updated handleSend signature to allow passing model info if needed, or rely on parent state
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
    // New Props for Controlled State
    selectedModel: ModelType;
    onModelChange: (model: ModelType) => void;
    withReasoning: boolean;
    setWithReasoning: (enabled: boolean) => void;
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
    toggleCanvas,
    selectedModel,
    onModelChange,
    withReasoning,
    setWithReasoning
}) => {
    const { credits } = useTokenLimit();

    // Removed local state for selectedModel and withReasoning
    const [isFocused, setIsFocused] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);

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

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-collapse when input is cleared
    useEffect(() => {
        if (!input && textareaRef.current) {
            textareaRef.current.style.height = '28px';
        }
    }, [input]);

    // Check if model supports reasoning (deep dive)
    const isDeepDiveModel = selectedModel === 'claude-sonnet' || selectedModel === 'claude-opus' || selectedModel === 'gpt-5';

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe md:pb-4 bg-transparent z-20">
            {renderHiddenInputs()}

            <div className="max-w-2xl mx-auto w-full px-4 md:px-0">
                {/* Main Input Container */}
                <div className={cn(
                    "w-full bg-white rounded-2xl flex flex-col transition-all duration-200 relative shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] border",
                    isFocused
                        ? "shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] border-teal-300"
                        : "border-gray-200"
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
                            placeholder="Ask anything. Type @ for mentions and / for shortcuts."
                            className="w-full bg-transparent border-0 text-gray-800 placeholder-gray-400 focus:outline-none resize-none max-h-[200px] text-base leading-relaxed font-normal scrollbar-none"
                            style={{ height: '28px', minHeight: '28px' }}
                        />
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="w-full flex items-center justify-between px-3 pb-3">
                        {/* Left Actions */}
                        <div className="flex items-center gap-0.5">
                            {/* Search / Focus Mode */}
                            <button
                                onClick={() => setEnableWebSearch(!enableWebSearch)}
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    enableWebSearch
                                        ? "bg-teal-50 text-teal-600"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                )}
                                title="Web Search"
                            >
                                <Search size={18} strokeWidth={2} />
                            </button>

                            {/* Pen / Edit */}
                            <button
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                title="Edit"
                            >
                                <PenTool size={18} strokeWidth={2} />
                            </button>

                            {/* Canvas / Grid */}
                            <button
                                onClick={toggleCanvas}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                title="Canvas"
                            >
                                <Grid3X3 size={18} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1">
                            {/* Globe / Web */}
                            <button
                                onClick={() => setEnableWebSearch(!enableWebSearch)}
                                className={cn(
                                    "p-2 rounded-lg transition-all hidden sm:flex",
                                    enableWebSearch
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                )}
                                title="Web Search"
                            >
                                <Globe size={18} strokeWidth={2} />
                            </button>

                            {/* Model Selector */}
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={onModelChange}
                                disabled={isTyping}
                                withReasoning={withReasoning}
                                onReasoningToggle={() => setWithReasoning(!withReasoning)}
                            />

                            {/* Attach */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                title="Attach file"
                            >
                                <Paperclip size={18} strokeWidth={2} />
                            </button>

                            {/* Voice */}
                            <button
                                onClick={() => setShowVoiceCall(true)}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all hidden sm:flex"
                                title="Voice"
                            >
                                <Mic size={18} strokeWidth={2} />
                            </button>

                            {/* Send Button */}
                            <button
                                onClick={() => handleSend(isDeepDiveModel && withReasoning)}
                                disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
                                className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ml-1",
                                    (!input.trim() && attachedImages.length === 0) || isTyping
                                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                        : "bg-teal-600 text-white hover:bg-teal-700 shadow-md"
                                )}
                            >
                                <BarChart3 size={18} className={cn(isTyping && "animate-pulse", "rotate-90")} strokeWidth={2.5} />
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

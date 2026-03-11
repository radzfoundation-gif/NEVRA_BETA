import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Brain, ChevronRight, ChevronLeft, Clock, Zap, CircleDashed, Globe, Sparkles, Cpu, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type ModelType = 'gemini-flash' | 'gemini-pro' | 'claude-sonnet' | 'claude-opus' | 'gpt-5' | 'grok' | 'sonar' | 'stepfun/step-3.5-flash:free';

interface ModelOption {
    id: ModelType;
    name: string;
    provider: string;
    icon: React.ReactNode;
    badge?: string;
    isNew?: boolean;
    locked?: boolean;
    description?: string;
}

const MODEL_OPTIONS: ModelOption[] = [
    {
        id: 'stepfun/step-3.5-flash:free',
        name: 'Stepfun 3.5 Flash',
        provider: 'Stepfun',
        icon: <Sparkles size={16} className="text-purple-400" />,
        description: 'Fast & Free',
        badge: 'free'
    },
    {
        id: 'gemini-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        icon: <img src="/gemini-logo-v2.png" alt="Gemini" className="w-5 h-5 object-contain" />,
        description: 'Fastest response time'
    },
    {
        id: 'sonar',
        name: 'NoirSync (Sonar)',
        provider: 'Perplexity',
        icon: <Globe size={16} className="text-blue-400" />,
        description: 'Real-time search',
        badge: 'pro',
        locked: true,
    },
    {
        id: 'claude-sonnet',
        name: 'Claude Sonnet 4.5',
        provider: 'Anthropic',
        icon: <img src="/claude-logo.jpg" alt="Claude" className="w-4 h-4 object-contain rounded-sm" />,
        locked: true,
        badge: 'pro',
    },
    {
        id: 'gpt-5',
        name: 'GPT-5.1',
        provider: 'OpenAI',
        icon: <img src="/gpt-logo.jpg" alt="GPT" className="w-4 h-4 object-contain" />,
        locked: true,
        badge: 'pro',
    },
    {
        id: 'gemini-pro',
        name: 'Gemini 3 Pro',
        provider: 'Google',
        icon: <img src="/gemini-logo-v2.png" alt="Gemini" className="w-5 h-5 object-contain" />,
        isNew: true,
        locked: true,
        badge: 'pro',
    },
    {
        id: 'claude-opus',
        name: 'Claude Opus 4.1',
        provider: 'Anthropic',
        icon: <img src="/claude-logo.jpg" alt="Claude" className="w-4 h-4 object-contain rounded-sm" />,
        badge: 'max',
        locked: true,
    },
    {
        id: 'grok',
        name: 'Grok 4.1',
        provider: 'xAI',
        icon: <img src="/grok-logo.png" alt="Grok" className="w-5 h-5 object-contain bg-black rounded-sm p-[1px]" />,
        locked: true,
        badge: 'soon',
    },
];

export interface ModelSelectorProps {
    selectedModel: ModelType;
    onModelChange: (model: ModelType) => void;
    disabled?: boolean;
    withReasoning?: boolean;
    onReasoningToggle?: () => void;
    isSubscribed?: boolean;
    children?: React.ReactNode;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModel,
    onModelChange,
    disabled = false,
    withReasoning = false,
    onReasoningToggle,
    isSubscribed = false,
    children
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = MODEL_OPTIONS.find(m => m.id === selectedModel) || MODEL_OPTIONS[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredModels = MODEL_OPTIONS.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative z-[100]" ref={dropdownRef}>
            {/* Trigger Button */}
            {children ? (
                <div onClick={() => !disabled && setIsOpen(!isOpen)} className={disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}>
                    {children}
                </div>
            ) : (
                <button
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    title="Select Model"
                >
                    <Cpu size={20} strokeWidth={1.5} />
                </button>
            )}

            {/* Dropdown Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, x: "-50%" }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fixed left-1/2 bottom-32 w-[260px] sm:transform-none sm:left-auto sm:translate-x-0 sm:absolute sm:bottom-full sm:right-0 sm:w-[280px] bg-[#1e1e1e] border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col z-[100] sm:mb-2 max-h-[400px]"
                    >
                        <div className="flex flex-col w-full h-full">
                            {/* Search Header */}
                            <div className="p-2 border-b border-white/5 bg-zinc-900/40">
                                <div className="relative bg-zinc-800/80 rounded-lg flex items-center px-2 py-1.5 border border-white/5 focus-within:border-white/10 transition-colors">
                                    <Search size={14} className="text-zinc-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Search models..."
                                        className="w-full bg-transparent border-none outline-none text-xs text-zinc-200 placeholder-zinc-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Options Container */}
                            <div className="flex-1 overflow-y-auto p-1.5 hide-scrollbar">
                                <div className="px-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1.5 mt-1">Available Models</div>
                                
                                {filteredModels.map(model => (
                                    <button
                                        key={model.id}
                                        disabled={model.locked && !isSubscribed}
                                        onClick={() => {
                                            if (!model.locked || isSubscribed) {
                                                onModelChange(model.id);
                                                setIsOpen(false);
                                            }
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between gap-3 px-2 py-2 rounded-lg transition-all text-left mb-0.5 group",
                                            selectedModel === model.id ? "bg-blue-500/10 hover:bg-blue-500/20" : "hover:bg-white/5",
                                            model.locked && !isSubscribed && "opacity-50 hover:opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 border border-white/5 group-hover:border-white/10 transition-colors">
                                                {model.icon}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn(
                                                        "text-[13px] font-medium transition-colors",
                                                        selectedModel === model.id ? "text-blue-400" : "text-zinc-200"
                                                    )}>
                                                        {model.name}
                                                    </span>
                                                    {model.badge === 'soon' && <span className="text-[9px] px-1 py-0.5 rounded-sm bg-zinc-800 text-zinc-400 leading-none">Soon</span>}
                                                    {model.badge === 'free' && <span className="text-[9px] px-1 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 leading-none">Free</span>}
                                                    {model.badge === 'pro' && !isSubscribed && <span className="text-[9px] px-1 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 leading-none font-semibold">PRO</span>}
                                                    {model.badge === 'max' && !isSubscribed && <span className="text-[9px] px-1 py-0.5 rounded-sm bg-purple-500/10 text-purple-400 leading-none font-semibold">MAX</span>}
                                                </div>
                                                {model.description && (
                                                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                                        {model.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedModel === model.id && (
                                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {filteredModels.length === 0 && (
                                    <div className="py-6 text-center">
                                        <p className="text-xs text-zinc-500">No models found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModelSelector;

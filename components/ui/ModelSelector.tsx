import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Brain, ChevronRight, ChevronLeft, Clock, Zap, CircleDashed, Globe, Sparkles, Cpu, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type ModelType = 'gemini-flash' | 'gemini-pro' | 'claude-sonnet' | 'claude-opus' | 'gpt-5' | 'grok' | 'sonar';

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
        id: 'sonar',
        name: 'Noir Beta',
        provider: 'DeepSeek',
        icon: <img src="/noir-beta-logo.jpg" alt="Noir" className="w-5 h-5 object-contain rounded-sm" />,
        description: 'Recommended for coding & logic'
    },
    {
        id: 'gemini-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        icon: <img src="/gemini-logo-v2.png" alt="Gemini" className="w-5 h-5 object-contain" />,
        description: 'Fastest response time'
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
    const [view, setView] = useState<'main' | 'more'>('main');
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = MODEL_OPTIONS.find(m => m.id === selectedModel) || MODEL_OPTIONS[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setView('main'); // Reset view on close
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter models for "more" view search
    const filteredModels = MODEL_OPTIONS.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Toggle switch component
    const Toggle = ({ checked, onChange }: { checked: boolean, onChange?: () => void }) => (
        <button
            onClick={onChange}
            className={cn(
                "w-9 h-5 rounded-full relative transition-colors duration-200",
                checked ? "bg-blue-500" : "bg-zinc-600"
            )}
        >
            <div className={cn(
                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm",
                checked ? "left-4.5 translate-x-0" : "left-0.5"
            )} style={{ left: checked ? '18px' : '2px' }} />
        </button>
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
                        className="fixed left-1/2 bottom-32 w-[260px] sm:transform-none sm:left-auto sm:translate-x-0 sm:absolute sm:bottom-full sm:right-0 sm:w-[280px] bg-[#1e1e1e] border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col z-[100] sm:mb-2"
                    >
                        <AnimatePresence mode="wait">
                            {view === 'main' ? (
                                <motion.div
                                    key="main"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="flex flex-col w-full"
                                >
                                    {/* Search Header */}
                                    <div className="p-2">
                                        <div className="relative bg-zinc-800/50 rounded-lg flex items-center px-2 py-1.5 border border-white/5">
                                            <Search size={14} className="text-zinc-400 mr-2" />
                                            <input
                                                type="text"
                                                placeholder="Search models..."
                                                className="w-full bg-transparent border-none outline-none text-xs text-zinc-200 placeholder-zinc-500"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Optional Toggles */}
                                    <div className="px-3 py-1.5 space-y-2 border-b border-white/5 pb-2">
                                        <div className="text-[10px] font-medium text-zinc-500 mb-0.5">Optional</div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-300 font-medium">Auto</span>
                                            <Toggle checked={false} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-300 font-medium">Multiple Models</span>
                                            <Toggle checked={false} />
                                        </div>
                                    </div>

                                    {/* Recent/Top Models */}
                                    <div className="py-1 px-1">
                                        <div className="px-2 text-[10px] font-medium text-zinc-500 mb-0.5">Models</div>

                                        {/* "More models" Trigger */}
                                        <button
                                            onClick={() => setView('more')}
                                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                                        >
                                            <span className="text-xs text-zinc-300 font-medium group-hover:text-white">More models</span>
                                            <ChevronRight size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                                        </button>

                                        {/* Selected / Favorites (Snippet) */}
                                        {MODEL_OPTIONS.slice(0, 3).map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => {
                                                    onModelChange(model.id);
                                                    setIsOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors mt-0.5",
                                                    selectedModel === model.id ? "bg-white/10" : "hover:bg-white/5"
                                                )}
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center grayscale-[0.2]">
                                                    {model.icon}
                                                </div>
                                                <div className="text-left flex-1">
                                                    <div className="text-xs text-zinc-200 font-medium">{model.name}</div>
                                                </div>
                                                {selectedModel === model.id && <Check size={12} className="text-blue-400" />}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Footer: Temporary Chat */}
                                    <div className="mt-0.5 p-2 border-t border-white/5 bg-zinc-900/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-zinc-400" />
                                                <span className="text-xs text-zinc-300">Temporary chat</span>
                                            </div>
                                            <Toggle checked={true} />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="more"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    className="flex flex-col w-full h-full max-h-[350px]"
                                >
                                    {/* Back Header */}
                                    <div className="flex items-center gap-2 p-2 border-b border-white/5">
                                        <button
                                            onClick={() => setView('main')}
                                            className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Ask for a model..."
                                            className="bg-transparent text-xs text-white placeholder-zinc-500 outline-none flex-1"
                                            autoFocus
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {/* Full List */}
                                    <div className="flex-1 overflow-y-auto p-1">
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
                                                    "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all text-left mb-0.5",
                                                    selectedModel === model.id ? "bg-white/10" : "hover:bg-white/5",
                                                    model.locked && !isSubscribed && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    {model.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-zinc-200 font-medium">{model.name}</div>
                                                    {model.badge === 'soon' && <div className="text-[9px] text-zinc-500">Coming Soon</div>}
                                                </div>
                                                {selectedModel === model.id && <Check size={12} className="text-blue-400" />}
                                                {model.badge === 'pro' && !isSubscribed && (
                                                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0 rounded">PRO</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModelSelector;

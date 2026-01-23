import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Brain, Sparkles, Zap, Lock } from 'lucide-react';

export type ModelType = 'gemini-flash' | 'gemini-pro' | 'claude-sonnet' | 'claude-opus' | 'gpt-5' | 'grok' | 'sonar';

interface ModelOption {
    id: ModelType;
    name: string;
    provider: string;
    icon: React.ReactNode;
    badge?: string;
    isNew?: boolean;
    locked?: boolean;
}

const MODEL_OPTIONS: ModelOption[] = [
    {
        id: 'sonar',
        name: 'NoirSync',
        provider: 'Perplexity',
        icon: <Search size={16} className="text-teal-500" />,
    },
    {
        id: 'gemini-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        icon: <img src="/gemini-logo-v2.png" alt="Gemini" className="w-5 h-5 object-contain" />,
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
        id: 'gpt-5',
        name: 'GPT-5.2',
        provider: 'OpenAI',
        icon: <img src="/gpt-logo.jpg" alt="GPT" className="w-4 h-4 object-contain" />,
        locked: true,
        badge: 'pro',
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
        id: 'claude-opus',
        name: 'Claude Opus 4.5',
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
        badge: 'pro',
    },
];

export interface ModelSelectorProps {
    selectedModel: ModelType;
    onModelChange: (model: ModelType) => void;
    disabled?: boolean;
    withReasoning?: boolean;
    onReasoningToggle?: () => void;
    isSubscribed?: boolean; // NEW: Unlock Pro models for subscribers
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModel,
    onModelChange,
    disabled = false,
    withReasoning = false,
    onReasoningToggle,
    isSubscribed = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = MODEL_OPTIONS.find(m => m.id === selectedModel) || MODEL_OPTIONS[1];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Model Button */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200 border
                    ${disabled
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm'
                    }
                `}
            >
                <span className="w-4 h-4 flex items-center justify-center">{selectedOption.icon}</span>
                <span className="hidden sm:inline text-xs">{selectedOption.name}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {/* Header */}
                    <div className="px-4 py-2.5 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Best</span>
                    </div>

                    {/* Model List */}
                    <div className="py-1 max-h-[320px] overflow-y-auto">
                        {MODEL_OPTIONS.map((option) => {
                            const isSelected = selectedModel === option.id;
                            // Unlock Pro models if user is subscribed
                            const isLocked = option.locked && !isSubscribed;

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        if (!isLocked) {
                                            onModelChange(option.id);
                                            setIsOpen(false);
                                        }
                                    }}
                                    disabled={isLocked}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all
                                        ${isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'}
                                        ${isLocked ? 'opacity-50 cursor-not-allowed group' : ''}
                                    `}
                                >
                                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                                        {option.icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${isSelected ? 'font-semibold text-teal-700' : 'font-medium text-gray-800'}`}>
                                                {option.name}
                                            </span>
                                            {option.badge && (
                                                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${option.badge === 'pro'
                                                    ? 'bg-zinc-800 text-zinc-100'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {option.badge}
                                                </span>
                                            )}
                                            {option.isNew && (
                                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-green-100 text-green-700">
                                                    new
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <Check size={16} className="text-teal-600 shrink-0" />
                                    )}
                                    {isLocked && !isSelected && (
                                        <Lock size={14} className="text-gray-400 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Reasoning Toggle */}
                    {onReasoningToggle && (
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={onReasoningToggle}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Brain size={14} className="text-purple-500" />
                                    <span className="text-sm font-medium text-gray-700">With reasoning</span>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${withReasoning ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${withReasoning ? 'left-5' : 'left-0.5'}`} />
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ModelSelector;

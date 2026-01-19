import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, Brain } from 'lucide-react';

export type ModelType = 'flash' | 'deep_dive';

interface ModelOption {
    id: ModelType;
    name: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
}

const MODEL_OPTIONS: ModelOption[] = [
    {
        id: 'flash',
        name: 'Flash',
        description: 'Fast & efficient',
        icon: <Zap size={16} className="text-yellow-500" />,
    },
    {
        id: 'deep_dive',
        name: 'Deep Dive',
        description: 'GPT-5 • Advanced reasoning',
        icon: <Brain size={16} className="text-purple-500" />,
        badge: '2/day',
    },
];

export interface ModelSelectorProps {
    selectedModel: ModelType;
    onModelChange: (model: ModelType) => void;
    disabled?: boolean;
    deepDiveRemaining?: number;
    enableWebSearch?: boolean;
    onWebSearchToggle?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModel,
    onModelChange,
    disabled = false,
    deepDiveRemaining = 2,
    enableWebSearch = false,
    onWebSearchToggle
}) => {
    const [isOpen, setIsOpen] = useState(false);
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          flex items-center justify-center w-8 h-8 rounded-full
          transition-all duration-200 border shadow-sm
          ${disabled
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100'
                        : 'bg-white/50 hover:bg-white text-gray-700 border-white/20 hover:border-gray-200'
                    }
        `}
                title={selectedOption.name}
            >
                {/* Show Globe icon if Web Search is active, otherwise Model Icon */}
                {enableWebSearch ? (
                    <div className="relative">
                        <div className="text-blue-500">
                            {/* Small indicator dot for active web search */}
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse border border-white" />
                            {selectedOption.icon}
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500">
                        {selectedOption.icon}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {/* Web Search Toggle Section */}
                    {onWebSearchToggle && (
                        <div className="p-1 border-b border-gray-100/50">
                            <button
                                onClick={() => {
                                    onWebSearchToggle();
                                    // Don't close dropdown immediately to allow checking
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${enableWebSearch ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {/* Globe Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={enableWebSearch ? "text-blue-500" : "text-gray-400"}>
                                        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                    <span>Web Search</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${enableWebSearch ? 'bg-blue-500' : 'bg-gray-200'}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${enableWebSearch ? 'left-4.5 translate-x-3.5' : 'left-0.5'}`} />
                                </div>
                            </button>
                        </div>
                    )}

                    <div className="p-1 space-y-0.5">
                        {MODEL_OPTIONS.map((option) => {
                            const isDeepDive = option.id === 'deep_dive';
                            const isDisabled = isDeepDive && deepDiveRemaining <= 0;

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            onModelChange(option.id);
                                            setIsOpen(false);
                                        }
                                    }}
                                    disabled={isDisabled}
                                    className={`
                                      w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl transition-all
                                      ${selectedModel === option.id ? 'bg-gray-100' : 'hover:bg-gray-50'}
                                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <div className="shrink-0 scale-90">{option.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-800">{option.name}</span>
                                            {option.badge && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isDeepDive
                                                    ? `bg-purple-100 ${deepDiveRemaining > 0 ? 'text-purple-600' : 'text-purple-400'}`
                                                    : 'bg-zinc-100 text-zinc-500'
                                                    }`}>
                                                    {isDeepDive ? `${deepDiveRemaining}/2` : option.badge}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedModel === option.id && (
                                        <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-black ml-1" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelSelector;

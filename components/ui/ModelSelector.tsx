import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Brain, ChevronRight, ChevronLeft, Clock, Zap, CircleDashed, Globe, Sparkles, Cpu, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type ModelType = 'sonar';

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
        name: 'NoirSync',
        provider: 'Noir AI',
        icon: <Sparkles size={16} className="text-purple-400" />,
        description: 'Smart Auto-Routing',
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
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = MODEL_OPTIONS[0];

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
                        <div className="flex flex-col w-full h-full">
                            {/* Header */}
                            <div className="p-3 border-b border-white/5 bg-zinc-900/40">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400" />
                                    <span className="text-xs font-semibold text-zinc-300">NoirSync — Smart Routing</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3 space-y-2">
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    Noir secara otomatis memilih model AI terbaik berdasarkan konteks percakapan Anda:
                                </p>
                                <div className="space-y-1.5">
                                    {[
                                        { emoji: '💬', label: 'Chat biasa', model: 'Seed 2.0 Mini' },
                                        { emoji: '🔍', label: 'Web Search', model: 'Gemini 2.5 Flash Lite' },
                                        { emoji: '💻', label: 'Coding', model: 'Kimi K2 Thinking' },
                                        { emoji: '📄', label: 'PDF / Document', model: 'Claude Opus 4' },
                                        { emoji: '🎨', label: 'Visual / Design', model: 'Gemini 3 Pro' },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.03]">
                                            <span className="text-[11px] text-zinc-400">
                                                {item.emoji} {item.label}
                                            </span>
                                            <span className="text-[10px] font-medium text-zinc-500">
                                                {item.model}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModelSelector;

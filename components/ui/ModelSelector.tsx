import React, { useState, useRef, useEffect } from 'react';
import { Check, Lock, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AlertModal from './AlertModal';

export type ModelType = 'sonar' | 'opus' | 'sonnet' | 'philos' | 'thinking' | string;

interface ModelOption {
    id: ModelType;
    name: string;
    description: string;
    isPro?: boolean;
    isSoon?: boolean;
    isActive?: boolean;
    locked?: boolean;
}

const MODEL_OPTIONS: ModelOption[] = [
    {
        id: 'philos',
        name: 'Glass Poseidon',
        description: 'Super Agent — Multi-phase reasoning & research.',
        isSoon: true,
    },
    {
        id: 'sonnet',
        name: 'Storm',
        description: 'Fast, accurate answers for daily work',
        isSoon: false,
    },
    {
        id: 'thinking',
        name: 'Thinking',
        description: 'Plans first, then answers',
        isSoon: false,
    },
    {
        id: 'opus',
        name: 'Pro',
        description: 'Most capable for ambitious work',
        isPro: true,
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
    comparisonMode?: boolean;
    onComparisonModeToggle?: (enabled: boolean) => void;
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
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'info' | 'development' | 'upgrade';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'upgrade'
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

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
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fixed bottom-[calc(6.5rem+var(--kb-offset,0px)+env(safe-area-inset-bottom))] left-3 right-3 max-h-[calc(100dvh-8rem-var(--kb-offset,0px))] overflow-y-auto rounded-[18px] border border-stone-200 bg-white shadow-xl z-[100] origin-bottom-right sm:absolute sm:bottom-full sm:left-auto sm:right-0 sm:mb-2 sm:w-[260px] sm:max-h-none sm:overflow-hidden"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="main"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.12 }}
                                className="flex flex-col w-full py-1.5"
                            >
                                {/* Models List */}
                                    <div className="flex flex-col">
                                        {MODEL_OPTIONS.map((model) => {
                                            const isActive = selectedModel === model.id || (selectedModel === 'sonar' && model.id === 'sonnet');
                                            const isLocked = model.isPro && !isSubscribed;

                                            return (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        if (model.isSoon) return;
                                                        if (isLocked) {
                                                            setAlertConfig({
                                                                isOpen: true,
                                                                title: 'UseGlass Pro Feature',
                                                                message: `Model ${model.name} eksklusif untuk pengguna UseGlass Pro. Tingkatkan akun Anda untuk menikmati kecerdasan tingkat lanjut.`,
                                                                type: 'upgrade'
                                                            });
                                                            return;
                                                        }
                                                        onModelChange(model.id);
                                                        handleClose();
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center px-4 py-2 transition-colors text-left",
                                                        model.isSoon ? "opacity-50 cursor-not-allowed" : isLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-stone-50"
                                                    )}
                                                >
                                                    <div className="flex-1 flex flex-col justify-center pr-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[14px] text-stone-900 font-medium">{model.name}</span>
                                                            {model.isPro && (
                                                                <span className="px-1.5 py-0.5 rounded-full border border-blue-200 text-blue-600 text-[10px] font-medium bg-white flex items-center gap-1">
                                                                    {isLocked && <Lock size={10} />}
                                                                    Upgrade
                                                                </span>
                                                            )}
                                                            {model.isSoon && (
                                                                <span className="px-1.5 py-0.5 rounded-full border border-stone-200 text-stone-400 text-[10px] font-medium bg-stone-50">
                                                                    Soon
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[12px] text-stone-500 mt-0.5">{model.description}</span>
                                                    </div>
                                                    {isActive && (
                                                        <Check size={16} className="text-blue-500 ml-auto shrink-0" strokeWidth={2.5} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="h-px bg-stone-100 my-1 mx-4" />

                                    {/* Deep Research Toggle */}
                                    <div className="px-2">
                                        <button
                                            onClick={() => onReasoningToggle?.()}
                                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-stone-100 transition-colors text-left bg-stone-50/80 rounded-xl"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[13px] text-stone-900 font-medium">Deep Research</span>
                                                <span className="text-[11px] text-stone-500 mt-0.5">Extra time for complex logic & research</span>
                                            </div>
                                            <div className={cn(
                                                "w-7 h-4 rounded-full transition-colors flex items-center px-0.5 border relative shrink-0",
                                                withReasoning ? "bg-green-500 border-green-500" : "bg-white border-stone-300"
                                            )}>
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform border",
                                                    withReasoning ? "translate-x-3 bg-white border-transparent" : "translate-x-0 bg-white border-stone-200"
                                                )} />
                                            </div>
                                        </button>
                                    </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
};

export default ModelSelector;

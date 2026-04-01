import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, ChevronRight, ChevronLeft, Lock, Sparkles, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AlertModal from './AlertModal';

export type ModelType = 'sonar' | 'opus' | 'sonnet' | 'philos' | string;

interface ModelOption {
    id: ModelType;
    name: string;
    description: string;
    isPro?: boolean;
    isSoon?: boolean;
    isActive?: boolean;
    locked?: boolean;
}

interface ExtendedModel {
    name: string;
    provider: 'OpenAI' | 'Google' | 'Anthropic' | 'Qwen' | 'Meta' | 'NVIDIA' | 'MiniMax' | 'Z.ai' | 'StepFun' | 'Nous' | 'OpenRouter';
    description: string;
    score: number;
    modelId: string;
}

const MODEL_OPTIONS: ModelOption[] = [
    {
        id: 'philos',
        name: 'Noir Philos',
        description: 'Super Agent — Multi-phase reasoning & research.',
        isSoon: true,
    },
    {
        id: 'sonnet',
        name: 'Fast Thinking',
        description: 'fast & smart for daily work',
        isSoon: false,
    },
    {
        id: 'opus',
        name: 'Pro',
        description: 'Most capable for ambitious work',
        isPro: true,
    },
];

const PROVIDER_COLORS: Record<ExtendedModel['provider'], string> = {
    OpenAI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Google: 'bg-blue-50 text-blue-700 border-blue-200',
    Anthropic: 'bg-orange-50 text-orange-700 border-orange-200',
    Qwen: 'bg-purple-50 text-purple-700 border-purple-200',
    Meta: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    NVIDIA: 'bg-green-50 text-green-700 border-green-200',
    MiniMax: 'bg-pink-50 text-pink-700 border-pink-200',
    'Z.ai': 'bg-red-50 text-red-700 border-red-200',
    StepFun: 'bg-teal-50 text-teal-700 border-teal-200',
    Nous: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    OpenRouter: 'bg-stone-50 text-stone-700 border-stone-200',
};

const FREE_MODELS: ExtendedModel[] = [
    { name: 'Qwen 3.6 Plus', provider: 'Qwen', description: '1M context, best free model', score: 79.5, modelId: 'qwen/qwen3.6-plus-preview:free' },
    { name: 'Step 3.5 Flash', provider: 'StepFun', description: 'Ultra-fast & capable', score: 78.8, modelId: 'stepfun/step-3.5-flash:free' },
    { name: 'Nemotron 3 Super 120B', provider: 'NVIDIA', description: 'Large NVIDIA expert model', score: 75.8, modelId: 'nvidia/nemotron-3-super-120b-a12b:free' },
    { name: 'MiniMax M2.5', provider: 'MiniMax', description: 'Strong multi-modal reasoning', score: 74.5, modelId: 'minimax/minimax-m2.5:free' },
    { name: 'GLM 4.5 Air', provider: 'Z.ai', description: 'Zhuipu AI fast inference', score: 73.9, modelId: 'z-ai/glm-4.5-air:free' },
    { name: 'Gemma 3 27B', provider: 'Google', description: 'Open model by Google', score: 71.2, modelId: 'google/gemma-3-27b-it:free' },
    { name: 'gpt-oss 120B', provider: 'OpenAI', description: 'High-parameter OpenSource GPT', score: 70.5, modelId: 'openai/gpt-oss-120b:free' },
    { name: 'Auto Free', provider: 'OpenRouter', description: 'Auto-routed free models', score: 68.0, modelId: 'openrouter-free' },
];

const PRO_MODELS: ExtendedModel[] = [
    { name: 'GPT-5.4 Thinking xHigh', provider: 'OpenAI', description: 'Highest effort reasoning', score: 80.28, modelId: 'gpt-5-high' },
    { name: 'Gemini 3.1 Pro Preview', provider: 'Google', description: 'High effort, top Google model', score: 79.93, modelId: 'gemini-3-pro' },
    { name: 'Claude 4.6 Opus Thinking', provider: 'Anthropic', description: 'High effort, Anthropic flagship', score: 76.33, modelId: 'claude-4-opus' },
    { name: 'Claude 4.5 Opus Thinking', provider: 'Anthropic', description: 'High effort reasoning', score: 75.96, modelId: 'claude-4-5-opus' },
    { name: 'Claude 4.6 Sonnet Thinking', provider: 'Anthropic', description: 'Medium effort, fast & smart', score: 75.47, modelId: 'claude-4-sonnet' },
    { name: 'GPT-5.2 High', provider: 'OpenAI', description: 'High effort GPT-5 series', score: 74.84, modelId: 'gpt-5-2-high' },
    { name: 'GPT-5.2 Codex', provider: 'OpenAI', description: 'Optimized for code generation', score: 74.30, modelId: 'gpt-5-2-codex' },
    { name: 'GPT-5.1 Codex Max High', provider: 'OpenAI', description: 'Max effort code model', score: 73.98, modelId: 'gpt-5-1-codex' },
    { name: 'Gemini 3 Pro Preview', provider: 'Google', description: 'High effort Gemini 3', score: 73.39, modelId: 'gemini-3-pro-ext' },
    { name: 'GPT-5.3 Codex High', provider: 'OpenAI', description: 'High effort code & reasoning', score: 72.76, modelId: 'gpt-5-3-codex' },
    { name: 'Gemini 3 Flash Preview', provider: 'Google', description: 'Fast & efficient Gemini 3', score: 71.50, modelId: 'gemini-3-flash' },
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
    const [showMoreModels, setShowMoreModels] = useState(false);
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
                setShowMoreModels(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setShowMoreModels(false);
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
                        className="absolute bottom-full right-0 mb-2 w-[90vw] max-w-[280px] sm:w-[260px] bg-white border border-stone-200 shadow-xl rounded-[18px] overflow-hidden flex flex-col z-[100]"
                    >
                        <AnimatePresence mode="wait">
                            {!showMoreModels ? (
                                /* ── Main Menu ── */
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
                                                                title: 'Noir Pro Feature',
                                                                message: `Model ${model.name} eksklusif untuk pengguna Noir Pro. Tingkatkan akun Anda untuk menikmati kecerdasan tingkat lanjut.`,
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

                                    <div className="h-px bg-stone-100 my-1.5 mx-4" />

                                    {/* More Models Button */}
                                    <button
                                        onClick={() => setShowMoreModels(true)}
                                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-stone-50 transition-colors text-left"
                                    >
                                        <span className="text-[14px] text-stone-700 font-medium">More models</span>
                                        <ChevronRight size={16} className="text-stone-400" />
                                    </button>
                                </motion.div>
                            ) : (
                                /* ── More Models Submenu ── */
                                <motion.div
                                    key="more"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.12 }}
                                    className="flex flex-col w-full"
                                >
                                    {/* Header */}
                                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-stone-100">
                                        <button
                                            onClick={() => setShowMoreModels(false)}
                                            className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                                        >
                                            <ChevronLeft size={15} />
                                        </button>
                                        <span className="text-[13px] font-semibold text-stone-700">More Models</span>
                                    </div>

                                    {/* Scrollable list */}
                                    <div className="overflow-y-auto max-h-[350px]">
                                        {/* Free Models Section */}
                                        <div className="px-3 py-1.5 bg-green-50/50 border-b border-green-100">
                                            <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Free Models</span>
                                        </div>
                                        {FREE_MODELS.map((model, i) => (
                                            <button
                                                key={`free-${i}`}
                                                onClick={() => {
                                                    onModelChange(model.modelId as ModelType);
                                                    handleClose();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors text-left"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[13px] text-stone-900 font-medium leading-tight">{model.name}</span>
                                                        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full border shrink-0", PROVIDER_COLORS[model.provider])}>
                                                            {model.provider}
                                                        </span>
                                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 bg-green-50 text-green-700 border-green-200">Free</span>
                                                    </div>
                                                    <span className="text-[11px] text-stone-400 mt-0.5 block truncate">{model.description}</span>
                                                </div>
                                            </button>
                                        ))}

                                        {/* Pro Models Section */}
                                        <div className="px-3 py-1.5 bg-blue-50/50 border-b border-t border-blue-100 mt-1">
                                            <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Pro Models</span>
                                        </div>
                                        {PRO_MODELS.map((model, i) => (
                                            <button
                                                key={`pro-${i}`}
                                                onClick={() => {
                                                    if (!isSubscribed) {
                                                        setAlertConfig({
                                                            isOpen: true,
                                                            title: 'Noir Pro Feature',
                                                            message: `Model ${model.name} eksklusif untuk pengguna Noir Pro. Tingkatkan akun Anda untuk mengakses model-model terbaik di dunia.`,
                                                            type: 'upgrade'
                                                        });
                                                        return;
                                                    }
                                                    handleClose();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors text-left"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[13px] text-stone-900 font-medium leading-tight">{model.name}</span>
                                                        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full border shrink-0", PROVIDER_COLORS[model.provider])}>
                                                            {model.provider}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-stone-400 mt-0.5 block truncate">{model.description}</span>
                                                </div>
                                                {!isSubscribed && <Lock size={12} className="text-stone-300 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Upgrade CTA */}
                                    {!isSubscribed && (
                                        <div className="border-t border-stone-100 p-3">
                                            <button
                                                onClick={() => { window.location.href = '/subscription'; }}
                                                className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
                                            >
                                                Upgrade to Pro
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
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

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, StopCircle, RefreshCw, Copy, Check, Info, Download, Share2 } from 'lucide-react';
import StreamingResponse from './ui/StreamingResponse';
import StreamingLoader from './ui/StreamingLoader';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import { cn, getApiUrl } from '@/lib/utils';

interface RedesignWelcomeProps {
    prompt?: string;
    featureType?: string;
    onBack?: () => void;
    className?: string;
}

export function RedesignWelcome({ prompt: initialPrompt, featureType, onBack, className }: RedesignWelcomeProps) {
    const [content, setContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [minLoaderVisible, setMinLoaderVisible] = useState(false); // Force loader visibility
    const [error, setError] = useState<string | null>(null);
    const [hasStarted, setHasStarted] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Feature configurations
    const getFeatureConfig = (type?: string) => {
        switch (type) {
            case 'Slide Presentation': return { icon: <Sparkles className="text-orange-500" />, color: 'orange', title: 'Presentation Generator' };
            case 'Mindmap Generator': return { icon: <Sparkles className="text-blue-500" />, color: 'blue', title: 'Mindmap Creator' };
            case 'Article Writer': return { icon: <Sparkles className="text-purple-500" />, color: 'purple', title: 'Article Writer' };
            case 'Strategy Planner': return { icon: <Sparkles className="text-red-500" />, color: 'red', title: 'Strategic Planner' };
            default: return { icon: <Sparkles className="text-zinc-500" />, color: 'zinc', title: 'AI Assistant' };
        }
    };

    const config = getFeatureConfig(featureType);

    useEffect(() => {
        if (initialPrompt && !hasStarted) {
            handleGenerate(initialPrompt);
        }
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [initialPrompt]);

    const handleGenerate = async (query: string) => {
        // Fix: Abort previous request if exists to prevent duplicate streams
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setHasStarted(true);
        setIsStreaming(true);
        setMinLoaderVisible(true);
        setTimeout(() => setMinLoaderVisible(false), 2500); // Loader visible for at least 2.5s

        setContent('');
        setError(null);

        const apiUrl = getApiUrl();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch(`${apiUrl}/api/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are an expert for ${featureType}. Provide a high-quality, comprehensive response.` },
                        { role: 'user', content: query }
                    ],
                    model: (() => {
                        const claudeFeatures = ['Slide Presentation', 'Mindmap Generator', 'Article Writer', 'Strategy Planner'];
                        if (claudeFeatures.includes(featureType)) {
                            return 'claude-sonnet-4-5';
                        }
                        // Default fallback
                        return 'gemini-pro';
                    })(),
                    stream: true
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) throw new Error('Failed to connect to AI');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.content || parsed.choices?.[0]?.delta?.content || '';
                            setContent(prev => prev + delta);
                        } catch (e) {
                            // Ignore parsing errors for non-JSON lines or empty chunks
                        }
                    }
                    // Fallback for non-SSE raw streaming endpoints
                    else if (line.trim() !== '') {
                        // Careful not to append raw JSON strings
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.content) setContent(prev => prev + parsed.content);
                        } catch {
                            // Ignore raw lines if they aren't content
                        }
                    }
                }
            }

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message || 'Generation failed');
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsStreaming(false);
        }
    };

    return (
        <div className={cn("w-full h-full flex flex-col items-center pt-20 pb-10 px-4 md:px-8 max-w-5xl mx-auto", className)}>

            {/* Header */}
            <div className="w-full flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors font-medium border border-transparent hover:border-zinc-200"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>

                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full shadow-sm">
                    {config.icon}
                    <span className="font-semibold text-zinc-900">{config.title}</span>
                </div>

                <div className="w-[88px]" /> {/* Spacer for centering */}
            </div>

            {/* Content Area */}
            <div className="w-full flex-1 min-h-0 bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex flex-col relative">

                {/* Prompt Display */}
                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <h2 className="text-xl font-semibold text-zinc-800 leading-snug">{initialPrompt}</h2>
                </div>

                {/* Streaming Output */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
                            <Info size={32} />
                            <p className="font-medium">{error}</p>
                            <button onClick={() => initialPrompt && handleGenerate(initialPrompt)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm mt-2 hover:bg-red-100">Try Again</button>
                        </div>
                    ) : (
                        (isStreaming && (!content.trim() || minLoaderVisible)) ? (
                            <StreamingLoader />
                        ) : (
                            <StreamingResponse content={content} isStreaming={isStreaming} />
                        )
                    )}

                    {/* Dummy element for scroll to bottom? StreamingResponse usually handles it or parent */}
                </div>

                {/* Status / Actions Bar */}
                <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        {isStreaming ? (
                            <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                </span>
                                Generating...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                                <Check size={16} />
                                Completed
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {isStreaming && (
                            <button onClick={handleStop} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm transition-colors">
                                <StopCircle size={16} />
                                Stop
                            </button>
                        )}
                        {!isStreaming && (
                            <>
                                <button
                                    className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                    title="Copy (Clean Text)"
                                    onClick={() => {
                                        // Strip Markdown *, ** and # from text for clean copy
                                        const cleanText = content
                                            .replace(/\*\*/g, '') // Bold
                                            .replace(/\*/g, '')   // Italic/List
                                            .replace(/^#+\s/gm, '') // Headers
                                            .replace(/`/g, '');   // Code ticks
                                        navigator.clipboard.writeText(cleanText);
                                    }}
                                >
                                    <Copy size={18} />
                                </button>
                                <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors" title="Download">
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={() => initialPrompt && handleGenerate(initialPrompt)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-sm transition-all"
                                >
                                    <RefreshCw size={16} />
                                    Regenerate
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

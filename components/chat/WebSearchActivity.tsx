import React, { useEffect, useState, useRef } from 'react';
import { Globe, Search, ArrowRight, Check, Loader2, Sparkles, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { aiEventManager, ActivityLog, Source } from '@/lib/AIEventManager';

interface WebSearchActivityProps {
    isActive: boolean;
    streamId?: string; // ID to link events
    onSourceClick?: (source: Source) => void;
}

export function WebSearchActivity({ isActive, streamId, onSourceClick }: WebSearchActivityProps) {
    const [events, setEvents] = useState<ActivityLog[]>([]);
    const [status, setStatus] = useState<'searching' | 'analyzing' | 'generating' | 'done'>('searching');
    const [sources, setSources] = useState<Source[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Subscribe to AI Event Manager
    useEffect(() => {
        if (!isActive) return;

        // Reset state on activation
        setEvents([]);
        setSources([]);
        setStatus('searching');

        const unsubscribe = aiEventManager.subscribe((event) => {
            if (event.type === 'status_change') {
                setStatus(event.payload);
            } else if (event.type === 'log_activity') {
                setEvents(prev => [...prev, { ...event.payload, timestamp: Date.now() }]);
            } else if (event.type === 'source_found') {
                setSources(prev => [...prev, event.payload]);
            }
        });

        return () => unsubscribe();
    }, [isActive, streamId]);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events, status]);

    if (!isActive && events.length === 0) return null;

    return (
        <div className="w-full max-w-3xl mx-auto my-4 font-sans">
            <motion.div
                layout // Enable layout animation for smooth height changes
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "rounded-xl border border-white/20 overflow-hidden backdrop-blur-md transition-colors duration-500",
                    status === 'done' ? "bg-white/5 border-transparent" : "bg-white/40 shadow-xl ring-1 ring-blue-500/10"
                )}
            >
                {/* Header Section */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-white/30">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            status === 'searching' ? "bg-blue-100 text-blue-600" :
                                status === 'analyzing' ? "bg-purple-100 text-purple-600" :
                                    "bg-green-100 text-green-600"
                        )}>
                            {status === 'searching' && <Search size={16} className="animate-pulse" />}
                            {status === 'analyzing' && <Sparkles size={16} className="animate-pulse" />}
                            {status === 'generating' || status === 'done' ? <Check size={16} /> : null}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-zinc-800">
                                {status === 'searching' && "Searching the web..."}
                                {status === 'analyzing' && "Analyzing sources..."}
                                {(status === 'generating' || status === 'done') && "Research Complete"}
                            </span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <Globe size={10} />
                                {status === 'done'
                                    ? `Found ${sources.length} sources`
                                    : "Live Activity"}
                            </span>
                        </div>
                    </div>
                    {/* Status Pill */}
                    <div className="px-2 py-1 rounded-full bg-white/50 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {status}
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">

                    {/* Activity Feed */}
                    <div className="flex-1 p-4 min-h-[120px] max-h-[200px] overflow-y-auto scrollbar-none space-y-3" ref={scrollRef}>
                        <AnimatePresence mode="popLayout">
                            {events.map((event, idx) => (
                                <motion.div
                                    key={event.id || idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="mt-1 relative">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                        {idx !== events.length - 1 && (
                                            <div className="absolute top-2 left-0.5 w-0.5 h-full bg-zinc-200 -z-10" />
                                        )}
                                    </div>
                                    <span className="text-sm text-zinc-600 leading-snug">
                                        {event.message}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Scanning Indicator */}
                        {status !== 'done' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 pl-4 py-1"
                            >
                                <span className="w-1 h-3 bg-blue-500 animate-[pulse_1s_ease-in-out_infinite]" />
                                <span className="w-1 h-3 bg-blue-500 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
                                <span className="w-1 h-3 bg-blue-500 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
                            </motion.div>
                        )}
                    </div>

                    {/* Sources Panel */}
                    {(sources.length > 0 || status === 'analyzing') && (
                        <div className="w-full md:w-64 bg-zinc-50/50 p-4 flex flex-col gap-2">
                            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                                Sources
                            </div>
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {sources.map((source, i) => (
                                        <motion.button
                                            key={source.id || i}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={() => onSourceClick && onSourceClick(source)}
                                            className="w-full text-left p-2 rounded-lg bg-white border border-zinc-200 shadow-sm hover:shadow hover:border-blue-300 transition-all flex items-center gap-2 group"
                                        >
                                            <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-500 group-hover:text-blue-600">
                                                <FileText size={12} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-medium text-zinc-800 truncate">{source.domain}</div>
                                                <div className="text-[10px] text-zinc-500 truncate">{source.title}</div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

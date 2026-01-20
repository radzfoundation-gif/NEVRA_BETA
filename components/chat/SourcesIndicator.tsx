import React, { useState, useEffect } from 'react';
import { Globe, Search, ChevronDown, ExternalLink } from 'lucide-react';
import { SearchResult } from '@/lib/webSearch';

interface SourcesIndicatorProps {
    sources: SearchResult[];
    messageId?: string;
}

export const SourcesIndicator = ({ sources, messageId }: SourcesIndicatorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

    // Listen for citation clicks
    useEffect(() => {
        const handleCitationClick = (e: CustomEvent) => {
            if (e.detail.messageId === messageId) {
                setIsOpen(true);
                setHighlightedIndex(e.detail.sourceIndex);

                // Remove highlight after animation
                setTimeout(() => setHighlightedIndex(null), 2000);

                // Scroll to the source
                setTimeout(() => {
                    const sourceEl = document.getElementById(`source-${messageId}-${e.detail.sourceIndex}`);
                    if (sourceEl) {
                        sourceEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        };

        window.addEventListener('citation-click' as any, handleCitationClick);
        return () => window.removeEventListener('citation-click' as any, handleCitationClick);
    }, [messageId]);

    return (
        <div className="mt-2 select-none" id={`sources-container-${messageId}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-zinc-50 border border-zinc-200/60 hover:border-zinc-300 rounded-full transition-all duration-200 group shadow-sm"
            >
                <div className="flex items-center -space-x-2">
                    <div className="w-5 h-5 rounded-full bg-white border border-zinc-100 flex items-center justify-center z-10 shadow-sm">
                        <Globe size={10} className="text-blue-500" />
                    </div>
                    <div className="w-5 h-5 rounded-full bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Search size={8} className="text-orange-600" />
                        </div>
                    </div>
                </div>
                <span className="text-xs font-semibold text-zinc-600 group-hover:text-zinc-900">Sources</span>
                <ChevronDown size={12} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {sources.map((source, idx) => {
                        let hostname = source.url;
                        try { hostname = new URL(source.url).hostname.replace('www.', ''); } catch (e) { }

                        const isHighlighted = highlightedIndex === idx + 1;

                        return (
                            <a
                                key={idx}
                                id={`source-${messageId}-${idx + 1}`}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex flex-col gap-1 p-3 rounded-xl bg-white hover:bg-zinc-50 border transition-all text-left group/card shadow-sm hover:shadow-md ${isHighlighted
                                        ? 'border-indigo-400 ring-2 ring-indigo-200 animate-citation-highlight'
                                        : 'border-zinc-200/50 hover:border-zinc-300'
                                    }`}
                            >
                                <span className="text-xs font-medium text-zinc-900 line-clamp-2 leading-snug group-hover/card:text-blue-600 transition-colors">
                                    {source.title}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-auto pt-1">
                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${isHighlighted ? 'bg-indigo-500' : 'bg-zinc-100'
                                        }`}>
                                        <span className={`text-[9px] font-bold ${isHighlighted ? 'text-white' : 'text-zinc-400'}`}>{idx + 1}</span>
                                    </div>
                                    <span className="truncate max-w-[120px]">{hostname}</span>
                                    <ExternalLink size={8} className="opacity-0 group-hover/card:opacity-100 transition-opacity ml-auto" />
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

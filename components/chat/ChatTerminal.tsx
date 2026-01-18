import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ChatTerminalProps {
    isOpen: boolean;
    onToggle: (isOpen: boolean) => void;
    logs: string[];
    onClear: () => void;
}

const ChatTerminal: React.FC<ChatTerminalProps> = ({ isOpen, onToggle, logs, onClear }) => {
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (isOpen && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);

    return (
        <div className={cn("border-t border-white/5 bg-gradient-to-t from-[#0a0a0a] to-[#0c0c0c] transition-all duration-300 flex flex-col absolute bottom-0 left-0 right-0 z-40 shadow-2xl backdrop-blur-xl", isOpen ? "h-72" : "h-10")}>
            <div
                className="h-10 flex items-center px-4 gap-3 cursor-pointer hover:bg-white/5 border-b border-white/5 bg-gradient-to-r from-[#111] to-[#0f0f0f] transition-colors"
                onClick={() => onToggle(!isOpen)}
            >
                <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                    <TerminalIcon size={12} className="text-purple-400" />
                </div>
                <span className="text-xs font-mono font-semibold text-gray-300">Terminal</span>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                    {isOpen && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                            className="text-[10px] font-medium text-gray-500 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                    <ChevronDown size={14} className={cn("text-gray-500 transition-transform duration-300", isOpen ? "" : "rotate-180")} />
                </div>
            </div>
            {isOpen && (
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 bg-[#0a0a0a] scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                    {logs.length === 0 ? (
                        <div className="text-gray-600 text-center py-8">No logs yet...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="text-gray-400 border-b border-white/5 pb-1 mb-1 last:border-0 leading-relaxed">
                                <span className="text-purple-400/60">$</span> {log}
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                    <div className="flex items-center gap-2 text-gray-500 pt-3 mt-2 border-t border-white/5">
                        <span className="text-green-400 font-bold">➜</span>
                        <span className="text-blue-400">~</span>
                        <span className="animate-pulse text-gray-400">_</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatTerminal;

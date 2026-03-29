import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult } from '@/lib/webSearch';

// ─── Visual Favicon Grid (Sequential Pop-In) ───
const FaviconGrid: React.FC<{ sources: SearchResult[] }> = ({ sources }) => {
    return (
        <div className="flex flex-wrap gap-2 mt-1 justify-start items-center min-h-[40px]">
            {sources.map((source, i) => {
                let domain = '';
                try {
                    domain = new URL(source.url).hostname.replace('www.', '');
                } catch (e) {
                    domain = source.url;
                }
                
                return (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ 
                            delay: i * 0.15, 
                            type: 'spring', 
                            stiffness: 260, 
                            damping: 15 
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-200 shadow-sm flex items-center justify-center p-1.5 relative group"
                    >
                        {/* Discovery Ping Effect */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ delay: i * 0.15, duration: 0.8, ease: "easeOut" }}
                            className="absolute inset-0 rounded-lg bg-indigo-400/20 z-0 pointer-events-none"
                        />
                        
                        <img 
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                            alt={domain}
                            className="w-full h-full object-contain relative z-10"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
                            }}
                        />
                        
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-stone-800 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {domain}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// ─── Perfect Pixel Planet Agent (Matching Image Reference) ───
const AgentCircle: React.FC<{ colors: string[]; delay: number; isActive?: boolean }> = ({ colors, delay, isActive }) => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setTick(p => p + 1), 150);
        return () => clearInterval(t);
    }, []);

    // 8x8 Grid for more detailed "Pixel Planet" look
    const grid = useMemo(() => {
        const temp = [];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                // Circle masking logic: (x-3.5)^2 + (y-3.5)^2 < 4^2
                const dist = Math.sqrt(Math.pow(x - 3.5, 2) + Math.pow(y - 3.5, 2));
                if (dist < 4.2) {
                    temp.push({ 
                        active: true, 
                        colorIdx: (x + y) % colors.length,
                        opacity: 0.6 + Math.random() * 0.4
                    });
                } else {
                    temp.push({ active: false });
                }
            }
        }
        return temp;
    }, [colors]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -5 }}
            animate={{ 
                opacity: 1, 
                scale: isActive ? 1.05 : 0.95, 
                x: 0,
                filter: isActive ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' : 'none'
            }}
            transition={{ duration: 0.4, delay: delay * 0.08 }}
            className="relative w-6 h-6 rounded-full border-[0.5px] border-white/40 overflow-hidden bg-stone-100 shadow-sm"
            style={{ 
                marginLeft: delay === 0 ? 0 : -8,
                zIndex: 10 - delay,
            }}
        >
            {/* Fine Pixel Grid Texture */}
            <div className="absolute inset-0 grid grid-cols-8 p-[1px]">
                {grid.map((cell, idx) => {
                    if (!cell.active) return <div key={idx} />;
                    
                    // Controlled jitter for "sparkle" effect matching the image
                    const isSparkle = (tick + idx) % 9 === 0;
                    
                    return (
                        <div
                            key={idx}
                            className="w-full h-full transition-colors duration-300"
                            style={{ 
                                backgroundColor: isSparkle ? colors[1] : colors[cell.colorIdx || 0],
                                opacity: cell.active ? (isSparkle && isActive ? 1 : 0.75) : 0,
                                borderRadius: '0.2px'
                            }}
                        />
                    );
                })}
            </div>
            
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
            
            {/* Active Highlight Overlay */}
            {isActive && (
                <motion.div
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-white"
                />
            )}
        </motion.div>
    );
};

interface DeepResearchLoadingProps {
    phase?: 'thinking' | 'searching' | 'synthesizing' | 'answering';
    query?: string;
    searchResults?: SearchResult[];
}

const DeepResearchLoading: React.FC<DeepResearchLoadingProps> = ({ phase = 'thinking', query, searchResults = [] }) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const agents = useMemo(() => [
        { id: 'A1', colors: ['#9333ea', '#db2777', '#f43f5e'] },
        { id: 'A2', colors: ['#db2777', '#e11d48', '#fb7185'] },
        { id: 'A3', colors: ['#ea580c', '#fbbf24', '#f59e0b'] },
        { id: 'A4', colors: ['#7c3aed', '#a855f7', '#d8b4fe'] },
    ], []);

    const getPhaseLabel = () => {
        switch (phase) {
            case 'thinking': return 'Agents thinking';
            case 'searching': return 'Multi-Agent searching...';
            case 'synthesizing': return 'Processing data';
            case 'answering': return 'Generating response';
            default: return 'Researching';
        }
    };

    return (
        <div className="flex flex-col gap-2 max-w-[360px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key="researching"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-2"
                >
                    {/* Compact Horizontal Status Bar (Perfectly Matching Image) */}
                    <div className="flex items-center gap-2.5 py-1 px-1 w-fit">
                        {/* Overlapping Pixelated Circles */}
                        <div className="flex items-center">
                            {agents.map((agent, i) => (
                                <AgentCircle 
                                    key={agent.id} 
                                    colors={agent.colors} 
                                    delay={i} 
                                    isActive={true} 
                                />
                            ))}
                        </div>
                        
                        {/* Status Label & Seconds (Matching Typography) */}
                        <div className="flex items-center gap-1.5 text-stone-500 font-medium text-[13px] tracking-tight">
                            <span>{getPhaseLabel()}</span>
                            <span className="text-stone-300">·</span>
                            <span className="text-stone-400 font-normal">{seconds}s</span>
                        </div>
                    </div>

                    {/* Sequential Website Logos */}
                    {searchResults.length > 0 && (
                        <div className="px-1 mt-0.5 ml-1">
                            <motion.div layout>
                                <FaviconGrid sources={searchResults} />
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default DeepResearchLoading;

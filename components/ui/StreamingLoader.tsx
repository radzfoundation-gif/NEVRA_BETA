import React, { useEffect, useState } from 'react';
import { Loader2, Terminal, Cpu, Sparkles, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function StreamingLoader() {
    const [steps, setSteps] = useState<string[]>([]);

    useEffect(() => {
        const sequence = [
            { text: "Initializing AI context...", delay: 100 },
            { text: "Analyzing request parameters...", delay: 800 },
            { text: "Optimizing response structure...", delay: 1600 },
            { text: "Synthesizing output tokens...", delay: 2400 }
        ];

        let timeouts: NodeJS.Timeout[] = [];

        sequence.forEach(({ text, delay }, index) => {
            const timeout = setTimeout(() => {
                setSteps(prev => [...prev, text]);
            }, delay);
            timeouts.push(timeout);
        });

        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm p-12 min-h-[300px] animate-in fade-in duration-700">

            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative bg-white p-4 rounded-2xl shadow-xl border border-indigo-100 ring-4 ring-indigo-50">
                    <BrainCircuit size={40} className="text-indigo-600 animate-pulse" />
                </div>
            </div>

            <h3 className="text-lg font-semibold text-zinc-800 mb-2">Thinking...</h3>

            <div className="w-full max-w-sm space-y-3">
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3, ease: "easeInOut" }}
                        className="h-full bg-indigo-500 rounded-full"
                    />
                </div>

                {/* Terminal Log */}
                <div className="font-mono text-xs text-zinc-500 space-y-1.5 h-20 overflow-hidden relative">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-indigo-500">➜</span>
                            {step}
                        </motion.div>
                    ))}
                    {/* Fade bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent"></div>
                </div>
            </div>

        </div>
    );
}

export default StreamingLoader;

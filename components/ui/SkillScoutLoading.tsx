import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, Check, Search } from 'lucide-react';


const ScoutGrid = () => {
    return (
        <div className="grid grid-cols-3 gap-[2px] mr-2 rounded-[6px] bg-white/80 px-1.5 py-1 ring-1 ring-orange-200/70 dark:bg-zinc-950/70 dark:ring-orange-500/20">
            {[...Array(9)].map((_, i) => {
                return (
                    <motion.div
                        key={i}
                        className="h-1 w-1 rounded-[1px] bg-orange-500"
                        animate={{
                            opacity: [0.24, 1, 0.34],
                            scale: [0.82, 1.08, 0.92]
                        }}
                        transition={{
                            duration: 1.15,
                            repeat: Infinity,
                            delay: i * 0.055,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                    />
                );
            })}
        </div>
    );
};

interface SkillScoutLoadingProps {

    status?: string | null;
    matchedSkills?: { message: string, categories: string[], tools: string[] } | null;
}

const SkillScoutLoading: React.FC<SkillScoutLoadingProps> = ({ status, matchedSkills }) => {
    return (
        <div className="flex flex-col gap-2.5 py-1 px-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header: Working */}
            <div className="flex items-center text-zinc-600 dark:text-zinc-400 font-medium text-[13px] tracking-tight">
                <ScoutGrid />
                <span>Working</span>
            </div>

            {/* List of skills being scanned */}
            <div className="flex flex-col gap-2 ml-0.5">
                {matchedSkills ? (
                    <div className="space-y-1.5">
                        {matchedSkills.tools.map((tool, i) => (
                            <motion.div
                                key={tool}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400 text-[13px] group"
                            >
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1] }} 
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="flex items-center justify-center w-4 h-4 rounded-full bg-teal-500/10"
                                >
                                    <Check size={10} className="text-teal-500" strokeWidth={3} />
                                </motion.div>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                    Found: <span className="text-teal-600 dark:text-teal-400 font-mono">{tool}</span>
                                </span>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div 
                        className="flex items-center gap-2.5 text-zinc-400 dark:text-zinc-500 text-[12px] italic"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <Search size={14} className="text-orange-500/50" />
                        <span>Searching for available skills...</span>
                    </motion.div>
                )}


                
                {/* Current general status if any */}
                {status && !status.startsWith('Skill Scout') && (
                     <div className="flex items-center gap-2.5 text-zinc-400 text-[12px] mt-0.5">
                        <Zap size={14} className="text-amber-500/50" />
                        <span>{status}</span>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SkillScoutLoading;

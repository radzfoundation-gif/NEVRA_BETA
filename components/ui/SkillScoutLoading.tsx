import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, Check, Search } from 'lucide-react';


/**
 * 5x5 Animated Grid Icon
 */
const ScoutGrid = () => {
    return (
        <div className="grid grid-cols-5 gap-0.5 w-4 h-4 mr-2 relative">
            {[...Array(25)].map((_, i) => {
                const row = Math.floor(i / 5);
                const col = i % 5;
                const distance = Math.sqrt(Math.pow(row - 2, 2) + Math.pow(col - 2, 2));
                
                return (
                    <motion.div
                        key={i}
                        className="w-0.5 h-0.5 rounded-full bg-orange-500/80 dark:bg-orange-400"
                        animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.8, 1.5, 0.8],
                            backgroundColor: ["#f97316", "#14b8a6", "#f97316"]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: distance * 0.15,
                            ease: "easeInOut"
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

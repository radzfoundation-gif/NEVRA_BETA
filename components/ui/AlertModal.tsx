import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Sparkles, Construction } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'development' | 'upgrade';
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type = 'development' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-sm bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border border-stone-100"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                    type === 'development' ? "bg-amber-50 text-amber-600" : 
                                    type === 'upgrade' ? "bg-purple-50 text-purple-600" : 
                                    "bg-blue-50 text-blue-600"
                                )}>
                                    {type === 'development' ? <Construction size={22} strokeWidth={1.5} /> : 
                                     type === 'upgrade' ? <Sparkles size={22} strokeWidth={1.5} /> : 
                                     <Info size={22} strokeWidth={1.5} />}
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
                            <p className="text-stone-500 text-[14px] leading-relaxed mb-6">
                                {message}
                            </p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className={cn(
                                        "flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm",
                                        type === 'upgrade' 
                                            ? "bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shadow-purple-200" 
                                            : "bg-stone-900 text-white hover:bg-stone-800 active:scale-95"
                                    )}
                                >
                                    {type === 'upgrade' ? 'Upgrade Now' : 'Got it'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AlertModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Command, Keyboard, Layout, MessageSquare, Settings, Code, Grid3x3 } from 'lucide-react';
import { SHORTCUTS, Shortcut, getShortcutsByCategory, searchShortcuts } from '@/lib/shortcuts';
import clsx from 'clsx';

interface ShortcutBrowserProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = [
    { id: 'all', name: 'All', icon: Grid3x3 },
    { id: 'general', name: 'General', icon: Settings },
    { id: 'navigation', name: 'Navigation', icon: Layout },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
    { id: 'editor', name: 'Editor', icon: Code },
];

const ShortcutBrowser: React.FC<ShortcutBrowserProps> = ({ isOpen, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const filteredShortcuts = searchQuery
        ? searchShortcuts(searchQuery)
        : getShortcutsByCategory(selectedCategory);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                    <Keyboard size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Keyboard Shortcuts</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Master the workflow with these quick commands</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search and Categories */}
                        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search commands..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                                    autoFocus
                                />
                            </div>

                            {/* Categories */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon;
                                    const isSelected = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSelectedCategory(cat.id);
                                                setSearchQuery('');
                                            }}
                                            className={clsx(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                                                isSelected
                                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                                                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                                            )}
                                        >
                                            <Icon size={16} />
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Shortcuts Grid */}
                        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-black/20">
                            {filteredShortcuts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-50">
                                    <Keyboard size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
                                    <p className="text-zinc-400 dark:text-zinc-500">No shortcuts found matching your search</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredShortcuts.map((shortcut) => {
                                        const CategoryIcon = CATEGORIES.find(c => c.id === shortcut.category)?.icon || Command;
                                        return (
                                            <div
                                                key={shortcut.id}
                                                className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-purple-300 dark:hover:border-purple-700/50 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                        <CategoryIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{shortcut.description}</h3>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-500 capitalize">{shortcut.category}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, index) => (
                                                        <React.Fragment key={index}>
                                                            {index > 0 && <span className="text-zinc-300 dark:text-zinc-700 text-xs px-1">+</span>}
                                                            <kbd className="h-7 min-w-[28px] px-2 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-700 rounded text-xs font-semibold text-zinc-600 dark:text-zinc-300 font-mono">
                                                                {key}
                                                            </kbd>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center text-xs text-zinc-400">
                            <p>Type <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">?</kbd> anywhere to open specific help</p>
                            <p>{filteredShortcuts.length} commands available</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShortcutBrowser;

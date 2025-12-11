import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Grid3x3, Sparkles, Layout, Code, Smartphone, Eye, Download } from 'lucide-react';
import { Component, getComponentLibrary } from '@/lib/componentLibrary';
import ComponentCard from './ComponentCard';
import clsx from 'clsx';

interface ComponentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (component: Component) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Grid3x3 },
  { id: 'button', name: 'Buttons', icon: Sparkles },
  { id: 'form', name: 'Forms', icon: Layout },
  { id: 'card', name: 'Cards', icon: Code },
  { id: 'navigation', name: 'Navigation', icon: Smartphone },
  { id: 'layout', name: 'Layout', icon: Grid3x3 },
  { id: 'modal', name: 'Modals', icon: Eye },
];

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  isOpen,
  onClose,
  onSelectComponent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [components, setComponents] = useState<Component[]>([]);
  const [previewComponent, setPreviewComponent] = useState<Component | null>(null);
  const library = getComponentLibrary();

  useEffect(() => {
    if (isOpen) {
      // Load components from library
      const allComponents = library.getAllComponents();
      setComponents(allComponents);
    }
  }, [isOpen]);

  const filteredComponents = React.useMemo(() => {
    let filtered = components;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(comp => comp.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = library.searchComponents(searchQuery);
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(comp => comp.category === selectedCategory);
      }
    }

    return filtered;
  }, [components, selectedCategory, searchQuery, library]);

  const handleUseComponent = (component: Component) => {
    library.incrementUsage(component.id);
    library.save();
    onSelectComponent(component);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Component Library</h2>
              <p className="text-sm text-gray-400">Browse and use reusable components</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search and Categories */}
          <div className="p-6 border-b border-white/10 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSearchQuery('');
                    }}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                      selectedCategory === cat.id
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                    )}
                  >
                    <Icon size={16} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Components Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredComponents.length === 0 ? (
              <div className="text-center py-12">
                <Code size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-2">No components found</p>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'Try a different search term' : 'Components will appear here once added'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    onPreview={setPreviewComponent}
                    onUse={handleUseComponent}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/5 text-center">
            <p className="text-xs text-gray-500">
              {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewComponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setPreviewComponent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-bold text-white">{previewComponent.name}</h3>
                  <p className="text-sm text-gray-400">{previewComponent.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUseComponent(previewComponent)}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Use Component
                  </button>
                  <button
                    onClick={() => setPreviewComponent(null)}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Code Preview */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Code</h4>
                    <pre className="p-4 bg-[#0a0a0a] border border-white/10 rounded-lg overflow-x-auto">
                      <code className="text-xs text-gray-300 font-mono">
                        {previewComponent.code}
                      </code>
                    </pre>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewComponent.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-white/5 text-xs text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ComponentLibrary;

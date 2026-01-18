import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Sparkles, Layout, Code, Smartphone, Grid3x3 } from 'lucide-react';
import { TEMPLATES, Template, getTemplatesByCategory, searchTemplates, getFeaturedTemplates } from '@/lib/templates';
import clsx from 'clsx';

interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Grid3x3 },
  { id: 'landing', name: 'Landing Pages', icon: Layout },
  { id: 'dashboard', name: 'Dashboards', icon: Code },
  { id: 'component', name: 'Components', icon: Sparkles },
  { id: 'app', name: 'Apps', icon: Smartphone },
];

const TemplateBrowser: React.FC<TemplateBrowserProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : getTemplatesByCategory(selectedCategory);

  const handleTemplateSelect = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-6xl max-h-[90vh] bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-1">Template Library</h2>
            <p className="text-sm text-zinc-500">Choose a template to get started</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Categories */}
        <div className="p-6 border-b border-zinc-200 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-purple-300 transition-colors"
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
                      ? "bg-purple-50 text-purple-600 border border-purple-200"
                      : "bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-200"
                  )}
                >
                  <Icon size={16} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const CategoryIcon = CATEGORIES.find(c => c.id === template.category)?.icon || Grid3x3;
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setHoveredTemplate(template.id)}
                    onHoverEnd={() => setHoveredTemplate(null)}
                    onClick={() => handleTemplateSelect(template)}
                    className={clsx(
                      "relative p-6 bg-white border border-zinc-200 rounded-xl cursor-pointer transition-all",
                      hoveredTemplate === template.id && "border-purple-300 shadow-md ring-1 ring-purple-100"
                    )}
                  >
                    {template.featured && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded-full border border-purple-200">
                        Featured
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                        <CategoryIcon size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-zinc-900 font-semibold">{template.name}</h3>
                        <p className="text-xs text-zinc-500 capitalize">{template.category}</p>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{template.description}</p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-zinc-100 text-xs text-zinc-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-purple-600 font-medium">
                      <span>Use Template</span>
                      <span>→</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-center">
          <p className="text-xs text-zinc-500">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TemplateBrowser;

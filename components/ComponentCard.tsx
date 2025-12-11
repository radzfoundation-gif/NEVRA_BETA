import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Code, Download, User, TrendingUp } from 'lucide-react';
import { Component } from '@/lib/componentLibrary';
import clsx from 'clsx';

interface ComponentCardProps {
  component: Component;
  onPreview?: (component: Component) => void;
  onUse?: (component: Component) => void;
  className?: string;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  onPreview,
  onUse,
  className,
}) => {
  const categoryColors: { [key: string]: string } = {
    button: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    form: 'bg-green-500/20 text-green-400 border-green-500/30',
    card: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    navigation: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    layout: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    modal: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={clsx(
        "relative p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer transition-all group",
        className
      )}
      onClick={() => onPreview?.(component)}
    >
      {/* Category Badge */}
      <div className={clsx(
        "absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full border",
        categoryColors[component.category] || categoryColors.other
      )}>
        {component.category}
      </div>

      {/* Preview Image or Placeholder */}
      <div className="w-full h-32 bg-white/5 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {component.preview ? (
          <img
            src={component.preview}
            alt={component.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Code size={32} className="text-gray-600" />
        )}
      </div>

      {/* Component Info */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-sm line-clamp-1">
          {component.name}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2">
          {component.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {component.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-white/5 text-xs text-gray-500 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {component.authorName && (
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>{component.authorName}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <TrendingUp size={12} />
              <span>{component.usageCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
        {onPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(component);
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Eye size={14} />
            Preview
          </button>
        )}
        {onUse && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUse(component);
            }}
            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            Use
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ComponentCard;

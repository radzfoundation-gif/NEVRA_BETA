import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Brain, Check, Lock, AlertCircle, Sparkles, Zap, Crown } from 'lucide-react';
import { AIProvider, isModelAllowed, isProOnlyModel, MODEL_DISPLAY_NAMES } from '@/lib/ai';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface ProviderSelectorProps {
  value: AIProvider;
  onChange: (value: AIProvider) => void;
  className?: string;
  isSubscribed?: boolean;
  onUpgradeClick?: () => void;
}

// Provider definitions with Pro badges
const providers: {
  id: AIProvider;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  isPro: boolean;
  description?: string;
}[] = [
    { id: 'groq', name: 'Gemini Flash Lite', icon: Zap, color: 'text-orange-500', isPro: false, description: 'Fast & Free' },
    { id: 'openai', name: 'GPT-4o / GPT-5', icon: Brain, color: 'text-green-400', isPro: true, description: 'Most Capable' },
    { id: 'anthropic', name: 'Claude Opus 4.5', icon: Sparkles, color: 'text-purple-400', isPro: true, description: 'Best Reasoning' },
    { id: 'gemini', name: 'Gemini 3 Pro', icon: Zap, color: 'text-blue-400', isPro: true, description: 'Google Latest' },
    { id: 'deepseek', name: 'DeepSeek V3', icon: Zap, color: 'text-cyan-400', isPro: true, description: 'Code Specialist' },
  ];

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  value,
  onChange,
  className,
  isSubscribed = false,
  onUpgradeClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProvider = providers.find(p => p.id === value) || providers[0];
  const userTier = isSubscribed ? 'pro' : 'free';

  // Check if provider is locked for current user
  const isProviderLocked = (provider: typeof providers[0]) => {
    if (isSubscribed) return false;
    return provider.isPro;
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProviderClick = (provider: typeof providers[0]) => {
    if (isProviderLocked(provider)) {
      // Show upgrade prompt
      if (onUpgradeClick) {
        onUpgradeClick();
      } else {
        // Navigate to pricing if no handler provided
        window.location.href = '/pricing';
      }
      return;
    }
    onChange(provider.id);
    setIsOpen(false);
  };

  const isCompact = className?.includes('text-[10px]') || className?.includes('text-xs');

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-300 rounded-full transition-all justify-between",
          isCompact
            ? "gap-1 px-2 py-0.5 min-w-[70px]"
            : "gap-2 px-3 py-1.5 min-w-[100px]"
        )}
      >
        <div className={cn("flex items-center", isCompact ? "gap-1" : "gap-2")}>
          <selectedProvider.icon size={isCompact ? 10 : 12} className={selectedProvider.color} />
          <span className={cn(isCompact ? "text-[10px]" : "text-xs")}>{selectedProvider.name}</span>
          {selectedProvider.isPro && isSubscribed && (
            <Crown size={10} className="text-amber-400" />
          )}
        </div>
        <ChevronDown size={isCompact ? 10 : 12} className={cn("text-gray-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full right-0 mb-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-xl"
          >
            <div className="p-1 space-y-0.5">
              {/* Free Tier Label */}
              <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wide">Free</div>

              {/* Free model */}
              {providers.filter(p => !p.isPro).map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderClick(provider)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-left transition-colors",
                    value === provider.id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                >
                  <div className={cn("p-1.5 rounded-md bg-black/50 flex items-center justify-center", value === provider.id ? "bg-white/10" : "")}>
                    <provider.icon size={14} className={provider.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-[10px] text-gray-500">{provider.description}</div>
                  </div>
                  {value === provider.id && <Check size={12} className="text-purple-400 shrink-0" />}
                </button>
              ))}

              {/* Pro Tier Label */}
              <div className="px-3 py-1 text-[10px] text-amber-400/70 uppercase tracking-wide flex items-center gap-1 mt-2">
                <Crown size={10} /> Pro Models
              </div>

              {/* Pro models */}
              {providers.filter(p => p.isPro).map((provider) => {
                const isLocked = isProviderLocked(provider);

                return (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderClick(provider)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-left transition-colors relative",
                      value === provider.id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
                      isLocked && "opacity-60"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-md bg-black/50 flex items-center justify-center", value === provider.id ? "bg-white/10" : "")}>
                      <provider.icon size={14} className={provider.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-1.5">
                        {provider.name}
                        {isLocked && (
                          <span className="px-1 py-0.5 text-[8px] bg-amber-500/20 text-amber-400 rounded uppercase">PRO</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">{provider.description}</div>
                    </div>
                    {isLocked ? (
                      <Lock size={12} className="text-gray-500 shrink-0" />
                    ) : (
                      value === provider.id && <Check size={12} className="text-purple-400 shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Upgrade CTA for free users */}
              {!isSubscribed && (
                <div className="p-2 mt-1 border-t border-white/5">
                  <button
                    onClick={() => onUpgradeClick ? onUpgradeClick() : (window.location.href = '/pricing')}
                    className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Crown size={12} />
                    Upgrade to Pro - $3/month
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProviderSelector;

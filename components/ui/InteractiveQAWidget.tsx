import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight, CornerDownRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InteractiveQAWidgetProps {
  question: string;
  options: string[];
  onSelect: (selected: string) => void;
  onSkip?: () => void;
  allowCustomInput?: boolean;
}

const InteractiveQAWidget: React.FC<InteractiveQAWidgetProps> = ({
  question,
  options,
  onSelect,
  onSkip,
  allowCustomInput = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [customInput, setCustomInput] = useState('');
  const [isDismissing, setIsDismissing] = useState(false);
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDismissing) return;
      
      // Don't intercept arrow keys if typed in the custom input, unless it's empty
      if (document.activeElement === inputRef.current && customInput.length > 0) {
        if (e.key === 'Enter') {
          handleSelect(customInput);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < options.length) {
            handleSelect(options[selectedIndex]);
          } else if (inputRef.current === document.activeElement && customInput.trim()) {
            handleSelect(customInput.trim());
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (onSkip) handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, options, customInput, isDismissing, onSkip]);

  // Focus management
  useEffect(() => {
    if (selectedIndex === -1 && allowCustomInput && inputRef.current) {
      // Auto-focus input if custom input is allowed and nothing else is selected
      // Removed auto-focus to prevent stealing focus from main chat input
    }
  }, [selectedIndex, allowCustomInput]);

  const handleSelect = (option: string) => {
    if (isDismissing) return;
    
    setSelectedOptionText(option);
    setIsDismissing(true);
    
    // Brief delay to show checkmark animation before hiding
    setTimeout(() => {
      onSelect(option);
    }, 400);
  };

  const handleSkip = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setTimeout(() => {
      if (onSkip) onSkip();
    }, 300);
  };

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="my-4 w-full max-w-xl mx-auto bg-white border border-stone-200/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] rounded-xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="bg-stone-50/80 px-4 py-3 border-b border-stone-100 flex items-start gap-3">
            <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-medium text-xs">?</span>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-stone-800 leading-snug">
                Clarification Needed
              </h4>
              <p className="text-[13px] text-stone-600 mt-0.5 leading-relaxed">
                {question}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="p-2 space-y-1">
            {options.map((option, idx) => {
              const isActive = selectedIndex === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 flex items-center justify-between group",
                    isActive 
                      ? "bg-blue-50/60 text-blue-700 border border-blue-200/60 shadow-sm" 
                      : "bg-transparent text-stone-700 border border-transparent hover:bg-stone-50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-medium transition-colors",
                      isActive ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-500"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="leading-snug pr-4">{option}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="choice-indicator"
                      className="text-blue-600 pr-1"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <CornerDownRight size={14} strokeWidth={2} />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Optional Footer (Custom Input / Skip) */}
          {(allowCustomInput || onSkip) && (
            <div className="px-3 pb-3 pt-1 flex items-center gap-2">
              {allowCustomInput && (
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onFocus={() => setSelectedIndex(-1)}
                    placeholder="Something else..."
                    className="w-full text-[13px] text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-stone-400 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customInput.trim()) {
                        e.preventDefault();
                        handleSelect(customInput.trim());
                      }
                    }}
                  />
                  <AnimatePresence>
                    {customInput.trim().length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => handleSelect(customInput.trim())}
                        className="absolute right-1.5 top-1.5 bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <ArrowRight size={12} strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {onSkip && (
                <button
                  onClick={handleSkip}
                  className="px-3 py-2 text-[12px] font-medium text-stone-500 hover:text-stone-800 transition-colors shrink-0"
                >
                  Skip
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Selected State Animation */}
      {isDismissing && selectedOptionText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="my-4 self-start bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2 shadow-sm font-medium"
        >
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          {selectedOptionText}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InteractiveQAWidget;

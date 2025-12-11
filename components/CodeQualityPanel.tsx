import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Wrench,
  FileCode
} from 'lucide-react';
import { TypeError } from '@/lib/typescript';
import { LintError } from '@/lib/eslint';
import clsx from 'clsx';

interface CodeQualityPanelProps {
  typescriptErrors: TypeError[];
  lintErrors: LintError[];
  onFixAll?: () => void;
  onRefresh?: () => void;
  className?: string;
}

const CodeQualityPanel: React.FC<CodeQualityPanelProps> = ({
  typescriptErrors,
  lintErrors,
  onFixAll,
  onRefresh,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'typescript' | 'lint'>('lint');

  const allErrors = [...typescriptErrors, ...lintErrors];
  const errorCount = allErrors.filter(e => e.severity === 'error').length;
  const warningCount = allErrors.filter(e => e.severity === 'warning').length;
  const fixableCount = lintErrors.filter(e => e.fixable).length;

  if (allErrors.length === 0) {
    return (
      <div className={clsx("bg-green-500/10 border border-green-500/30 rounded-lg p-4", className)}>
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle2 size={16} />
          <span className="text-sm font-medium">No issues found</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileCode size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-white">Code Quality</span>
          {errorCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onFixAll && fixableCount > 0 && (
            <button
              onClick={onFixAll}
              className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs transition-colors"
              title={`Fix ${fixableCount} auto-fixable issues`}
            >
              <Wrench size={12} />
              Fix All
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className="text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('typescript')}
          className={clsx(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === 'typescript'
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          )}
        >
          TypeScript ({typescriptErrors.length})
        </button>
        <button
          onClick={() => setActiveTab('lint')}
          className={clsx(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === 'lint'
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          )}
        >
          ESLint ({lintErrors.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-3 space-y-2">
              {activeTab === 'typescript' && typescriptErrors.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No TypeScript errors
                </div>
              )}
              {activeTab === 'typescript' && typescriptErrors.map((error, index) => (
                <div
                  key={index}
                  className={clsx(
                    "flex items-start gap-2 p-2 rounded text-sm",
                    error.severity === 'error' ? "bg-red-500/10 border border-red-500/20" : "bg-yellow-500/10 border border-yellow-500/20"
                  )}
                >
                  {error.severity === 'error' ? (
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-gray-400 mb-1">
                      Line {error.line}:{error.column}
                    </div>
                    <div className={clsx(
                      "text-xs",
                      error.severity === 'error' ? "text-red-300" : "text-yellow-300"
                    )}>
                      {error.message}
                    </div>
                  </div>
                </div>
              ))}

              {activeTab === 'lint' && lintErrors.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No linting errors
                </div>
              )}
              {activeTab === 'lint' && lintErrors.map((error, index) => (
                <div
                  key={index}
                  className={clsx(
                    "flex items-start gap-2 p-2 rounded text-sm",
                    error.severity === 'error' ? "bg-red-500/10 border border-red-500/20" : "bg-yellow-500/10 border border-yellow-500/20"
                  )}
                >
                  {error.severity === 'error' ? (
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">
                        Line {error.line}:{error.column}
                      </span>
                      <span className="text-xs text-gray-500">({error.ruleId})</span>
                      {error.fixable && (
                        <span className="text-xs text-purple-400">[Fixable]</span>
                      )}
                    </div>
                    <div className={clsx(
                      "text-xs",
                      error.severity === 'error' ? "text-red-300" : "text-yellow-300"
                    )}>
                      {error.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodeQualityPanel;

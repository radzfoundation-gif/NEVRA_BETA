import React, { useState, useRef } from 'react';
import { Play, Square, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { executeCode, formatExecutionResult, ExecutionResult } from '@/lib/codeExecutor';
import clsx from 'clsx';

interface CodeSandboxProps {
  initialCode?: string;
  language?: 'javascript' | 'python' | 'typescript';
  onCodeChange?: (code: string) => void;
  className?: string;
}

const CodeSandbox: React.FC<CodeSandboxProps> = ({
  initialCode = '',
  language = 'javascript',
  onCodeChange,
  className,
}) => {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const handleExecute = async () => {
    if (!code.trim() || isExecuting) return;

    setIsExecuting(true);
    setResult(null);

    try {
      const executionResult = await executeCode(code, language);
      setResult(executionResult);
    } catch (error: any) {
      setResult({
        output: '',
        error: error.message || 'Execution failed',
        executionTime: 0,
        language,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      const text = result.error 
        ? `Error: ${result.error}` 
        : result.output;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setCode('');
    setResult(null);
    onCodeChange?.('');
  };

  return (
    <div className={clsx("flex flex-col h-full bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#111]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="ml-3 text-xs font-mono text-gray-400 uppercase">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExecute}
            disabled={!code.trim() || isExecuting}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={14} />
                Run
              </>
            )}
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Clear"
          >
            <Square size={14} />
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder={`Enter ${language} code here...\n\nExample:\nconsole.log("Hello, World!");`}
          className="flex-1 w-full bg-transparent text-sm font-mono text-white p-4 resize-none focus:outline-none placeholder-gray-600"
          spellCheck={false}
        />
      </div>

      {/* Output Panel */}
      {result && (
        <div className="border-t border-white/10 bg-[#0f0f0f]">
          <div className="flex items-center justify-between p-3 border-b border-white/5">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              {result.error ? 'Error' : 'Output'}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Copy output"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {result.error ? (
              <div className="flex items-start gap-2 text-red-400">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {result.error}
                </pre>
              </div>
            ) : (
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-words">
                {result.output || 'No output'}
              </pre>
            )}
            {result.executionTime > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                Execution time: {result.executionTime.toFixed(2)}ms
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeSandbox;

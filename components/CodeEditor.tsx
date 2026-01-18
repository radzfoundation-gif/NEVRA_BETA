import React, { useState } from 'react';
import { Save, Maximize2, Minimize2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import clsx from 'clsx';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'css' | 'html' | 'json';
  filePath?: string;
  onSave?: () => void;
  readOnly?: boolean;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'typescript',
  filePath,
  onSave,
  readOnly = false,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Ensure value is always a string to prevent .split() errors
  const safeValue = typeof value === 'string' ? value : String(value || '');
  const lineCount = safeValue.split('\n').length;

  return (
    <div className={clsx("flex flex-col h-full bg-white border-r border-zinc-200", className)}>
      {/* Header */}
      {filePath && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 bg-zinc-50">
          <span className="text-sm text-zinc-500 font-mono truncate">{filePath}</span>
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="p-1.5 hover:bg-zinc-200 rounded transition-colors text-zinc-500 hover:text-zinc-900"
                title="Save (Ctrl+S)"
              >
                <Save size={14} />
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-zinc-200 rounded transition-colors text-zinc-500 hover:text-zinc-900"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={
            language === 'tsx' ? 'typescript' :
              language === 'jsx' ? 'javascript' :
                language === 'html' ? 'html' :
                  language === 'css' ? 'css' :
                    language === 'json' ? 'json' :
                      'typescript'
          }
          value={safeValue}
          onChange={(newValue) => onChange(newValue || '')}
          theme="light"
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: readOnly,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            snippetSuggestions: 'top',
            quickSuggestions: true,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          }}
          onMount={(editor, monaco) => {
            // Handle Ctrl+S / Cmd+S
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
              onSave?.();
            });
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
        <span className="font-mono">{language.toUpperCase()}</span>
        <span className="font-mono">
          {safeValue.length} chars • {lineCount} lines
        </span>
      </div>
    </div>
  );
};

export default CodeEditor;

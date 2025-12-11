import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  X, 
  Edit2, 
  Palette, 
  Type, 
  Layout, 
  Save,
  Undo2,
  Redo2
} from 'lucide-react';
import { ComponentNode, parseComponents, findComponentByPath } from '@/lib/componentParser';
import { StyleChange, getComputedStyles, applyStyleChange } from '@/lib/styleEditor';
import clsx from 'clsx';

interface VisualEditorProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onUpdateCode: (updatedCode: string) => void;
  code: string;
  isActive: boolean;
}

const VisualEditor: React.FC<VisualEditorProps> = ({
  iframeRef,
  onUpdateCode,
  code,
  isActive,
}) => {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [components, setComponents] = useState<ComponentNode[]>([]);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [editMode, setEditMode] = useState<'props' | 'styles' | 'classes'>('styles');
  const [styles, setStyles] = useState<{ [key: string]: string }>({});
  const [classes, setClasses] = useState<string>('');
  const [props, setProps] = useState<{ [key: string]: string }>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  // Parse components when code changes
  useEffect(() => {
    if (code && isActive) {
      try {
        const parsed = parseComponents(code);
        setComponents(parsed);
      } catch (error) {
        console.error('Error parsing components:', error);
      }
    }
  }, [code, isActive]);

  // Setup iframe message listener
  useEffect(() => {
    if (!isActive || !iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      // Handle messages from iframe (element selection)
      if (event.data.type === 'element-selected') {
        const { element, path } = event.data;
        setSelectedPath(path);
        // Get element from iframe
        const iframe = iframeRef.current?.contentWindow;
        if (iframe && iframe.document) {
          const element = iframe.document.querySelector(`[data-path="${path}"]`);
          if (element && element instanceof HTMLElement) {
            setSelectedElement(element);
            updateInspectorData(element);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isActive, iframeRef]);

  // Inject selection script into iframe
  useEffect(() => {
    if (!isActive || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Inject selection script
    const script = iframeDoc.createElement('script');
    script.textContent = `
      (function() {
        let selectedElement = null;
        let overlay = null;
        
        function createOverlay() {
          overlay = document.createElement('div');
          overlay.style.cssText = 'position: absolute; border: 2px solid #7e22ce; background: rgba(126, 34, 206, 0.1); pointer-events: none; z-index: 9999;';
          document.body.appendChild(overlay);
        }
        
        function highlightElement(element) {
          if (!overlay) createOverlay();
          const rect = element.getBoundingClientRect();
          overlay.style.left = rect.left + 'px';
          overlay.style.top = rect.top + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
        }
        
        document.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          selectedElement = e.target;
          highlightElement(selectedElement);
          
          // Send message to parent
          window.parent.postMessage({
            type: 'element-selected',
            element: selectedElement.tagName,
            path: selectedElement.getAttribute('data-path') || ''
          }, '*');
        }, true);
      })();
    `;
    iframeDoc.body.appendChild(script);
  }, [isActive, iframeRef]);

  const updateInspectorData = (element: HTMLElement) => {
    const computed = getComputedStyles(element);
    setStyles(computed);
    setClasses(element.className || '');
    
    // Extract props from attributes
    const elementProps: { [key: string]: string } = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name !== 'class' && attr.name !== 'style' && attr.name !== 'data-path') {
        elementProps[attr.name] = attr.value;
      }
    });
    setProps(elementProps);
  };

  const handleStyleChange = (property: string, value: string) => {
    if (!selectedElement) return;
    
    const change: StyleChange = {
      property,
      value,
      type: 'inline',
    };
    
    applyStyleChange(selectedElement, change);
    setStyles(prev => ({ ...prev, [property]: value }));
    
    // Update code (simplified - in production, use proper HTML parser)
    // This is a placeholder - actual implementation would parse and update the HTML
  };

  const handleClassChange = (newClasses: string) => {
    if (!selectedElement) return;
    
    selectedElement.className = newClasses;
    setClasses(newClasses);
  };

  const handlePropChange = (key: string, value: string) => {
    if (!selectedElement) return;
    
    selectedElement.setAttribute(key, value);
    setProps(prev => ({ ...prev, [key]: value }));
  };

  if (!isActive) return null;

  return (
    <>
      {/* Inspector Panel */}
      <AnimatePresence>
        {inspectorOpen && selectedElement && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-[#1a1a1a] border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Component Inspector</h3>
              <button
                onClick={() => setInspectorOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setEditMode('styles')}
                className={clsx(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  editMode === 'styles'
                    ? "text-purple-400 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Palette size={14} className="inline mr-2" />
                Styles
              </button>
              <button
                onClick={() => setEditMode('classes')}
                className={clsx(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  editMode === 'classes'
                    ? "text-purple-400 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Type size={14} className="inline mr-2" />
                Classes
              </button>
              <button
                onClick={() => setEditMode('props')}
                className={clsx(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  editMode === 'props'
                    ? "text-purple-400 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Edit2 size={14} className="inline mr-2" />
                Props
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {editMode === 'styles' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase">Inline Styles</h4>
                  {Object.entries(styles).map(([property, value]) => (
                    <div key={property} className="flex gap-2">
                      <input
                        type="text"
                        value={property}
                        readOnly
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-300"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleStyleChange(property, e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newProp = prompt('Property name:');
                      const newValue = prompt('Property value:');
                      if (newProp && newValue) {
                        handleStyleChange(newProp, newValue);
                      }
                    }}
                    className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                  >
                    + Add Style
                  </button>
                </div>
              )}

              {editMode === 'classes' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase">CSS Classes</h4>
                  <textarea
                    value={classes}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono"
                    placeholder="Enter CSS classes..."
                  />
                </div>
              )}

              {editMode === 'props' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase">Props</h4>
                  {Object.entries(props).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        readOnly
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-300"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handlePropChange(key, e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newKey = prompt('Prop name:');
                      const newValue = prompt('Prop value:');
                      if (newKey && newValue) {
                        handlePropChange(newKey, newValue);
                      }
                    }}
                    className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                  >
                    + Add Prop
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  // Save changes back to code
                  if (selectedElement) {
                    // This would update the code - simplified for now
                    onUpdateCode(code);
                  }
                }}
                className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Overlay (handled by iframe script) */}
    </>
  );
};

export default VisualEditor;

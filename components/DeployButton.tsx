import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ChevronDown, Check, X, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { deployToVercel, deployToNetlify, DeploymentResult } from '@/lib/deployment';
import { ProjectFile } from '@/lib/fileManager';
import clsx from 'clsx';

interface DeployButtonProps {
  code: string | ProjectFile[];
  projectName?: string;
  className?: string;
  terminalOpen?: boolean;
  terminalHeight?: number;
}

const DeployButton: React.FC<DeployButtonProps> = ({ code, projectName, className, terminalOpen = false, terminalHeight = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const handleDeploy = async (platform: 'vercel' | 'netlify') => {
    if (!code || isDeploying) return;

    setIsDeploying(true);
    setDeploymentResult(null);
    setIsOpen(false);

    try {
      const result = platform === 'vercel'
        ? await deployToVercel(code, projectName || `nevra-${Date.now()}`)
        : await deployToNetlify(code, projectName || `nevra-${Date.now()}`);

      setDeploymentResult(result);
    } catch (error: any) {
      setDeploymentResult({
        success: false,
        error: error.message || 'Deployment failed',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyUrl = () => {
    if (deploymentResult?.url) {
      navigator.clipboard.writeText(deploymentResult.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate dropdown position when opening or when deployment result shows
  useEffect(() => {
    if ((isOpen || deploymentResult) && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top - 8, // 8px margin above button
        left: rect.left,
      });
    } else if (!isOpen && !deploymentResult) {
      setDropdownPosition(null);
    }
  }, [isOpen, deploymentResult]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!code || (Array.isArray(code) && code.length === 0)) return null;

  // Calculate bottom position based on terminal state (only if positioned absolutely)
  const bottomPosition = terminalOpen ? terminalHeight + 8 : 16; // 8px padding when terminal open, 16px when closed
  // Check if we should use absolute positioning (when className doesn't specify relative)
  const useAbsolute = !className || (!className.includes('relative') && !className.includes('absolute'));

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && !isDeploying && !deploymentResult && dropdownPosition && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-visible z-[99999] backdrop-blur-xl"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: 'translateY(-100%)',
            marginBottom: '8px',
          }}
        >
          <button
            onClick={() => handleDeploy('vercel')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-300 hover:bg-white/10 transition-colors"
          >
            <div className="w-5 h-5 rounded bg-black border border-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">V</span>
            </div>
            <span>Deploy to Vercel</span>
          </button>
          <button
            onClick={() => handleDeploy('netlify')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-300 hover:bg-white/10 transition-colors border-t border-white/5"
          >
            <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">N</span>
            </div>
            <span>Deploy to Netlify</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div 
        ref={buttonRef}
        className={clsx(
          useAbsolute ? "absolute left-4 z-[45] transition-all duration-300" : "",
          className
        )}
        style={useAbsolute ? { bottom: `${bottomPosition}px` } : undefined}
      >
      <button
        onClick={() => !isDeploying && !deploymentResult && setIsOpen(!isOpen)}
        disabled={isDeploying || !!deploymentResult}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
          isDeploying
            ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
            : deploymentResult?.success
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : deploymentResult
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-purple-400 border border-purple-500/30"
        )}
      >
        {isDeploying ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Deploying...</span>
          </>
        ) : deploymentResult?.success ? (
          <>
            <Check size={16} />
            <span>Deployed</span>
          </>
        ) : deploymentResult ? (
          <>
            <X size={16} />
            <span>Failed</span>
          </>
        ) : (
          <>
            <Rocket size={16} />
            <span>Deploy</span>
            <ChevronDown size={14} className={clsx("transition-transform", isOpen && "rotate-180")} />
          </>
        )}
      </button>


      {/* Deployment Result - Also use portal */}
      {deploymentResult && dropdownPosition && typeof document !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-4 z-[99999] backdrop-blur-xl"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: 'translateY(-100%)',
            marginBottom: '8px',
          }}
        >
          {deploymentResult.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <Check size={16} />
                <span className="text-sm font-medium">Deployment Successful!</span>
              </div>
              {deploymentResult.url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={deploymentResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-purple-400 hover:text-purple-300 truncate"
                    >
                      {deploymentResult.url}
                    </a>
                    <button
                      onClick={handleCopyUrl}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Copy URL"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                    <a
                      href={deploymentResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <X size={16} />
                <span className="text-sm font-medium">Deployment Failed</span>
              </div>
              <p className="text-xs text-gray-400">{deploymentResult.error}</p>
            </div>
          )}
          <button
            onClick={() => setDeploymentResult(null)}
            className="mt-3 w-full px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </motion.div>,
        document.body
      )}
      </div>
      
      {/* Render dropdown using portal to avoid overflow issues */}
      {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default DeployButton;

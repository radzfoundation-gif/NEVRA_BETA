import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Menu, Plus, MessageSquare, User,
  Code, Play, Layout, Smartphone, Monitor, Download,
  X, Settings, ChevronRight, ChevronDown, FileCode,
  Folder, Terminal as TerminalIcon, RefreshCw, Globe,
  CheckCircle2, Loader2, GraduationCap, Brain, Bot, Paperclip, Image as ImageIcon, Trash2, AlertTriangle, Phone, Lock, Camera, ImagePlus, Clock, Undo2, Redo2, Github, Search, FileText, Terminal
} from 'lucide-react';
import { Llama3Icon } from '@/components/ui/Llama3Logo';
import { KimiK2Icon } from '@/components/ui/KimiK2Logo';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateCode, AIProvider } from '@/lib/ai';
import ProviderSelector from '@/components/ui/ProviderSelector';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SubscriptionPopup from '../SubscriptionPopup';
import TokenBadge from '../TokenBadge';
import { useTokenLimit, useTrackAIUsage } from '@/hooks/useTokenLimit';
import { FREE_TOKEN_LIMIT } from '@/lib/tokenLimit';
import { checkGrokTokenLimit, GROK_TOKEN_LIMIT } from '@/lib/grokTokenLimit';
import { useGrokTokenLimit } from '@/hooks/useGrokTokenLimit';
import { createChatSession, saveMessage, getUserSessions, getSessionMessages } from '@/lib/database';
import { useUser, useAuth } from '@clerk/clerk-react';
import FeedbackPopup from '../FeedbackPopup';
import { useUserPreferences } from '@/hooks/useSupabase';
import Logo from '../Logo';
import VoiceCall from '../VoiceCall';
import DeployButton from '../DeployButton';
import FileTree from '../FileTree';
import CodeEditor from '../CodeEditor';
import VisualEditor from '../VisualEditor';
import CodeQualityPanel from '../CodeQualityPanel';
import VersionHistory from '../VersionHistory';
import ComponentLibrary from '../ComponentLibrary';
import GitHubIntegration from '../GitHubIntegration';
import WorkspaceMenu from '../WorkspaceMenu';
import { FileManager, ProjectFile } from '@/lib/fileManager';
import { Component, getComponentLibrary } from '@/lib/componentLibrary';
import { CodeResponse } from '@/lib/ai';
import { checkTypeScript, TypeError } from '@/lib/typescript';
import { lintCode, autoFix, LintError } from '@/lib/eslint';
import { formatCode } from '@/lib/prettier';
import { getVersionManager } from '@/lib/versionManager';
import { getUndoRedoManager } from '@/lib/undoRedo';
import { performWebSearch, combineSearchAndResponse, SearchResult } from '@/lib/webSearch';
import { parseDocument, ParsedDocument } from '@/lib/documentParser';
import SearchResults from '../SearchResults';
import CodeSandbox from '../CodeSandbox';
import DocumentViewer from '../DocumentViewer';
import PlannerPanel from '../PlannerPanel';
import { generatePlan, Plan } from '@/lib/agenticPlanner';

// --- Types ---
type AppMode = 'builder' | 'tutor' | null;

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  code?: string;
  images?: string[]; // Array of base64 strings
  timestamp: Date;
};

type FileNode = {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
};

// --- Utility ---
const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

const detectMode = (text: string): AppMode => {
  const builderKeywords = ['build', 'create', 'make', 'generate', 'code', 'app', 'website', 'landing page', 'dashboard', 'component', 'react', 'html', 'css', 'style'];
  const lowerText = text.toLowerCase();

  const isBuilder = builderKeywords.some(keyword => lowerText.includes(keyword));
  const isTutor = ['explain', 'teach', 'how to', 'what is', 'learn', 'understand'].some(keyword => lowerText.includes(keyword));

  if (isTutor && !lowerText.includes('code')) return 'tutor';
  if (isBuilder) return 'builder';

  return 'tutor';
};

const extractCode = (response: string): { text: string; code: string | null } => {
  // Try to match markdown code blocks with various languages or no language
  const codeBlockMatch = response.match(/```(?:html|xml|jsx|tsx|react)?\n([\s\S]*?)\n```/);

  if (codeBlockMatch) {
    const code = codeBlockMatch[1];
    const text = response.replace(codeBlockMatch[0], '').trim();
    return { text, code };
  }

  // Fallback: Check for raw HTML structure
  if (response.includes('<!DOCTYPE html>')) {
    return { text: 'Generated app successfully.', code: response };
  }

  return { text: response, code: null };
};

const getIframeSrc = (code: string) => {
  return `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;
};

// --- Splash Screen Component ---
const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#050505] text-white">
      <div className="text-center space-y-6 animate-pulse">
        <div className="w-16 h-16 mx-auto flex items-center justify-center">
          <Logo size={64} />
        </div>
        <h1 className="text-3xl font-display font-bold tracking-widest">NEVRA</h1>
        <p className="text-sm text-gray-400">Initializing Neural Automation...</p>
      </div>
    </div>
  );
};

// --- Mode Selection Component ---
interface ModeSelectionProps {
  onSelect: (mode: AppMode, provider: AIProvider) => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelect }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('grok');
  const { isSubscribed } = useTokenLimit();
  const { isGrokLocked } = useGrokTokenLimit();

  // Custom icon component wrappers
  const Llama3IconComponent: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <Llama3Icon size={size} className={className} />
  );

  const KimiK2IconComponent: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <KimiK2Icon size={size} className={className} />
  );

  const providers = [
    { id: 'groq', name: 'Llama 3 (Groq)', icon: Llama3IconComponent, color: 'text-blue-400' },
    { id: 'grok', name: 'Kimi K2 (Grok)', icon: KimiK2IconComponent, color: 'text-purple-400', locked: isGrokLocked && !isSubscribed },
    { id: 'openai', name: 'GPT-4o', icon: Brain, color: 'text-green-400', premium: true }
  ];

  return (
    <div className="flex items-center justify-center h-screen bg-[#050505] text-white p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-5xl font-display font-bold tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            Choose Your Mode
          </h1>
          <p className="text-gray-400 text-lg">How can Nevra assist you today?</p>
        </div>

        {/* Model Selection */}
        <div className="flex justify-center gap-4 mb-12">
          {providers.map((p) => {
            const isPremium = (p as any).premium && !isSubscribed;
            const isLocked = (p as any).locked || isPremium;
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (isPremium) {
                    alert('GPT-4o requires a Pro subscription. Please upgrade to unlock premium models.');
                    return;
                  }
                  if ((p as any).locked) {
                    alert('Kimi K2 token limit reached. Please recharge tokens or use Llama 3 instead.');
                    return;
                  }
                  setSelectedProvider(p.id as AIProvider);
                }}
                disabled={isLocked}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all relative",
                  isLocked && "opacity-50 cursor-not-allowed",
                  selectedProvider === p.id
                    ? "bg-white/10 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    : "bg-transparent border-white/10 text-gray-500 hover:border-white/30"
                )}
                title={
                  isPremium 
                    ? "Subscribe to unlock GPT-4o" 
                    : (p as any).locked 
                    ? "Kimi K2 token limit reached. Recharge tokens to unlock."
                    : undefined
                }
              >
                <p.icon size={14} className={p.color} />
                {p.name}
                {isLocked && (
                  <Lock size={12} className="text-amber-400 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Builder Mode */}
            <button
              onClick={() => {
                // Check if premium provider selected without subscription
                if ((selectedProvider === 'openai') && !isSubscribed) {
                  alert('GPT-4o requires a Pro subscription. Please upgrade to unlock premium models.');
                  return;
                }
                // Check if Grok is locked
                if ((selectedProvider === 'grok') && isGrokLocked && !isSubscribed) {
                  alert('Kimi K2 token limit has been reached. Please recharge tokens to use Kimi K2, or select Llama 3 instead.');
                  return;
                }
                onSelect('builder', selectedProvider);
              }}
              className="group relative p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all duration-300 text-left overflow-hidden"
            >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Code className="text-purple-400" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Builder Mode</h3>
              <p className="text-gray-400 mb-4">Generate full-stack web applications with AI</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  Create React apps instantly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  Live preview & code editor
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  Export & deploy ready
                </li>
              </ul>
            </div>
          </button>

          {/* Tutor Mode */}
          <button
            onClick={() => {
              // Check if premium provider selected without subscription
              if ((selectedProvider === 'openai') && !isSubscribed) {
                alert('GPT-4o requires a Pro subscription. Please upgrade to unlock premium models.');
                return;
              }
              // Check if Grok is locked
              if ((selectedProvider === 'grok') && isGrokLocked && !isSubscribed) {
                alert('Kimi K2 token limit has been reached. Please recharge tokens to use Kimi K2, or select Llama 3 instead.');
                return;
              }
              onSelect('tutor', selectedProvider);
            }}
            className="group relative p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all duration-300 text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="text-blue-400" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Tutor Mode</h3>
              <p className="text-gray-400 mb-4">Learn anything with AI-powered tutoring</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  Explain complex topics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  Step-by-step guidance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  Code explanations
                </li>
              </ul>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Chat Interface ---
const ChatInterface: React.FC = () => {
  const { user } = useUser();
  const { id: sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper: Get initial state safely
  const getInitialState = () => {
    const initialPrompt = location.state?.initialPrompt;
    const initialProvider = location.state?.initialProvider as AIProvider;
    const initialImages = location.state?.initialImages as string[];

    if (initialPrompt || (initialImages && initialImages.length > 0)) {
      const detectedMode = initialPrompt ? detectMode(initialPrompt) : 'tutor';
      const userMsgId = Date.now().toString();
      const content = initialPrompt || "Analyzing image...";

      return {
        mode: detectedMode,
        messages: [{
          id: userMsgId,
          role: 'user',
          content: content,
          images: initialImages,
          timestamp: new Date()
        }] as Message[],
        shouldAutoSend: true,
        initialProvider: initialProvider || 'grok',
        initialImages: initialImages || []
      };
    }
    return { mode: null, messages: [], shouldAutoSend: false, initialProvider: 'grok' as AIProvider, initialImages: [] };
  };

  const initialState = getInitialState();
  const [templateName, setTemplateName] = useState<string | undefined>(initialState.templateName);

  // Token Limit Hooks
  const { hasExceeded, isSubscribed, refreshLimit, tokensUsed, incrementTokenUsage, loading: tokenLoading } = useTokenLimit();
  const { isGrokLocked, refreshLimit: refreshGrokLimit } = useGrokTokenLimit();

  // Global State
  const [appMode, setAppMode] = useState<AppMode>(initialState.mode);
  // Default to grok (Kimi K2), fallback to groq if openai selected but not subscribed, or if grok is locked
  const defaultProvider = (initialState.initialProvider === 'openai' && !isSubscribed) 
    ? (isGrokLocked ? 'groq' : 'grok')
    : (initialState.initialProvider === 'grok' && isGrokLocked && !isSubscribed)
    ? 'groq'
    : (initialState.initialProvider || (isGrokLocked && !isSubscribed ? 'groq' : 'grok'));
  const [provider, setProvider] = useState<AIProvider>(defaultProvider as AIProvider);
  
  // Update provider if Grok becomes locked/unlocked
  useEffect(() => {
    if (provider === 'grok' && isGrokLocked && !isSubscribed) {
      setProvider('groq');
    }
  }, [isGrokLocked, isSubscribed, provider]);
  const [showSplash, setShowSplash] = useState(!initialState.shouldAutoSend);

  // Chat State
  const [messages, setMessages] = useState<Message[]>(initialState.messages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const MAX_IMAGES = 3;
  const MAX_SIZE_MB = 2;

  // Builder State - Multi-File Support
  const [fileManager] = useState(() => new FileManager());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [currentCode, setCurrentCode] = useState<string>(''); // Keep for backward compatibility
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'visual'>('preview');
  const [typescriptErrors, setTypeScriptErrors] = useState<TypeError[]>([]);
  const [lintErrors, setLintErrors] = useState<LintError[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [showGitHubIntegration, setShowGitHubIntegration] = useState(false);
  const undoRedoManager = getUndoRedoManager();
  const [logs, setLogs] = useState<string[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const canExport = Boolean(currentCode || fileManager.getAllFiles().length > 0);
  const [freeFallback, setFreeFallback] = useState(false);

  // Mobile State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState<'chat' | 'workbench'>('chat');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [deviceScale, setDeviceScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSent = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const restoredSessionRef = useRef(false);
  // Refs for camera cleanup
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraModalRef = useRef<HTMLElement | null>(null);
  const cameraEventListenersRef = useRef<Array<{ element: HTMLElement; event: string; handler: EventListener }>>([]);
  const { getToken } = useAuth();
  const SUPABASE_TEMPLATE = import.meta.env.VITE_CLERK_SUPABASE_TEMPLATE || 'supabase';
  const { trackUsage } = useTrackAIUsage();
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);

  // Feedback Popup State
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const hasShownSessionPopup = useRef(false);
  const { preferences } = useUserPreferences();

  // Voice Call State (only for tutor mode)
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  // New Features for Tutor Mode
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [uploadedDocument, setUploadedDocument] = useState<ParsedDocument | null>(null);
  const [showCodeSandbox, setShowCodeSandbox] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Agentic Planning for Builder Mode
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Feedback Logic
  useEffect(() => {
    if (!preferences || hasShownSessionPopup.current) return;

    const userMsgCount = messages.filter(m => m.role === 'user').length;

    // Show popup if:
    // 1. User has sent at least 2 messages
    // 2. User hasn't given feedback yet (checked from DB)
    // 3. Popup hasn't been shown in this session (checked via ref)
    if (userMsgCount >= 2 && !preferences.preferences?.has_given_feedback) {
      setShowFeedbackPopup(true);
      hasShownSessionPopup.current = true;
    }
  }, [messages, preferences]);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate device scale to fit canvas
  useEffect(() => {
    if (previewDevice === 'desktop' || !previewContainerRef.current) {
      setDeviceScale(1);
      return;
    }

    const calculateScale = () => {
      const container = previewContainerRef.current?.parentElement;
      if (!container) return;

      // Account for padding (p-4 = 1rem = 16px each side = 32px total)
      // Account for address bar height (~40px) + margin bottom (mb-4 = 1rem = 16px) + extra padding
      const containerWidth = container.clientWidth - 32; // 16px padding each side
      const containerHeight = container.clientHeight - 100; // address bar + margins + padding

      let deviceWidth = 375;
      let deviceHeight = 812;

      if (previewDevice === 'tablet') {
        deviceWidth = 768;
        deviceHeight = 1024;
      }

      const scaleX = containerWidth / deviceWidth;
      const scaleY = containerHeight / deviceHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      const finalScale = Math.max(0.3, scale); // Minimum scale to prevent too small

      setDeviceScale(finalScale);
    };

    // Initial calculation
    calculateScale();

    // Use ResizeObserver for container
    const resizeObserver = new ResizeObserver(calculateScale);
    if (previewContainerRef.current?.parentElement) {
      resizeObserver.observe(previewContainerRef.current.parentElement);
    }

    // Also listen to window resize
    window.addEventListener('resize', calculateScale);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [previewDevice]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resume latest session when no session is selected
  useEffect(() => {
    const resumeLatestSession = async () => {
      if (sessionId || restoredSessionRef.current || !user) return;

      try {
        const token = await getToken({ template: SUPABASE_TEMPLATE }).catch(() => null);
        const sessions = await getUserSessions(user.id, token);
        if (!sessions || sessions.length === 0) return;

        const latest = sessions[0];
        const dbMessages = await getSessionMessages(latest.id, token);

        setAppMode(latest.mode as AppMode);
        setProvider(latest.provider as AIProvider);
        setMessages(
          dbMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            code: m.code || undefined,
            images: m.images || undefined,
            timestamp: new Date(m.created_at),
          })),
        );
        setShowSplash(false);
        restoredSessionRef.current = true;
        navigate(`/chat/${latest.id}`, { replace: true });
      } catch (error) {
        console.error('Error resuming latest session', error);
      }
    };

    resumeLatestSession();
  }, [sessionId, user, getToken, navigate]);

  // Auto-Start Logic - moved after handleSend definition

  // No auto-greeting; wait for user prompt

  // Handle Mode Selection
  const handleModeSelect = (mode: AppMode, selectedProvider: AIProvider) => {
    setAppMode(mode);
    setProvider(selectedProvider);
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (attachedImages.length >= MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images per message.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    let accepted = 0;
    Array.from(files).forEach(file => {
      if (attachedImages.length + accepted >= MAX_IMAGES) return;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File ${file.name} is too large (> ${MAX_SIZE_MB}MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAttachedImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
      accepted += 1;
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowImageMenu(false);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      // Cleanup camera stream
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      // Cleanup modal
      if (cameraModalRef.current && document.body.contains(cameraModalRef.current)) {
        document.body.removeChild(cameraModalRef.current);
        cameraModalRef.current = null;
      }
      // Cleanup event listeners
      cameraEventListenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      cameraEventListenersRef.current = [];
    };
  }, []);

  const handleCameraCapture = async () => {
    let stream: MediaStream | null = null;
    let modal: HTMLElement | null = null;
    
    const cleanup = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        cameraStreamRef.current = null;
      }
      if (modal && document.body.contains(modal)) {
        // Remove all event listeners
        cameraEventListenersRef.current.forEach(({ element, event, handler }) => {
          element.removeEventListener(event, handler);
        });
        cameraEventListenersRef.current = [];
        document.body.removeChild(modal);
        modal = null;
        cameraModalRef.current = null;
      }
      setShowImageMenu(false);
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      cameraStreamRef.current = stream;
      
      // Create modal for camera preview
      modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4';
      modal.innerHTML = `
        <div class="w-full max-w-md flex flex-col items-center">
          <video id="camera-preview" class="w-full max-w-full rounded-lg mb-4 aspect-video object-cover" autoplay playsinline></video>
          <div class="flex gap-3 justify-center w-full">
            <button id="capture-btn" class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
              Capture Photo
            </button>
            <button id="cancel-btn" class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      cameraModalRef.current = modal;
      
      const preview = modal.querySelector('#camera-preview') as HTMLVideoElement;
      if (!preview) {
        cleanup();
        return;
      }
      preview.srcObject = stream;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        return;
      }
      
      const captureBtn = modal.querySelector('#capture-btn');
      const cancelBtn = modal.querySelector('#cancel-btn');
      
      if (!captureBtn || !cancelBtn) {
        cleanup();
        return;
      }
      
      const handleCapture = () => {
        if (attachedImages.length >= MAX_IMAGES) {
          alert(`Maximum ${MAX_IMAGES} images per message.`);
          cleanup();
          return;
        }
        
        if (preview && ctx) {
          canvas.width = preview.videoWidth;
          canvas.height = preview.videoHeight;
          ctx.drawImage(preview, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAttachedImages(prev => [...prev, dataUrl]);
        }
        
        cleanup();
      };
      
      const handleCancel = () => {
        cleanup();
      };
      
      captureBtn.addEventListener('click', handleCapture);
      cancelBtn.addEventListener('click', handleCancel);
      
      // Store listeners for cleanup
      cameraEventListenersRef.current = [
        { element: captureBtn, event: 'click', handler: handleCapture },
        { element: cancelBtn, event: 'click', handler: handleCancel }
      ];
      
    } catch (error: unknown) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera.';
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Camera not found.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.';
        }
      }
      
      alert(errorMessage);
      cleanup();
    }
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (imageMenuRef.current && !imageMenuRef.current.contains(event.target as Node)) {
        setShowImageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const downloadCurrentCode = () => {
    if (!currentCode) return;
    const blob = new Blob([currentCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nevra-app.html';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearPreview = () => {
    setCurrentCode('');
    setActiveTab('preview');
    setLogs(prev => [...prev, '> Preview cleared']);
  };

  // Generate Plan (Builder Mode)
  const handleGeneratePlan = async (promptText: string) => {
    if (!promptText.trim() || isGeneratingPlan) return;

    setIsGeneratingPlan(true);
    try {
      const plan = await generatePlan(promptText, provider);
      setCurrentPlan(plan);
      setShowPlanner(true);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('Failed to generate plan. Proceeding with direct generation...');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Handle Send
  const handleSend = async (textOverride?: string, modeOverride?: AppMode, historyOverride?: Message[]) => {
    let text = textOverride || input;
    const imagesToSend = historyOverride ? [] : attachedImages; // Only send new images if not overriding history

    if ((!text.trim() && imagesToSend.length === 0) || isTyping) return;

    // For Builder Mode: Show plan option if no plan exists
    const mode = modeOverride || appMode || detectMode(text);
    if (mode === 'builder' && !currentPlan && !historyOverride) {
      // Ask user if they want to generate a plan first
      const shouldPlan = confirm('Would you like to see a build plan first? (Recommended)');
      if (shouldPlan) {
        await handleGeneratePlan(text);
        return; // Don't proceed with generation yet
      }
    }

    // Auto-switch to OpenAI if images are attached (only OpenAI supports vision)
    let effectiveProvider = provider;
    if (imagesToSend.length > 0 && provider !== 'openai') {
      if (!isSubscribed) {
        alert('Image analysis requires GPT-4o (OpenAI). Please subscribe to use this feature, or remove the images to use other providers.');
        return;
      }
      effectiveProvider = 'openai';
      setProvider('openai'); // Update UI
      console.log('🖼️ Images detected, switching to OpenAI for vision analysis');
    }

    // Check Grok (Kimi K2) token limit - if exceeded, block access and switch to groq
    if (provider === 'grok' && !isSubscribed && user) {
      // Check if Grok is locked
      if (isGrokLocked) {
        console.log(`⚠️ Grok (Kimi K2) is locked due to token limit. Switching to Llama 3.`);
        effectiveProvider = 'groq';
        setProvider('groq'); // Update UI
        
        // Show notification
        if (mode === 'builder') {
          setLogs(prev => [...prev, `⚠️ Kimi K2 locked (token limit reached). Switched to Llama 3.`]);
        }
        
        // Show alert to user
        alert('Kimi K2 token limit has been reached. Please recharge tokens to use Kimi K2, or continue with Llama 3.');
      } else {
        // Double-check with server before proceeding
        try {
          const token = await getToken({ template: SUPABASE_TEMPLATE }).catch(() => null);
          const grokLimit = await checkGrokTokenLimit(user.id, token);
          
          if (grokLimit.shouldFallback) {
            console.log(`⚠️ Grok (Kimi K2) token limit exceeded (${grokLimit.tokensUsed}/${GROK_TOKEN_LIMIT}), falling back to Llama 3`);
            effectiveProvider = 'groq';
            setProvider('groq'); // Update UI
            
            // Refresh Grok limit status
            refreshGrokLimit();
            
            // Show notification in logs (for builder mode) or console
            if (mode === 'builder') {
              setLogs(prev => [...prev, `⚠️ Kimi K2 limit reached (${grokLimit.tokensUsed}/${GROK_TOKEN_LIMIT}), switched to Llama 3`]);
            }
          }
        } catch (error) {
          console.error('Error checking grok token limit:', error);
          // On error, allow grok usage
        }
      }
    }

    // Check general token limit
    if (!isSubscribed && hasExceeded) {
      if (!freeFallback) {
        setShowSubscriptionPopup(true);
        return;
      }
      // fallback gratis: paksa provider ke Llama 3
      if (provider !== 'groq') {
        setProvider('groq');
      }
    }

    // mode sudah dideklarasikan di atas (line 694)
    if (!appMode) setAppMode(mode);

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      images: imagesToSend,
      timestamp: new Date()
    };

    if (!textOverride) {
      setMessages(prev => [...prev, newMessage]);
      setInput('');
      setAttachedImages([]);
    }

    setIsTyping(true);

    if (mode === 'builder') {
      setLogs(prev => [...prev, `> Processing request: "${text.substring(0, 20)}..."`]);
    }

    // Optimistic token decrement even sebelum tracking ke server (agar badge sinkron)
    incrementTokenUsage(10);

    try {
      // 1. Create session if it doesn't exist
      let currentSessionId = sessionId;
      let token;
      try {
        token = await getToken({ template: SUPABASE_TEMPLATE });
      } catch (e) {
        console.warn("Clerk Supabase template missing. See CLERK_SUPABASE_GUIDE.md");
      }

      if (!currentSessionId && user) {
        const newSession = await createChatSession(user.id, mode || 'tutor', effectiveProvider, text.substring(0, 30) + '...', token);
        if (newSession) {
          currentSessionId = newSession.id;
          // Update URL without reloading
          window.history.replaceState(null, '', `/chat/${newSession.id}`);
        }
      }

      // 2. Save User Message
      if (currentSessionId && user) {
        await saveMessage(currentSessionId, 'user', text, undefined, imagesToSend, token);
      }

      let historyForAI: any[] = [];

      if (historyOverride) {
        historyForAI = historyOverride.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: (m as any).code ? `${m.content}\n\nCode Generated:\n${(m as any).code}` : m.content }]
        }));
      } else {
        const tempMessage: Message = { id: 'temp', role: 'user', content: text, timestamp: new Date() };
        historyForAI = [...messages, tempMessage].map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.code ? `${m.content}\n\nCode Generated:\n${m.code}` : m.content }]
        }));
      }

      // Perform web search if enabled (Tutor mode only)
      let searchResults: any[] = [];
      if (mode === 'tutor' && enableWebSearch && text.trim()) {
        try {
          const searchResponse = await performWebSearch(text, 5);
          searchResults = searchResponse.results;
          setSearchResults(searchResults);
          
          // Enhance prompt with search context
          if (searchResults.length > 0) {
            const searchContext = searchResults
              .map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`)
              .join('\n');
            text = `${text}\n\n[Web Search Results]\n${searchContext}\n\nPlease use the above search results to provide a comprehensive answer with citations.`;
          }
        } catch (error) {
          console.error('Web search error:', error);
          // Continue without search results
        }
      }

      // Include uploaded document context if available
      if (uploadedDocument && mode === 'tutor') {
        const docContext = `\n\n[Document Context: ${uploadedDocument.title}]\n${uploadedDocument.content.substring(0, 2000)}...\n\nPlease use the above document context to answer the question.`;
        text = text + docContext;
      }

      const codeResponse = await generateCode(text, historyForAI, mode, effectiveProvider, imagesToSend);
      
      // Handle multi-file or single-file response
      let code: string | null = null;
      let responseText = '';
      
      if (codeResponse.type === 'multi-file') {
        // Multi-file project
        fileManager.clear();
        codeResponse.files.forEach(file => {
          fileManager.addFile(file.path, file.content, file.type);
        });
        if (codeResponse.entry) {
          fileManager.setEntry(codeResponse.entry);
          const entryFile = fileManager.getFile(codeResponse.entry);
          code = entryFile?.content || null;
          
          // Set selected file to entry
          setSelectedFile(codeResponse.entry);
          if (!openFiles.includes(codeResponse.entry)) {
            setOpenFiles(prev => [...prev, codeResponse.entry]);
          }
        }
        responseText = `Generated ${codeResponse.files.length} file(s) for ${codeResponse.framework || 'react'} project.`;
      } else {
        // Single-file HTML (backward compatibility)
        code = codeResponse.content;
        const extracted = extractCode(code);
        responseText = extracted.text;
        code = extracted.code || code;
        
        // Convert single-file to FileManager for consistency
        fileManager.clear();
        fileManager.addFile('index.html', code, 'page');
        fileManager.setEntry('index.html');
        setSelectedFile('index.html');
        if (!openFiles.includes('index.html')) {
          setOpenFiles(prev => [...prev, 'index.html']);
        }
      }

      // 3. Save AI Response
      if (currentSessionId && user) {
        await saveMessage(currentSessionId, 'ai', responseText, code || undefined, undefined, token);
      }

      // Combine search results with response if available
      let finalResponseText = responseText || "Done.";
      if (searchResults.length > 0 && mode === 'tutor') {
        finalResponseText = combineSearchAndResponse(searchResults, responseText);
      }

      setMessages(prev => {
        return [...prev, {
          id: (Date.now() + 1).toString(), role: 'ai', content: finalResponseText, code: code || undefined, timestamp: new Date()
        }];
      });

      if (code && mode === 'builder') {
        setLogs(prev => [...prev, '> Code generation complete.', '> Bundling assets...', '> Starting development server...']);
        setCurrentCode(code); // Keep for backward compatibility
        setActiveTab('preview');
        setRefreshKey(k => k + 1);
        
        // Auto-save version
        const versionManager = getVersionManager();
        versionManager.saveVersion(fileManager.getAllFiles(), 'Auto-save after generation');
        
        setTimeout(() => setLogs(prev => [...prev, '> Server running at http://localhost:3000', '> Ready.']), 800);
      }

      // Track token usage dengan optimistic update
      if (currentSessionId) {
        // Track ke database (async, tidak blocking) - use effective provider
        trackUsage(currentSessionId, effectiveProvider)
          .then((success) => {
            if (success) {
              console.log('✅ Token tracked successfully');
              // Delay untuk memastikan database commit, lalu sync
              setTimeout(() => {
                refreshLimit();
                refreshGrokLimit(); // Also refresh Grok limit status
              }, 1000); // Increased delay untuk memastikan database commit
            } else {
              console.warn('⚠️ Token tracking returned false');
              // Refresh untuk sync dengan database
              setTimeout(() => {
                refreshLimit();
              }, 1000);
            }
          })
          .catch((error) => {
            console.error('❌ Error tracking usage:', error);
            // Rollback jika tracking gagal - refresh untuk sync dengan database
            setTimeout(() => {
              refreshLimit();
            }, 1000);
          });
      }

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : "Connection error. Please check your API Key.";
      setMessages(prev => [...prev, {
        id: Date.now().toString(), 
        role: 'ai', 
        content: `Error: ${errorMessage}`, 
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto-Start Logic - runs after handleSend is defined
  // Store handleSend in ref to avoid stale closure issues
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  useEffect(() => {
    if (initialState.shouldAutoSend && !hasAutoSent.current && initialState.messages.length > 0) {
      hasAutoSent.current = true;
      // Use ref to get latest handleSend without adding it to dependencies
      handleSendRef.current(initialState.messages[0].content, initialState.mode as AppMode, initialState.messages);
    }
    // Only run once on mount - initialState is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mock File Tree
  const files: FileNode[] = [
    { name: 'node_modules', type: 'folder' },
    { name: 'public', type: 'folder', children: [{ name: 'vite.svg', type: 'file' }] },
    {
      name: 'src', type: 'folder', isOpen: true, children: [
        { name: 'components', type: 'folder' },
        { name: 'App.tsx', type: 'file' },
        { name: 'main.tsx', type: 'file' },
        { name: 'index.css', type: 'file' }
      ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'vite.config.ts', type: 'file' },
  ];

  const FileTreeItem: React.FC<{ node: FileNode; depth?: number }> = ({ node, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(node.isOpen || false);
    return (
      <div>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-3 text-xs text-gray-400 hover:bg-white/5 rounded-lg cursor-pointer select-none transition-all duration-200 group",
            node.name === 'App.tsx' && "bg-purple-500/10 text-purple-300 border border-purple-500/20"
          )}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          onClick={() => node.type === 'folder' && setIsOpen(!isOpen)}
        >
          {node.type === 'folder' && (
            <ChevronRight size={12} className={cn("text-gray-600 transition-transform duration-200", isOpen && "rotate-90")} />
          )}
          {node.type === 'folder' ? (
            <Folder size={14} className="text-blue-400 group-hover:text-blue-300" />
          ) : (
            <FileCode size={14} className={cn(
              node.name === 'App.tsx' ? "text-purple-400" : "text-gray-500 group-hover:text-gray-400"
            )} />
          )}
          <span className="font-medium">{node.name}</span>
        </div>
        {node.type === 'folder' && isOpen && node.children && (
          <div className="ml-2 border-l border-white/5">
            {node.children.map(child => <FileTreeItem key={child.name} node={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  const mainContentClass = showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000 ease-out';

  // --- Render Content ---
  const chatContent = (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0a0a0f] via-[#0b0b12] to-[#08080a] relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative h-14 md:h-16 border-b border-white/5 flex items-center px-3 md:px-6 justify-between shrink-0 bg-gradient-to-r from-white/[0.02] to-white/[0.01] backdrop-blur-xl">
        <Link to="/" className="font-display font-bold text-base md:text-xl tracking-tight flex items-center gap-2 md:gap-3 group">
          <div className="relative">
            <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Logo size={isMobile ? 28 : 32} />
            </div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 blur-xl transition-opacity">
              <Logo size={isMobile ? 28 : 32} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold leading-tight text-sm md:text-base">
              {appMode === 'tutor' ? 'NEVRA TUTOR' : 'NEVRA BUILDER'}
            </span>
            {!isMobile && (
              <>
                <span className="text-[10px] text-gray-500 font-normal tracking-wider uppercase">
                  {appMode === 'tutor' ? 'AI Learning Assistant' : 'AI Code Builder'}
                </span>
                {templateName && (
                  <span className="text-[10px] text-purple-400 font-medium mt-0.5">
                    Template: {templateName}
                  </span>
                )}
              </>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Voice Call Button - Only show in Tutor Mode */}
          {appMode === 'tutor' && (
            <button
              onClick={() => setShowVoiceCall(true)}
              className="p-2.5 md:p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 text-green-400 hover:text-green-300 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
              title="Start Voice Call"
            >
              <Phone size={isMobile ? 20 : 18} />
            </button>
          )}
          {/* Planner Button - Only show in Builder Mode */}
          {appMode === 'builder' && (
            <button
              onClick={() => {
                if (currentPlan) {
                  setShowPlanner(!showPlanner);
                } else if (input.trim()) {
                  handleGeneratePlan(input);
                } else {
                  alert('Enter a prompt first to generate a plan');
                }
              }}
              className="p-2.5 md:p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 text-purple-400 hover:text-purple-300 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
              title="Show Build Plan"
              disabled={isGeneratingPlan}
            >
              {isGeneratingPlan ? (
                <Loader2 size={isMobile ? 20 : 18} className="animate-spin" />
              ) : (
                <Layout size={isMobile ? 20 : 18} />
              )}
            </button>
          )}
          {!isMobile && (
            <button 
              onClick={() => setAppMode(null)} 
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              Change Mode
            </button>
          )}
          <button className="p-2.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center">
            <Settings size={isMobile ? 20 : 16} className="text-gray-400 hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="relative flex-1 overflow-y-auto px-3 md:px-4 lg:px-8 py-4 md:py-6 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] md:min-h-[400px] text-center px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 md:mb-6 border border-purple-500/20">
                <MessageSquare className="text-purple-400" size={isMobile ? 28 : 32} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Start a conversation</h3>
              <p className="text-xs md:text-sm text-gray-400 max-w-md">
                {appMode === 'tutor' 
                  ? (isMobile ? 'Ask me anything and I\'ll help you learn.' : 'Ask me anything and I\'ll help you learn step by step.')
                  : (isMobile ? 'Describe your app and I\'ll build it for you.' : 'Describe the app or website you want to build, and I\'ll generate it for you.')}
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={msg.id} className={cn("flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500", msg.role === 'user' ? 'items-end' : 'items-start')}>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot size={isMobile ? 12 : 14} className="text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-gray-400">
                    {appMode === 'tutor' ? 'Nevra Tutor' : 'Nevra Builder'}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-gray-600 px-1.5 md:px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    {provider.toUpperCase()}
                  </span>
                </div>
              )}
              <div className={cn(
                "relative max-w-[95%] sm:max-w-[90%] md:max-w-[75%] rounded-xl md:rounded-2xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base leading-relaxed shadow-lg border backdrop-blur-sm transition-all duration-300",
                msg.role === 'user'
                  ? "bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-blue-500/10 text-white border-purple-500/20 shadow-purple-500/10"
                  : "bg-white/[0.03] text-gray-200 border-white/10 shadow-black/20"
              )}>
                {msg.role === 'user' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 shadow-lg shadow-purple-500/50"></div>
                )}
                {msg.images && msg.images.length > 0 && (
                  <div className="flex gap-2 mb-3 md:mb-4 flex-wrap">
                    {msg.images.map((img, imgIdx) => (
                      <div key={imgIdx} className="relative group">
                        <img src={img} alt="Attached" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg md:rounded-xl border border-purple-500/30 shadow-lg" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg md:rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === 'ai' ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-code:text-purple-300">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="rounded-lg md:rounded-xl overflow-hidden my-2 md:my-3 border border-white/10 bg-[#0a0a0a] shadow-xl">
                              <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 bg-[#111] border-b border-white/5">
                                <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">{match[1]}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                  }}
                                  className="text-[10px] md:text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:py-1 rounded-md hover:bg-white/5 transition-colors min-h-[36px] md:min-h-0"
                                >
                                  <Code size={isMobile ? 14 : 12} /> <span className="md:inline">Copy</span>
                                </button>
                              </div>
                              <div className="overflow-x-auto">
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, padding: '1rem md:1.25rem', background: 'transparent', fontSize: isMobile ? '12px' : '13px', minWidth: 'fit-content' }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            </div>
                          ) : (
                            <code className={cn("bg-purple-500/20 text-purple-300 rounded-md px-1.5 py-0.5 text-xs font-medium border border-purple-500/30", className)} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-white leading-relaxed">{msg.content}</div>
                )}
              </div>
              {msg.role === 'ai' && msg.code && (
                <button 
                  onClick={() => { setActiveTab('code'); if (isMobile) setMobileTab('workbench'); }} 
                  className="flex items-center gap-2 text-xs md:text-sm font-medium text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-3 md:py-2.5 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 shadow-lg shadow-purple-500/10 min-h-[44px] md:min-h-0"
                >
                  <FileCode size={isMobile ? 16 : 14} /> <span>View Generated App</span>
                </button>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 md:gap-3 text-gray-400 text-sm md:text-base pl-2 animate-pulse">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                <Loader2 size={isMobile ? 18 : 16} className="animate-spin text-purple-400" />
              </div>
              <span className="font-medium">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative p-3 md:p-4 lg:p-6 border-t border-white/5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent backdrop-blur-xl shrink-0 pb-safe">
        {!isSubscribed && hasExceeded && !tokenLoading && (
          <div className="mb-3 md:mb-4 text-xs md:text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-2.5 shadow-lg shadow-amber-500/10">
            <AlertTriangle size={isMobile ? 18 : 16} className="text-amber-400 shrink-0" />
            <span className="text-[11px] md:text-xs">Free quota reached. Upgrade to continue generating responses.</span>
          </div>
        )}
        {!isSubscribed && isGrokLocked && provider === 'grok' && (
          <div className="mb-3 md:mb-4 text-xs md:text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-2.5 shadow-lg shadow-amber-500/10">
            <AlertTriangle size={isMobile ? 18 : 16} className="text-amber-400 shrink-0" />
            <span className="text-[11px] md:text-xs">Kimi K2 token limit reached. Switching to Llama 3. Recharge tokens to unlock Kimi K2.</span>
          </div>
        )}
        {/* Attached Images Preview */}
        {attachedImages.length > 0 && (
          <div className="mb-3 md:mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={isMobile ? 16 : 14} className="text-purple-400" />
              <span className="text-[11px] md:text-xs text-purple-400 font-medium">
                {attachedImages.length} image{attachedImages.length > 1 ? 's' : ''} ready for AI analysis
              </span>
            </div>
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-none -mx-3 md:mx-0 px-3 md:px-0">
              {attachedImages.map((img, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <img src={img} alt="Preview" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg md:rounded-xl border-2 border-purple-500/30 shadow-lg" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 md:p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-lg min-w-[32px] min-h-[32px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  >
                    <X size={isMobile ? 14 : 12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative bg-white/[0.02] border border-white/10 rounded-xl md:rounded-2xl shadow-2xl backdrop-blur-xl p-3 md:p-4 transition-all duration-300 group-hover:border-white/20">
            {/* Mobile: Layout dengan textarea di atas, buttons di bawah */}
            {isMobile ? (
              <>
                {/* Textarea - Full width di mobile, lebih tinggi */}
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={appMode === 'tutor' ? "Ask me anything..." : "Describe your app..."}
                  className="w-full bg-transparent border-0 rounded-lg px-3 py-3 text-base text-white placeholder-gray-500 focus:outline-none resize-none min-h-[120px] max-h-[200px] leading-relaxed"
                  style={{ paddingRight: '52px' }}
                />
                
                {/* Send button - Absolute di kanan atas textarea */}
                <button
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
                  className="absolute top-4 right-4 p-2.5 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 hover:from-purple-500 hover:via-purple-400 hover:to-blue-400 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
                >
                  <Send size={20} />
                </button>

                {/* Buttons Row - Di bawah textarea untuk mobile */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  {/* Left: Action buttons */}
                  <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-none -mx-1 px-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                    />
                    <input
                      type="file"
                      ref={documentInputRef}
                      className="hidden"
                      accept=".pdf,.docx,.txt,.md"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const parsed = await parseDocument(file);
                          setUploadedDocument(parsed);
                          setShowDocumentViewer(true);
                        } catch (error: unknown) {
                          alert(`Failed to parse document: ${error.message}`);
                        }
                        if (documentInputRef.current) documentInputRef.current.value = '';
                      }}
                    />
                    <div className="relative" ref={imageMenuRef}>
                      <button
                        onClick={() => setShowImageMenu(!showImageMenu)}
                        className="p-2.5 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-gray-400 hover:text-purple-400 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                        title="Attach images"
                      >
                        <ImageIcon size={20} />
                      </button>
                      {showImageMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 backdrop-blur-xl">
                          <button
                            onClick={handleCameraCapture}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left text-gray-300 hover:bg-white/10 transition-colors whitespace-nowrap min-h-[44px]"
                          >
                            <Camera size={18} className="text-purple-400 shrink-0" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            onClick={() => {
                              fileInputRef.current?.click();
                              setShowImageMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left text-gray-300 hover:bg-white/10 transition-colors border-t border-white/5 whitespace-nowrap min-h-[44px]"
                          >
                            <ImagePlus size={18} className="text-blue-400 shrink-0" />
                            <span>Choose from Gallery</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-gray-400 hover:text-blue-400 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                      title="Attach files"
                    >
                      <Paperclip size={20} />
                    </button>
                    {/* Tutor Mode Features */}
                    {appMode === 'tutor' && (
                      <>
                        <button
                          onClick={() => documentInputRef.current?.click()}
                          className="p-2.5 rounded-lg bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 text-gray-400 hover:text-green-400 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                          title="Upload document"
                        >
                          <FileText size={20} />
                        </button>
                        <button
                          onClick={() => setShowCodeSandbox(!showCodeSandbox)}
                          className={cn(
                            "p-2.5 rounded-lg border transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0",
                            showCodeSandbox
                              ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                              : "bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 text-gray-400 hover:text-blue-400"
                          )}
                          title="Code Sandbox"
                        >
                          <Terminal size={20} />
                        </button>
                        <button
                          onClick={() => setEnableWebSearch(!enableWebSearch)}
                          className={cn(
                            "p-2.5 rounded-lg border transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0",
                            enableWebSearch
                              ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                              : "bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 text-gray-400 hover:text-blue-400"
                          )}
                          title="Web Search"
                        >
                          <Search size={20} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Right: Provider selector */}
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <ProviderSelector
                      value={provider}
                      onChange={(p) => {
                        if (p === 'openai' && !isSubscribed) {
                          setShowSubscriptionPopup(true);
                          return;
                        }
                        if (p === 'grok' && isGrokLocked && !isSubscribed) {
                          alert('Kimi K2 token limit has been reached. Please recharge tokens to use Kimi K2, or select another provider.');
                          return;
                        }
                        setProvider(p);
                      }}
                      className="text-xs"
                      isSubscribed={isSubscribed}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Desktop: Original layout */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={appMode === 'tutor' ? "Ask me anything... I'm here to help you learn!" : "Describe the app or website you want to build..."}
                  className="w-full bg-transparent border-0 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-white placeholder-gray-500 focus:outline-none resize-none min-h-[90px] leading-relaxed"
                />

                {/* File Upload Buttons */}
                <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 flex items-center gap-1.5 md:gap-2 flex-wrap max-w-[60%]">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
              />
              <input
                type="file"
                ref={documentInputRef}
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const parsed = await parseDocument(file);
                    setUploadedDocument(parsed);
                    setShowDocumentViewer(true);
                  } catch (error: unknown) {
                    alert(`Failed to parse document: ${error.message}`);
                  }
                  if (documentInputRef.current) documentInputRef.current.value = '';
                }}
              />
              <div className="relative" ref={imageMenuRef}>
                <button
                  onClick={() => setShowImageMenu(!showImageMenu)}
                  className="p-2.5 md:p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-gray-400 hover:text-purple-400 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  title="Attach images for AI analysis"
                >
                  <ImageIcon size={isMobile ? 20 : 18} />
                </button>
                {showImageMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 md:w-52 bg-[#1a1a1a] border border-white/10 rounded-lg md:rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-xl">
                    <button
                      onClick={handleCameraCapture}
                      className="w-full flex items-center gap-2 md:gap-3 px-4 py-3 md:py-3 text-sm text-left text-gray-300 hover:bg-white/10 transition-colors whitespace-nowrap min-h-[44px] md:min-h-0"
                    >
                      <Camera size={isMobile ? 18 : 16} className="text-purple-400 shrink-0" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowImageMenu(false);
                      }}
                      className="w-full flex items-center gap-2 md:gap-3 px-4 py-3 md:py-3 text-sm text-left text-gray-300 hover:bg-white/10 transition-colors border-t border-white/5 whitespace-nowrap min-h-[44px] md:min-h-0"
                    >
                      <ImagePlus size={isMobile ? 18 : 16} className="text-blue-400 shrink-0" />
                      <span>Choose from Gallery</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 md:p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-gray-400 hover:text-blue-400 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                title="Attach files"
              >
                <Paperclip size={isMobile ? 20 : 18} />
              </button>
              {/* Tutor Mode Features */}
              {appMode === 'tutor' && (
                <>
                  <button
                    onClick={() => documentInputRef.current?.click()}
                    className="p-2.5 md:p-2 rounded-lg bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 text-gray-400 hover:text-green-400 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                    title="Upload document (PDF, DOCX, TXT, MD)"
                  >
                    <FileText size={isMobile ? 20 : 18} />
                  </button>
                  <button
                    onClick={() => setShowCodeSandbox(!showCodeSandbox)}
                    className={cn(
                      "p-2.5 md:p-2 rounded-lg border transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center",
                      showCodeSandbox
                        ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                        : "bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 text-gray-400 hover:text-blue-400"
                    )}
                    title="Open Code Sandbox"
                  >
                    <Terminal size={isMobile ? 20 : 18} />
                  </button>
                  <button
                    onClick={() => setEnableWebSearch(!enableWebSearch)}
                    className={cn(
                      "p-2.5 md:p-2 rounded-lg border transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center",
                      enableWebSearch
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                        : "bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 text-gray-400 hover:text-blue-400"
                    )}
                    title="Enable Web Search (like Perplexity)"
                  >
                    <Search size={isMobile ? 20 : 18} />
                  </button>
                </>
              )}
            </div>

            <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 flex items-center gap-2 md:gap-2.5 flex-wrap justify-end">
              {/* Token Badge - Hide on very small screens */}
              {!isMobile && (
                <TokenBadge
                  tokensUsed={tokensUsed}
                  tokensLimit={FREE_TOKEN_LIMIT}
                  isSubscribed={isSubscribed}
                  compact={true}
                />
              )}

              <ProviderSelector
                value={provider}
                onChange={(p) => {
                  // Prevent selecting premium provider without subscription
                  if (p === 'openai' && !isSubscribed) {
                    setShowSubscriptionPopup(true);
                    return;
                  }
                  // Prevent selecting Grok if locked
                  if (p === 'grok' && isGrokLocked && !isSubscribed) {
                    alert('Kimi K2 token limit has been reached. Please recharge tokens to use Kimi K2, or select another provider.');
                    return;
                  }
                  setProvider(p);
                }}
                className={isMobile ? "text-xs" : "w-auto"}
                isSubscribed={isSubscribed}
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
                className="p-3 md:p-2.5 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 hover:from-purple-500 hover:via-purple-400 hover:to-blue-400 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 min-w-[48px] min-h-[48px] md:min-w-0 md:min-h-0 flex items-center justify-center"
              >
                <Send size={isMobile ? 20 : 16} />
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const workbenchContent = (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0e0e0e] to-[#0a0a0a] border-l border-white/5 font-sans relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3 pointer-events-none"></div>
      
      {/* Workbench Header */}
      <div className="relative z-[100] h-16 border-b border-white/5 flex items-center px-6 justify-between shrink-0 bg-gradient-to-r from-white/[0.02] to-white/[0.01] backdrop-blur-xl">
        <div className="flex items-center gap-3">
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                activeTab === 'preview' 
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Play size={14} className={activeTab === 'preview' ? "text-green-400" : ""} /> Preview
            </button>
            <button
              onClick={() => {
                setActiveTab('code');
                // Auto-select entry file if no file selected
                if (!selectedFile && fileManager.getEntry()) {
                  setSelectedFile(fileManager.getEntry());
                  if (!openFiles.includes(fileManager.getEntry()!)) {
                    setOpenFiles(prev => [...prev, fileManager.getEntry()!]);
                  }
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                activeTab === 'code' 
                  ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Code size={14} className={activeTab === 'code' ? "text-blue-400" : ""} /> Code
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <WorkspaceMenu
            onOpenComponents={() => setShowComponentLibrary(true)}
            onOpenGitHub={() => setShowGitHubIntegration(true)}
            onOpenHistory={() => setShowVersionHistory(true)}
          />
        </div>

        {activeTab === 'preview' && (
          <div className="hidden md:flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                previewDevice === 'desktop' 
                  ? "bg-white/10 text-white shadow-lg" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
              title="Desktop View"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                previewDevice === 'tablet' 
                  ? "bg-white/10 text-white shadow-lg" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
              title="Tablet View"
            >
              <Smartphone size={16} className="rotate-90" />
            </button>
             <button
              onClick={() => setPreviewDevice('mobile')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                previewDevice === 'mobile' 
                  ? "bg-white/10 text-white shadow-lg" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
              title="Mobile View"
            >
              <Smartphone size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {(currentCode || fileManager.getAllFiles().length > 0) && (
            <div className="relative">
              <DeployButton
                code={fileManager.getAllFiles().length > 0 ? fileManager.getAllFiles() : currentCode}
                projectName={`nevra-${sessionId || Date.now()}`}
                className="relative"
              />
            </div>
          )}
          <button
            onClick={downloadCurrentCode}
            disabled={!canExport}
            className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-white hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/10"
          >
            <Download size={14} /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative bg-[#050505]">
        {activeTab === 'code' ? (
          /* Code Editor Mode with FileTree */
          <div className="flex-1 flex h-full">
            {/* FileTree Sidebar */}
            {fileManager.getAllFiles().length > 0 && (
              <div className="w-64 shrink-0 border-r border-white/5">
                <FileTree
                  files={fileManager.getAllFiles()}
                  selectedFile={selectedFile}
                  onSelectFile={(path) => {
                    setSelectedFile(path);
                    if (!openFiles.includes(path)) {
                      setOpenFiles(prev => [...prev, path]);
                    }
                  }}
                  onNewFile={(parentPath) => {
                    const newPath = parentPath 
                      ? `${parentPath}/new-file.tsx`
                      : `src/components/new-file.tsx`;
                    fileManager.addFile(newPath, '', 'component');
                    setSelectedFile(newPath);
                    setOpenFiles(prev => [...prev, newPath]);
                  }}
                  onDeleteFile={(path) => {
                    fileManager.deleteFile(path);
                    setOpenFiles(prev => prev.filter(p => p !== path));
                    if (selectedFile === path) {
                      const remaining = fileManager.getAllFiles();
                      setSelectedFile(remaining.length > 0 ? remaining[0].path : null);
                    }
                  }}
                  onRenameFile={(oldPath, newPath) => {
                    const file = fileManager.getFile(oldPath);
                    if (file) {
                      fileManager.deleteFile(oldPath);
                      fileManager.addFile(newPath, file.content, file.type);
                      setOpenFiles(prev => prev.map(p => p === oldPath ? newPath : p));
                      if (selectedFile === oldPath) {
                        setSelectedFile(newPath);
                      }
                    }
                  }}
                  entry={fileManager.getEntry()}
                />
              </div>
            )}

            {/* Code Editor Area */}
            <div className="flex-1 flex flex-col">
              {/* File Tabs */}
              {openFiles.length > 0 && (
                <div className="flex items-center gap-1 bg-[#0e0e0e] border-b border-white/5 px-2 overflow-x-auto">
                  {openFiles.map(path => {
                    const file = fileManager.getFile(path);
                    return (
                      <div
                        key={path}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 text-sm rounded-t-lg transition-colors whitespace-nowrap",
                          selectedFile === path
                            ? "bg-[#0a0a0a] text-white border-t border-l border-r border-white/10"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <button
                          onClick={() => setSelectedFile(path)}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <FileCode size={12} />
                          <span className="truncate max-w-[120px]">{path.split('/').pop()}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFiles(prev => prev.filter(p => p !== path));
                            if (selectedFile === path) {
                              const remaining = openFiles.filter(p => p !== path);
                              setSelectedFile(remaining.length > 0 ? remaining[0] : null);
                            }
                          }}
                          className="ml-1 p-0.5 hover:bg-white/10 rounded shrink-0"
                          title="Close file"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Code Quality Panel */}
              {(typescriptErrors.length > 0 || lintErrors.length > 0) && (
                <div className="border-t border-white/5 p-3">
                  <CodeQualityPanel
                    typescriptErrors={typescriptErrors}
                    lintErrors={lintErrors}
                    onFixAll={() => {
                      const file = fileManager.getFile(selectedFile);
                      if (file) {
                        const fixed = autoFix(file.content, lintErrors);
                        fileManager.addFile(selectedFile, fixed, file.type);
                        if (selectedFile === fileManager.getEntry()) {
                          setCurrentCode(fixed);
                        }
                        setLintErrors([]);
                      }
                    }}
                    onRefresh={() => {
                      const file = fileManager.getFile(selectedFile);
                      if (file) {
                        if (selectedFile.endsWith('.ts') || selectedFile.endsWith('.tsx')) {
                          setTypeScriptErrors(checkTypeScript(file.content));
                        }
                        setLintErrors(lintCode(file.content));
                      }
                    }}
                  />
                </div>
              )}

              {/* Code Editor */}
              {selectedFile ? (
                <CodeEditor
                  value={fileManager.getFile(selectedFile)?.content || ''}
                  onChange={(newContent) => {
                    const file = fileManager.getFile(selectedFile);
                    if (file) {
                      // Track undo/redo
                      undoRedoManager.mergeConsecutiveEdits(selectedFile, newContent);
                      
                      fileManager.addFile(selectedFile, newContent, file.type);
                      // Update currentCode if it's the entry file
                      if (selectedFile === fileManager.getEntry()) {
                        setCurrentCode(newContent);
                      }
                      
                      // Run code quality checks
                      if (selectedFile.endsWith('.ts') || selectedFile.endsWith('.tsx')) {
                        const tsErrors = checkTypeScript(newContent);
                        setTypeScriptErrors(tsErrors);
                      }
                      const lintErrs = lintCode(newContent);
                      setLintErrors(lintErrs);
                    }
                  }}
                  language={
                    selectedFile.endsWith('.tsx') ? 'tsx' :
                    selectedFile.endsWith('.jsx') ? 'jsx' :
                    selectedFile.endsWith('.css') ? 'css' :
                    selectedFile.endsWith('.html') ? 'html' :
                    selectedFile.endsWith('.json') ? 'json' :
                    'typescript'
                  }
                  filePath={selectedFile}
                  onSave={() => {
                    // Auto-format on save
                    const file = fileManager.getFile(selectedFile);
                    if (file) {
                      const formatted = formatCode(file.content, 
                        selectedFile.endsWith('.tsx') ? 'tsx' :
                        selectedFile.endsWith('.jsx') ? 'jsx' :
                        selectedFile.endsWith('.ts') ? 'typescript' :
                        selectedFile.endsWith('.css') ? 'css' :
                        'typescript'
                      );
                      fileManager.addFile(selectedFile, formatted, file.type);
                      if (selectedFile === fileManager.getEntry()) {
                        setCurrentCode(formatted);
                      }
                    }
                    setLogs(prev => [...prev, `> Saved ${selectedFile}`]);
                  }}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FileCode size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No file selected</p>
                    <p className="text-sm mt-2">Select a file from the tree or generate code</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'preview' ? (
          <div className="flex-1 flex flex-col h-full overflow-auto items-center justify-start p-4 py-6 relative bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px] min-h-0">
            {/* Address Bar - Floating */}
             <div className={cn(
               "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 text-xs text-gray-400 flex items-center gap-4 shadow-2xl mb-6 transition-all duration-500 shrink-0 z-10 group hover:border-white/20",
               previewDevice === 'desktop' ? "w-[600px] max-w-[calc(100%-2rem)]" : "w-[300px] max-w-[calc(100%-2rem)]"
             )}>
                <div className="flex gap-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-500/40 group-hover:bg-red-500/60 transition-colors"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/40 group-hover:bg-yellow-500/60 transition-colors"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/40 group-hover:bg-green-500/60 transition-colors"></div>
                </div>
                <div className="flex-1 text-center font-mono text-gray-400 flex items-center justify-center gap-2.5 min-w-0">
                  <Globe size={12} className="shrink-0 text-gray-500" />
                  <span className="truncate font-medium">localhost:3000</span>
                </div>
                 <button 
                   onClick={() => setRefreshKey(k => k + 1)} 
                   className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all shrink-0"
                 >
                   <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
                 </button>
             </div>

            {/* Iframe Preview Container - Responsive Scaling */}
            <div 
              ref={previewContainerRef}
              className={cn(
                "relative z-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] shadow-2xl origin-center flex flex-col shrink-0",
                previewDevice === 'mobile' ? "w-[375px] h-[812px] rounded-[3rem] border-[8px] border-[#1a1a1a] bg-black" :
                previewDevice === 'tablet' ? "w-[768px] h-[1024px] rounded-[2rem] border-[8px] border-[#1a1a1a] bg-black" :
                "w-full h-full max-w-full max-h-full rounded-t-xl border-t border-l border-r border-white/10"
              )}
              style={
                previewDevice === 'mobile' || previewDevice === 'tablet' 
                  ? {
                      transform: `scale(${deviceScale})`,
                      transformOrigin: 'center',
                      margin: '0 auto'
                    }
                  : undefined
              }>
              {/* Mobile Notch / Camera for Mobile View */}
              {previewDevice === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-[#1a1a1a] rounded-b-xl z-20 pointer-events-none"></div>
              )}

              {/* Status Bar Mockup for Mobile */}
               {previewDevice === 'mobile' && (
                 <div className="h-10 w-full bg-white flex items-center justify-between px-6 text-[10px] font-bold text-black rounded-t-[2.5rem] z-10 shrink-0">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <Code size={10} fill="black" />
                      <div className="w-4 h-2.5 border border-black rounded-[2px] relative">
                         <div className="absolute inset-0.5 bg-black"></div>
                      </div>
                    </div>
                 </div>
               )}

              <div className={cn(
                "flex-1 bg-white relative overflow-hidden min-h-0 flex flex-col",
                previewDevice === 'mobile' ? "rounded-b-[2.5rem]" :
                previewDevice === 'tablet' ? "rounded-[1.5rem]" :
                "rounded-t-lg"
              )}>
                {!isSubscribed && hasExceeded && (
                  <div className="absolute inset-0 z-30 bg-white/90 backdrop-blur flex flex-col items-center justify-center text-center px-6">
                    <div className="text-lg font-semibold text-gray-800 mb-2">Quota reached</div>
                    <p className="text-sm text-gray-600 mb-4">Upgrade to continue generating previews.</p>
                  </div>
                )}

                {(currentCode || fileManager.getEntry()) ? (
                  <>
                    <iframe
                      ref={previewIframeRef}
                      key={refreshKey}
                      src={getIframeSrc(
                        currentCode || 
                        fileManager.getFile(fileManager.getEntry())?.content || 
                        ''
                      )}
                      className="w-full h-full border-none bg-white flex-1 min-h-0"
                      title="Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        flex: '1 1 0',
                        minHeight: 0
                      }}
                    />
                    {activeTab === 'visual' && (
                      <VisualEditor
                        iframeRef={previewIframeRef}
                        onUpdateCode={(updatedCode) => {
                          const entry = fileManager.getEntry();
                          if (entry) {
                            fileManager.addFile(entry, updatedCode, 'page');
                            setCurrentCode(updatedCode);
                            setRefreshKey(k => k + 1);
                          }
                        }}
                        code={currentCode || fileManager.getFile(fileManager.getEntry())?.content || ''}
                        isActive={activeTab === 'visual'}
                      />
                    )}
                    
                    {/* Deploy Button - Bottom Left (Desktop only) - Positioned above terminal */}
                    {previewDevice === 'desktop' && (currentCode || fileManager.getAllFiles().length > 0) && (
                      <DeployButton
                        code={fileManager.getAllFiles().length > 0 ? fileManager.getAllFiles() : currentCode}
                        projectName={`nevra-${sessionId || Date.now()}`}
                        terminalOpen={terminalOpen}
                        terminalHeight={terminalOpen ? 288 : 40}
                        className="absolute"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-5 bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] min-h-[200px] flex-1">
                     <div className="relative">
                       <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-100 to-blue-100 shadow-2xl flex items-center justify-center animate-pulse">
                         <Layout size={40} className="text-purple-500/60" />
                       </div>
                       <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400/20 to-blue-400/20 blur-xl animate-pulse"></div>
                     </div>
                     <div className="text-center">
                       <p className="text-base font-semibold text-gray-700 mb-1">Ready to build</p>
                       <p className="text-sm text-gray-500">Your generated app will appear here</p>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            <div className="w-56 border-r border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#080808] flex flex-col">
              <div className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2.5 border-b border-white/5">
                <div className="w-5 h-5 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Folder size={12} className="text-blue-400" />
                </div>
                <span>Explorer</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                {files.map(file => <FileTreeItem key={file.name} node={file} />)}
              </div>
            </div>
            {/* Code Editor */}
            <div className="flex-1 bg-gradient-to-br from-[#0e0e0e] to-[#0a0a0a] overflow-hidden flex flex-col">
              <div className="h-11 bg-gradient-to-r from-[#0a0a0a] to-[#0c0c0c] border-b border-white/5 flex items-center px-5 gap-3">
                <div className="w-6 h-6 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <FileCode size={14} className="text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-gray-300">App.tsx</span>
                <div className="flex-1" />
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <span>TypeScript</span>
                  <span>•</span>
                  <span>HTML</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                <SyntaxHighlighter
                  language="typescript"
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '13px', lineHeight: '1.6' }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {currentCode || '// No code generated yet\n// Start building your app by describing it in the chat!'}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}

        {/* Terminal */}
        <div className={cn("border-t border-white/5 bg-gradient-to-t from-[#0a0a0a] to-[#0c0c0c] transition-all duration-300 flex flex-col absolute bottom-0 left-0 right-0 z-40 shadow-2xl backdrop-blur-xl", terminalOpen ? "h-72" : "h-10")}>
          <div
            className="h-10 flex items-center px-4 gap-3 cursor-pointer hover:bg-white/5 border-b border-white/5 bg-gradient-to-r from-[#111] to-[#0f0f0f] transition-colors"
            onClick={() => setTerminalOpen(!terminalOpen)}
          >
            <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
              <TerminalIcon size={12} className="text-purple-400" />
            </div>
            <span className="text-xs font-mono font-semibold text-gray-300">Terminal</span>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
               {terminalOpen && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); setLogs([]); }} 
                   className="text-[10px] font-medium text-gray-500 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
                 >
                   Clear
                 </button>
               )}
               <ChevronDown size={14} className={cn("text-gray-500 transition-transform duration-300", terminalOpen ? "" : "rotate-180")} />
            </div>
          </div>
          {terminalOpen && (
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 bg-[#0a0a0a] scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
              {logs.length === 0 ? (
                <div className="text-gray-600 text-center py-8">No logs yet...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-gray-400 border-b border-white/5 pb-1 mb-1 last:border-0 leading-relaxed">
                    <span className="text-purple-400/60">$</span> {log}
                  </div>
                ))
              )}
              <div className="flex items-center gap-2 text-gray-500 pt-3 mt-2 border-t border-white/5">
                <span className="text-green-400 font-bold">➜</span>
                <span className="text-blue-400">~</span>
                <span className="animate-pulse text-gray-400">_</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Handle voice call message
  const handleVoiceMessage = async (text: string, isAI: boolean = false) => {
    const message: Message = {
      id: Date.now().toString(),
      role: isAI ? 'ai' : 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);

    // Save to database if session exists
    if (sessionId && user) {
      try {
        const token = await getToken({ template: SUPABASE_TEMPLATE }).catch(() => null);
        await saveMessage(sessionId, isAI ? 'ai' : 'user', text, undefined, undefined, token);
      } catch (error) {
        console.error('Error saving voice message:', error);
      }
    }
  };

  return (
    <>
      <SubscriptionPopup
        isOpen={showSubscriptionPopup}
        onClose={() => {
          setShowSubscriptionPopup(false);
          // Refresh limits after closing (in case user recharged)
          refreshLimit();
          refreshGrokLimit();
        }}
        tokensUsed={tokensUsed}
        tokensLimit={FREE_TOKEN_LIMIT}
        onSelectFree={() => {
          setFreeFallback(true);
          setProvider('groq');
          setShowSubscriptionPopup(false);
          // Refresh limits
          refreshLimit();
          refreshGrokLimit();
        }}
      />
      <FeedbackPopup
        isOpen={showFeedbackPopup}
        onClose={() => setShowFeedbackPopup(false)}
      />
      {/* Voice Call Modal - Only for Tutor Mode */}
      {appMode === 'tutor' && (
        <VoiceCall
          isOpen={showVoiceCall}
          onClose={() => setShowVoiceCall(false)}
          provider={provider}
          sessionId={sessionId}
          onMessage={handleVoiceMessage}
        />
      )}
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : !appMode ? (
        <ModeSelection onSelect={handleModeSelect} />
      ) : (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
          {isMobile ? (
            /* MOBILE LAYOUT */
            <div className="flex flex-col h-full w-full relative">
              <div className="flex-1 relative overflow-hidden">
                {/* Chat Layer */}
                <div className={cn("absolute inset-0 w-full h-full transition-transform duration-300", mobileTab === 'chat' ? 'translate-x-0' : '-translate-x-full')}>
                  {chatContent}
                </div>

                {/* Workbench Layer */}
                {appMode === 'builder' && (
                  <div className={cn("absolute inset-0 w-full h-full transition-transform duration-300 bg-[#0e0e0e]", mobileTab === 'workbench' ? 'translate-x-0' : 'translate-x-full')}>
                    {workbenchContent}
                  </div>
                )}
              </div>

              {/* Mobile Nav */}
              {appMode === 'builder' && (
                <div className="h-16 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-around shrink-0 z-20 pb-safe px-safe">
                  <button
                    onClick={() => setMobileTab('chat')}
                    className={cn("flex flex-col items-center gap-1 p-3 md:p-2 rounded-lg transition-colors min-w-[60px] min-h-[60px] md:min-w-0 md:min-h-0 flex-shrink-0", mobileTab === 'chat' ? "text-purple-400" : "text-gray-500")}
                  >
                    <MessageSquare size={22} />
                    <span className="text-[10px] font-medium">Chat</span>
                  </button>
                  <div className="w-[1px] h-8 bg-white/5"></div>
                  <button
                    onClick={() => setMobileTab('workbench')}
                    className={cn("flex flex-col items-center gap-1 p-3 md:p-2 rounded-lg transition-colors min-w-[60px] min-h-[60px] md:min-w-0 md:min-h-0 flex-shrink-0", mobileTab === 'workbench' ? "text-blue-400" : "text-gray-500")}
                  >
                    <Layout size={22} />
                    <span className="text-[10px] font-medium">Workbench</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* DESKTOP LAYOUT */
            <PanelGroup direction="horizontal">
              {/* Panel 1: Chat */}
              <Panel defaultSize={appMode === 'tutor' ? 100 : 40} minSize={30} className="flex flex-col border-r border-white/10 bg-[#0a0a0a]">
                {chatContent}
              </Panel>

              {/* Panel 2: Workbench */}
              {appMode === 'builder' && (
                <>
                  <PanelResizeHandle className="w-[1px] bg-white/10 hover:bg-purple-500 transition-colors cursor-col-resize" />
                  <Panel className="flex flex-col bg-[#0e0e0e]">
                    {workbenchContent}
                  </Panel>
                </>
              )}
            </PanelGroup>
          )}
        </div>
      )}

      {/* Component Library Modal */}
      <ComponentLibrary
        isOpen={showComponentLibrary}
        onClose={() => setShowComponentLibrary(false)}
        onSelectComponent={(component) => {
          // Insert component code into current file
          if (selectedFile) {
            const file = fileManager.getFile(selectedFile);
            if (file) {
              const newContent = file.content + '\n\n' + component.code;
              fileManager.addFile(selectedFile, newContent, file.type);
              if (selectedFile === fileManager.getEntry()) {
                setCurrentCode(newContent);
              }
              setRefreshKey(k => k + 1);
            }
          } else {
            // If no file selected, create new component file
            const componentPath = `src/components/${component.name.replace(/\s+/g, '')}.tsx`;
            fileManager.addFile(componentPath, component.code, 'component');
            setSelectedFile(componentPath);
            setOpenFiles(prev => [...prev, componentPath]);
          }
        }}
      />

      {/* GitHub Integration Modal */}
      <GitHubIntegration
        isOpen={showGitHubIntegration}
        onClose={() => setShowGitHubIntegration(false)}
        files={fileManager.getAllFiles()}
        framework={fileManager.exportAsProject().framework}
        projectName={`nevra-${sessionId || Date.now()}`}
      />

      {/* Version History Modal */}
      <VersionHistory
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={(files) => {
          fileManager.clear();
          files.forEach(file => {
            fileManager.addFile(file.path, file.content, file.type);
          });
          if (files.length > 0) {
            fileManager.setEntry(files[0].path);
            setSelectedFile(files[0].path);
            setOpenFiles([files[0].path]);
            setCurrentCode(files[0].content);
          }
          setRefreshKey(k => k + 1);
        }}
      />

      {/* Code Sandbox Modal (Tutor Mode) */}
      {appMode === 'tutor' && showCodeSandbox && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Code Sandbox</h2>
              <button
                onClick={() => setShowCodeSandbox(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-4">
              <CodeSandbox language="javascript" />
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal (Tutor Mode) */}
      {appMode === 'tutor' && showDocumentViewer && uploadedDocument && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
            <DocumentViewer
              document={uploadedDocument}
              onClose={() => setShowDocumentViewer(false)}
            />
          </div>
        </div>
      )}

      {/* Search Results Panel (Tutor Mode) */}
      {appMode === 'tutor' && searchResults.length > 0 && (
        <div className="fixed right-4 bottom-20 w-96 max-h-96 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 backdrop-blur-xl">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Search size={16} className="text-blue-400" />
              Search Results
            </h3>
            <button
              onClick={() => setSearchResults([])}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-80">
            <SearchResults results={searchResults} />
          </div>
        </div>
      )}

      {/* Planner Panel (Builder Mode) */}
      {appMode === 'builder' && showPlanner && currentPlan && (
        <div className="fixed right-4 top-20 bottom-20 w-96 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 backdrop-blur-xl flex flex-col">
          <PlannerPanel
            plan={currentPlan}
            onPlanUpdate={(updatedPlan) => {
              setCurrentPlan(updatedPlan);
            }}
            onStartGeneration={() => {
              setShowPlanner(false);
              // Proceed with code generation
              handleSend(input, 'builder');
            }}
            onClose={() => setShowPlanner(false)}
            className="flex-1"
          />
        </div>
      )}
    </>
  );
};

export default ChatInterface;

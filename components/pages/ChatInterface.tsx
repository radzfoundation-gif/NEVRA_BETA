import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Menu, Plus, MessageSquare, User,
  Code, Play, Layout, Smartphone, Monitor, Download,
  X, Settings, ChevronRight, ChevronDown, FileCode,
  Folder, Terminal as TerminalIcon, RefreshCw, Globe,
  CheckCircle2, Loader2, GraduationCap, Brain, Bot, Paperclip, Image as ImageIcon, Trash2, AlertTriangle, Phone, Lock, Camera, ImagePlus, Clock, Undo2, Redo2, Github, Search, FileText, Terminal, MoreVertical, Copy, Eye, ZoomIn, ZoomOut, Type, Palette, Save, Sparkles, Zap, ThumbsUp, ThumbsDown, Check, BarChart3, Share, RefreshCcw, MoreHorizontal, Youtube, Pencil, PanelLeft
} from 'lucide-react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateCode, AIProvider, Framework } from '@/lib/ai';
import { CodebaseExplorer as CodebaseExplorerClass, CodebaseAnalysis } from '@/lib/codebaseExplorer';
import CodebaseExplorer from '@/components/CodebaseExplorer';
import BuildingAnimation from '@/components/BuildingAnimation';
import TypewriterText from '@/components/ui/TypewriterText';
import AILoading from '@/components/ui/AILoading';
import DynamicBackground from '@/components/ui/DynamicBackground';
// ProviderSelector removed - orchestrator now manages models automatically
import FrameworkSelector from '@/components/ui/FrameworkSelector';
import StreamingResponse from '@/components/ui/StreamingResponse';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Build error fix: Import CSS here

import SubscriptionPopup from '../SubscriptionPopup';
import { useTokenLimit, useTrackAIUsage } from '@/hooks/useTokenLimit';
import { FREE_TOKEN_LIMIT } from '@/lib/tokenLimit';
import { createChatSession, saveMessage, getSessionMessages, updateChatSession, getUserSessions, shareChatSession } from '@/lib/supabaseDatabase';
import { useUser, useAuth } from '@/lib/authContext';
import FeedbackPopup from '../FeedbackPopup';
import { useUserPreferences, useChatSessions } from '@/hooks/useSupabase';
import Logo from '../Logo';
const VoiceCall = React.lazy(() => import('../VoiceCall'));
import Sidebar from '../Sidebar';
// Lazy load heavy components
const FileTree = React.lazy(() => import('../FileTree'));
const CodeEditor = React.lazy(() => import('../CodeEditor'));
const VisualEditor = React.lazy(() => import('../VisualEditor'));
const CodeQualityPanel = React.lazy(() => import('../CodeQualityPanel'));
const VersionHistory = React.lazy(() => import('../VersionHistory'));
const ComponentLibrary = React.lazy(() => import('../ComponentLibrary'));
const GitHubIntegration = React.lazy(() => import('../GitHubIntegration'));
import WorkspaceMenu from '../WorkspaceMenu';
import { FileManager, ProjectFile } from '@/lib/fileManager';
import { Component, getComponentLibrary } from '@/lib/componentLibrary';
import { CodeResponse } from '@/lib/ai';
import { checkTypeScript, TypeError } from '@/lib/typescript';
import { lintCode, autoFix, LintError } from '@/lib/eslint';
import { formatCode } from '@/lib/prettier';
import { ResearchWelcome } from '../ResearchWelcome';
import { getVersionManager } from '@/lib/versionManager';
import { getUndoRedoManager } from '@/lib/undoRedo';
import { performWebSearch, combineSearchAndResponse, SearchResult } from '@/lib/webSearch';
import { parseDocument, ParsedDocument } from '@/lib/documentParser';
import { processUploadedFile } from '@/lib/chat/processUploadedFile';
import SearchResults from '../SearchResults';
import CodeSandbox from '../CodeSandbox';
import DocumentViewer from '../DocumentViewer';
import PlannerPanel from '../PlannerPanel';
import { generatePlan, Plan } from '@/lib/agenticPlanner';
import DesignSystemManager from '../DesignSystemManager';
import { designSystemManager, DesignSystem } from '@/lib/designSystem';
// DatabasePanel removed - using Firebase instead of Supabase
import APIIntegrationWizard from '../APIIntegrationWizard';
const MobileGenerator = React.lazy(() => import('../MobileGenerator'));
// Learning Features
import { QuizPanel, NoteEditor, LearningDashboard, FlashcardReview } from '@/components/learning';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import { generateQuiz, generateLearningPath, generatePracticeProblem } from '@/lib/learning';
import { createNote } from '@/lib/learning/notesManager';
import { createFlashcard } from '@/lib/learning/flashcardManager';

import { detectMode, AppMode } from '@/lib/modeDetector';
import { getIframeSrc, extractTextFromErrorHtml, extractCode } from '@/lib/previewUtils';
import ChatInput from '@/components/chat/ChatInput';
import ChatTerminal from '@/components/chat/ChatTerminal';
import PreviewContainer from '@/components/chat/PreviewContainer';
import { SourcesIndicator } from '@/components/chat/SourcesIndicator';
import CanvasBoard from '@/components/canvas/CanvasBoard';
import InteractiveQAWidget from '@/components/ui/InteractiveQAWidget';
import { parseClarificationFromAIResponse } from '@/lib/clarificationParser';
import { ModelType } from '@/components/ui/ModelSelector';
import { useDualStream } from '@/hooks/useDualStream';

// --- Types ---

// --- Types ---

export type Attachment = {
  type: 'file' | 'audio' | 'youtube' | 'url';
  name: string;
  content: string;
  mimeType?: string;
};

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  code?: string;
  images?: string[]; // Array of base64 strings
  attachments?: Attachment[];
  timestamp: Date;
  isComparison?: boolean;
  contentA?: string;
  contentB?: string;
  modelA?: string;
  modelB?: string;
  selectedVersion?: 'a' | 'b';
};

type FileNode = {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
};

// --- Utility ---
const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

// --- Splash Screen Component ---
const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#FFF8F0] via-[#F5F3FF] to-[#F0F8FF] text-gray-800">
      <div className="text-center space-y-6 animate-pulse">
        <div className="w-16 h-16 mx-auto flex items-center justify-center text-[#7C3AED]">
          <Logo size={64} />
        </div>
        <h1 className="text-3xl font-display font-bold tracking-widest text-[#7C3AED]">ai.ua</h1>
        <p className="text-sm text-gray-400">Initializing...</p>
      </div>
    </div>
  );
};

// --- Mode Selection Component ---
// ModeSelection component removed - mode is now auto-detected from Home.tsx prompt

// --- Main Chat Interface ---
const ChatInterface: React.FC = () => {
  const { user } = useUser();
  const { id: sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Use dynamic viewport height (dvh) for better mobile support
  // The main container will be controlled by parent layout, but we ensure content fills it
  // We'll add a class to the outer container in the return statement if needed, 
  // but looking at Home.tsx, this component is likely rendered inside a layout.
  // We will assume the parent provides the height, but we'll ensure this component fills it.

  // Helper: Get optimal provider for mode (moved outside component to be accessible)
  const getOptimalProviderForMode = (mode: AppMode | null, isSubscribed: boolean = false): AIProvider => {
    if (!mode) return 'groq'; // Default to Gemini Flash Lite (SumoPod)

    if (mode === 'builder') {
      // Builder mode: Gemini Flash Lite (SumoPod)
      return 'groq'; // Gemini Flash Lite for code generation
    } else if (mode === 'canvas') {
      // Canvas mode requires vision capabilities
      return 'groq'; // Gemini Flash Lite for vision
    } else {
      // Tutor mode: Gemini Flash Lite (SumoPod)
      return 'groq'; // Gemini Flash Lite for Tutor mode (default)
    }
  };

  // Helper: Get initial state safely
  const getInitialState = () => {
    const initialPrompt = location.state?.initialPrompt;
    const initialProvider = location.state?.initialProvider as AIProvider;
    const initialImages = location.state?.initialImages as string[];
    const initialAttachments = location.state?.initialAttachments as Attachment[];
    const targetFile = location.state?.targetFile as string | undefined;
    const codebaseMode = location.state?.mode === 'codebase';
    // Check for explicit mode passed from Home (e.g. for silent canvas activation)
    const explicitMode = location.state?.mode as AppMode;
    const enableWebSearch = location.state?.enableWebSearch as boolean | undefined;

    if (initialPrompt || (initialImages && initialImages.length > 0)) {
      // Use explicit mode if provided, otherwise detect
      const detectedMode = explicitMode
        ? explicitMode
        : (codebaseMode ? 'builder' : (initialPrompt ? detectMode(initialPrompt) : 'tutor'));
      const userMsgId = Date.now().toString();
      const content = initialPrompt || "Analyzing image...";

      // Get optimal provider for detected mode (default to Mistral Devstral for free users)
      const optimalProvider = initialProvider || getOptimalProviderForMode(detectedMode, false);

      const autoSend = location.state?.autoSend !== undefined ? location.state.autoSend : true;

      return {
        mode: detectedMode,
        messages: [{
          id: userMsgId,
          role: 'user',
          content: content,
          images: initialImages,
          attachments: initialAttachments,
          timestamp: new Date()
        }] as Message[],
        shouldAutoSend: autoSend,
        initialProvider: optimalProvider,
        initialImages: initialImages || [],
        targetFile: targetFile,
        codebaseMode: codebaseMode || false,
        enableWebSearch: enableWebSearch ?? false
      };
    }

    // If no prompt/images but explicit mode is provided (e.g. silent canvas open)
    if (explicitMode) {
      return {
        mode: explicitMode,
        messages: [],
        shouldAutoSend: false,
        initialProvider: 'groq' as AIProvider,
        initialImages: [],
        targetFile: undefined,
        codebaseMode: false,
        enableWebSearch: enableWebSearch ?? false
      };
    }
    // Default to tutor mode if no prompt (auto-detect from Home.tsx)
    return { mode: 'tutor' as AppMode, messages: [], shouldAutoSend: false, initialProvider: 'groq' as AIProvider, initialImages: [], targetFile: undefined, codebaseMode: false, enableWebSearch: enableWebSearch ?? false };
  };

  const initialState = getInitialState();
  const [templateName, setTemplateName] = useState<string | undefined>((initialState as any).templateName);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [answeredClarifications, setAnsweredClarifications] = useState<Record<string, boolean>>({});

  // Hydrate state from navigation (Fix for Image Generation output)
  useEffect(() => {
    if (location.state?.generatedImage && location.state?.initialPrompt) {
      const { generatedImage, initialPrompt } = location.state;

      setMessages(current => {
        // Prevent duplicates
        if (current.some(m => m.images?.includes(generatedImage))) return current;

        // Reset to just these messages to ensure clean state for new generation result
        return [
          {
            id: Date.now().toString(),
            role: 'user',
            content: initialPrompt,
            images: [],
            timestamp: new Date()
          },
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: `Here is your generated image based on: "${initialPrompt}"\n\n![Generated Image](${generatedImage})`,
            images: [generatedImage],
            timestamp: new Date(Date.now() + 100)
          }
        ];
      });

      // Update provider to generate image model if needed
      setProvider('gpt-image-1' as AIProvider); // Or compatible model
    }
  }, [location.state]);

  // Token Limit Hooks
  const { hasExceeded, isSubscribed, refreshLimit, tokensUsed, incrementTokenUsage, loading: tokenLoading, checkFeatureLimit, incrementFeatureUsage, featureUsage, credits, softLimitReached } = useTokenLimit();

  // Check chat limit before sending message
  const checkChatLimit = (): boolean => {
    const chatStatus = checkFeatureLimit('chat');
    if (chatStatus.exceeded) {
      setShowSubscriptionPopup(true);
      return false;
    }
    return true;
  };

  // Sidebar Collapse State - default to collapsed (welcome screen shows first)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return true; // Default collapsed for clean welcome screen
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', String(newState));
      return newState;
    });
  };

  // Global State
  const [comparisonMode, setComparisonMode] = useState(false);
  const dualStream = useDualStream();
  const [appMode, setAppMode] = useState<AppMode>(initialState.mode);
  // Always use React framework (not HTML) - auto-explore codebase
  const initialFramework = (initialState as any).framework || 'react';
  const [framework, setFramework] = useState<Framework>(initialFramework);

  // Codebase mode state (from Home.tsx navigation)
  const [codebaseMode] = useState<boolean>((initialState as any).codebaseMode || false);
  const [targetFile] = useState<string | undefined>((initialState as any).targetFile);

  // Get optimal default provider based on mode
  const getDefaultProvider = (mode: AppMode | null): AIProvider => {
    if (!mode) return 'groq'; // Default to Groq (SumoPod/Gemini)
    return getOptimalProviderForMode(mode, isSubscribed);
  };

  const defaultProvider = initialState.initialProvider || getDefaultProvider(initialState.mode);
  const [provider, setProvider] = useState<AIProvider>(defaultProvider as AIProvider);

  // Auto-switch provider when mode changes - DISABLED FOR TESTING
  // useEffect(() => {
  //   if (appMode) {
  //     const optimalProvider = getOptimalProviderForMode(appMode, isSubscribed, false);
  //     if (provider !== optimalProvider) {
  //       console.log(`🔄 Auto-switching provider: ${provider} → ${optimalProvider} (mode: ${appMode})`);
  //       setProvider(optimalProvider);
  //     }
  //   }
  // }, [appMode, isSubscribed, false, provider]);

  // Update provider if Grok becomes locked/unlocked - DISABLED FOR TESTING
  // useEffect(() => {
  //   if (provider === 'gemini' && false && !isSubscribed) {
  //     const fallbackProvider = getOptimalProviderForMode(appMode, isSubscribed, false);
  //     console.log(`🔄 Grok locked, switching to ${fallbackProvider}`);
  //     setProvider(fallbackProvider);
  //   }
  // }, [false, isSubscribed, provider, appMode]);
  // Skip splash screen if we have initial prompt or mode is already set
  const [showSplash, setShowSplash] = useState(!initialState.shouldAutoSend && !initialState.mode);

  // Chat State
  const [messages, setMessages] = useState<Message[]>(initialState.messages);

  // Automatically collapse sidebar on ResearchWelcome screen (empty chat)
  // and expand it back when messages exist
  useEffect(() => {
    if (messages.length === 0) {
      setIsSidebarCollapsed(true);
    } else {
      // Restore sidebar when user has active chat messages
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved !== 'true') {
        setIsSidebarCollapsed(false);
      }
    }
  }, [messages.length]);
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<{ status: string; message: string } | null>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>(initialState.initialImages || []);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const MAX_IMAGES = 3;
  // AI Memory State - History yang akan dikirim ke AI
  const [aiMemoryHistory, setAiMemoryHistory] = useState<Message[]>([]);
  const [lastResetTime, setLastResetTime] = useState<Date | null>(null);

  // Model Selection State (Controlled from here)
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    (location.state?.model as ModelType) || 'sonar'
  );
  const [withReasoning, setWithReasoning] = useState<boolean>(
    (location.state?.reasoning as boolean) ?? true
  );

  // Sync Dual Stream content with message state
  useEffect(() => {
    if (dualStream.isStreaming) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.isComparison) {
          const newMessages = [...prev];
          newMessages[prev.length - 1] = { 
            ...lastMsg, 
            contentA: dualStream.streamA.content, 
            contentB: dualStream.streamB.content 
          };
          return newMessages;
        }
        return prev;
      });
    }
  }, [dualStream.streamA.content, dualStream.streamB.content, dualStream.isStreaming]);


  // Helper: Get current WIB time
  const getWIBTime = (): Date => {
    const now = new Date();
    // Convert to WIB (UTC+7)
    const wibOffset = 7 * 60 * 60 * 1000;
    return new Date(now.getTime() + wibOffset);
  };

  // Helper: Check if it's past 12:00 WIB today
  const shouldResetMemory = (): boolean => {
    const wibTime = getWIBTime();
    const hour = wibTime.getUTCHours();
    const minute = wibTime.getUTCMinutes();

    // Check if it's 12:00 WIB or later
    if (hour > 12 || (hour === 12 && minute >= 0)) {
      const today = wibTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const lastReset = localStorage.getItem('noir_ai_memory_last_reset');

      // Reset if we haven't reset today yet
      if (lastReset !== today) {
        return true;
      }
    }
    return false;
  };

  // Reset AI memory at 12:00 WIB daily
  useEffect(() => {
    const checkAndReset = () => {
      if (shouldResetMemory()) {
        const wibTime = getWIBTime();
        const today = wibTime.toISOString().split('T')[0];

        console.log('🔄 Resetting AI memory - Daily reset at 12:00 WIB');
        setAiMemoryHistory([]);
        setLastResetTime(new Date());
        localStorage.setItem('noir_ai_memory_last_reset', today);
      }
    };

    // Check immediately
    checkAndReset();

    // Check every minute to catch 12:00 WIB
    const interval = setInterval(checkAndReset, 60000);

    return () => clearInterval(interval);
  }, []);

  // Update AI memory when messages change (only if token available)
  useEffect(() => {
    // Only update memory if token is available
    if (isSubscribed) {
      // Subscribed users always have memory
      setAiMemoryHistory(prev => {
        const updated = messages.slice(-20);
        return updated.length !== prev.length || updated.some((m, i) => m.id !== prev[i]?.id) ? updated : prev;
      });
    } else if (!hasExceeded) {
      // For free users, only keep memory if tokens available
      const tokensRemaining = FREE_TOKEN_LIMIT - tokensUsed;
      if (tokensRemaining > 0) {
        setAiMemoryHistory(prev => {
          const updated = messages.slice(-20);
          return updated.length !== prev.length || updated.some((m, i) => m.id !== prev[i]?.id) ? updated : prev;
        });
      } else {
        // Clear memory if tokens exhausted
        setAiMemoryHistory(prev => {
          if (prev.length > 0) {
            console.log('⚠️ AI Memory: Cleared - Token limit reached');
            return [];
          }
          return prev;
        });
      }
    } else {
      // Token exceeded - clear memory
      setAiMemoryHistory(prev => {
        if (prev.length > 0) {
          console.log('⚠️ AI Memory: Cleared - Token limit exceeded');
          return [];
        }
        return prev;
      });
    }
  }, [messages, hasExceeded, isSubscribed, tokensUsed]);

  // Builder State - Multi-File Support
  const [fileManager] = useState(() => new FileManager());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [currentCode, setCurrentCode] = useState<string>(''); // Keep for backward compatibility
  const [currentFramework, setCurrentFramework] = useState<string | undefined>(undefined); // Track framework for preview
  const [isBuildingCode, setIsBuildingCode] = useState(false); // Loading state for code generation
  const [codebaseAnalysis, setCodebaseAnalysis] = useState<CodebaseAnalysis | null>(null);
  const [isExploringCodebase, setIsExploringCodebase] = useState(false);
  // If codebase mode, default to 'code' tab instead of 'preview'
  const [activeTab, setActiveTab] = useState<'preview' | 'design' | 'code' | 'visual'>(((initialState as any).codebaseMode) ? 'code' : 'preview');
  const [showDesignTools, setShowDesignTools] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(75);
  const [typescriptErrors, setTypeScriptErrors] = useState<TypeError[]>([]);
  const [lintErrors, setLintErrors] = useState<LintError[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [showGitHubIntegration, setShowGitHubIntegration] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  // DatabasePanel removed - Firebase integration used instead
  const [showAPIIntegration, setShowAPIIntegration] = useState(false);
  const [showMobileGenerator, setShowMobileGenerator] = useState(false);
  const undoRedoManager = getUndoRedoManager();
  const [logs, setLogs] = useState<string[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const canExport = Boolean(currentCode || fileManager.getAllFiles().length > 0);
  const [freeFallback, setFreeFallback] = useState(false);

  // Mobile State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [mobileTab, setMobileTab] = useState<'chat' | 'workbench' | 'canvas'>('chat');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [deviceScale, setDeviceScale] = useState(1);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [fileTreeOpen, setFileTreeOpen] = useState(false); // For mobile/tablet collapsible file tree
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasAutoSent = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const [showTutorFeaturesMenu, setShowTutorFeaturesMenu] = useState(false);
  const tutorFeaturesMenuRef = useRef<HTMLDivElement>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const restoredSessionRef = useRef(false);
  // Refs for camera cleanup
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraModalRef = useRef<HTMLElement | null>(null);
  const cameraEventListenersRef = useRef<Array<{ element: HTMLElement; event: string; handler: EventListener }>>([]);
  // Supabase Auth handles tokens internally - no need for getToken
  // SUPABASE_TEMPLATE removed - using Firebase
  const { trackUsage } = useTrackAIUsage();
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);

  // Feedback Popup State
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const hasShownSessionPopup = useRef(false);
  const { preferences } = useUserPreferences();

  // Voice Call State (only for tutor mode)
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  // Learning Features State
  const [showQuiz, setShowQuiz] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const { progress, updateProgress, recordSession } = useLearningProgress();

  // Extract topic from conversation for learning features
  const extractTopicFromMessages = useCallback((): string => {
    if (messages.length === 0) return 'General';

    // Get last few messages to extract topic
    const recentMessages = messages.slice(-5);
    const combinedText = recentMessages.map(m => m.content).join(' ').toLowerCase();

    // Common topics
    const topics = ['react', 'javascript', 'typescript', 'python', 'node.js', 'css', 'html', 'next.js', 'vue', 'angular'];
    const foundTopic = topics.find(topic => combinedText.includes(topic));

    return foundTopic || 'General';
  }, [messages]);

  // Sidebar State (only for tutor mode)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'like' | 'dislike'>>({});
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [regenerateMenuOpen, setRegenerateMenuOpen] = useState<string | null>(null);

  // Handle Regenerate Message
  const handleRegenerate = async (messageId: string) => {
    // Find the message index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Find the last user message before this one
    // If the current message is AI, we look backwards from it
    // If it's the very last message, we just look at the one before it
    let userMessageToResend = null;

    // Iterate backwards starting from the message before the target
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageToResend = messages[i];
        break;
      }
    }

    if (userMessageToResend) {
      console.log('🔄 Regenerating from user message:', userMessageToResend.content.substring(0, 50));
      // Call handleSend with the content and current mode
      // We pass the history override to "cut off" the conversation after the user message we found
      // ensuring we regenerate from that point
      const historyUntilUserMessage = messages.slice(0, messages.indexOf(userMessageToResend));
      await handleSend(userMessageToResend.content, appMode, historyUntilUserMessage);
    } else {
      console.warn('⚠️ Could not find a user message to regenerate from.');
    }
  };

  // Image Lightbox State (for viewing full-size images)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Chat Sessions (for sidebar)
  const { sessions, deleteSession, refreshSessions } = useChatSessions();

  // Track current session ID (separate from URL param sessionId)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);

  // Helper for clipboard copy with fallback
  const copyToClipboard = async (text: string, onSuccess?: () => void) => {
    console.log('🔄 Attempting to copy text:', text.substring(0, 50) + '...');

    // Add watermark
    const watermarkedText = `${text}\n\nCopied from Noir AI`;

    try {
      // Method 1: Modern Clipboard API (works in secure contexts)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(watermarkedText);
        console.log('✅ Successfully copied using Clipboard API');
        if (onSuccess) onSuccess();
        return;
      }
    } catch (err) {
      console.warn('⚠️ Clipboard API failed, trying fallback...', err);
    }

    // Method 2: Fallback using execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = watermarkedText;

      // Make it invisible but accessible
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);

      // Select the text
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      // Copy using execCommand
      const successful = document.execCommand('copy');

      document.body.removeChild(textArea);

      if (successful) {
        console.log('✅ Successfully copied using execCommand fallback');
        if (onSuccess) onSuccess();
      } else {
        console.error('❌ execCommand copy failed');
        alert('Failed to copy text. Please try selecting and copying manually.');
      }
    } catch (err) {
      console.error('❌ All copy methods failed:', err);
      alert('Copy failed. Please copy the text manually.');
    }
  };

  // New Features for Tutor Mode
  const [enableWebSearch, setEnableWebSearch] = useState((initialState as any).enableWebSearch || false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [uploadedDocument, setUploadedDocument] = useState<ParsedDocument | null>(null);
  const [showCodeSandbox, setShowCodeSandbox] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Canvas Analysis Handler
  const handleCanvasAnalysis = useCallback((blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAttachedImages(prev => [...prev, base64]);
      setInput(prev => prev || "Tolong analisa orak-orek saya ini...");
    };
    reader.readAsDataURL(blob);
  }, []);

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
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load messages when sessionId changes (for sidebar session selection)
  useEffect(() => {
    const loadSessionMessages = async () => {
      if (!sessionId || !user) return;

      // Sync currentSessionId with URL param
      setCurrentSessionId(sessionId);

      try {
        const token = null;
        const sessionMessages = await getSessionMessages(sessionId);

        // Convert database messages to Message format
        const convertedMessages: Message[] = sessionMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role as 'user' | 'ai',
          content: msg.content,
          code: msg.code || undefined,
          images: msg.images || undefined,
          timestamp: new Date(msg.createdAt as any)
        }));

        setMessages(convertedMessages);

        // Update appMode from session if available
        if (sessionMessages.length > 0) {
          const sessions = await getUserSessions(user.id);
          const session = sessions.find(s => s.id === sessionId);

          if (session?.mode) {
            setAppMode(session.mode as AppMode);
          }
        }
      } catch (error) {
        console.error('Error loading session messages:', error);
      }
    };

    loadSessionMessages();
  }, [sessionId, user]);

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

  // Auto-scroll only when a NEW message is added (not on tab switch/re-render)
  const prevMessageCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Load session messages when sessionId is in URL
  useEffect(() => {
    const loadSessionMessages = async () => {
      if (!sessionId || !user || restoredSessionRef.current) return;

      try {
        const token = null;
        const dbMessages = await getSessionMessages(sessionId);

        if (dbMessages && dbMessages.length > 0) {
          const restoredMessages = dbMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            code: m.code || undefined,
            images: m.images || undefined,
            timestamp: new Date(m.created_at || Date.now()),
          }));
          setMessages(restoredMessages);

          // Restore AI memory from session (only if token available)
          if (!hasExceeded || isSubscribed) {
            setAiMemoryHistory(restoredMessages.slice(-20)); // Keep last 20 messages
            console.log(`🧠 AI Memory: Restored ${restoredMessages.length} messages from session`);
          }
        }
        restoredSessionRef.current = true;
      } catch (error) {
        console.error('Error loading session messages', error);
      }
    };

    loadSessionMessages();
  }, [sessionId, user, hasExceeded, isSubscribed]);

  // Auto-resume latest session when no session is selected
  useEffect(() => {
    const resumeLatestSession = async () => {
      if (sessionId || restoredSessionRef.current || !user) return;

      try {
        const token = null;
        const sessions = await getUserSessions(user.id);
        if (!sessions || sessions.length === 0) return;

        const latest = sessions[0];
        const dbMessages = await getSessionMessages(latest.id);

        setAppMode(latest.mode as AppMode);
        setProvider(latest.provider as AIProvider);
        const restoredMessages = dbMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          code: m.code || undefined,
          images: m.images || undefined,
          timestamp: new Date(m.created_at || Date.now()),
        }));
        setMessages(restoredMessages);

        // Restore AI memory from session (only if token available)
        if (!hasExceeded || isSubscribed) {
          setAiMemoryHistory(restoredMessages.slice(-20)); // Keep last 20 messages
        }

        setShowSplash(false);
        restoredSessionRef.current = true;
        navigate(`/chat/${latest.id}`, { replace: true });
      } catch (error) {
        console.error('Error resuming latest session', error);
      }
    };

    resumeLatestSession();
  }, [sessionId, user, hasExceeded, isSubscribed, navigate]);

  // Auto-Start Logic - moved after handleSend definition

  // No auto-greeting; wait for user prompt

  // Mode selection is now automatic from Home.tsx prompt detection
  // No manual mode selection needed

  // Sidebar handlers
  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setAttachedImages([]);
    setUploadedDocument(null);
    setSearchResults([]);
    setAppMode('tutor');

    // Reset file manager for builder mode
    fileManager.clear();
    setOpenFiles([]);
    setSelectedFile(undefined);
    setCurrentCode('');
    setIsBuildingCode(false);

    // Explicitly reset session ID and URL
    navigate('/chat');
    window.history.replaceState(null, '', '/chat');

    // Force refresh sessions in sidebar
    if (sessions && refreshSessions) {
      setTimeout(() => refreshSessions(), 100);
    }
  };

  // Auto-Title Generation
  const generateAutoTitle = useCallback(async (firstMessage: string) => {
    if (!sessionId || !user) return;

    try {
      const prompt = `Generate a short, concise title (3-5 words max) for a chat about: "${firstMessage}". Return ONLY the title text. Do not use quotes, markdown, or HTML. Just the plain text title.`;

      // Use groq for fast title generation
      const response = await generateCode(
        prompt,
        [],
        'tutor', // Use tutor mode to avoid HTML generation templates
        'groq',
        [],
        'html',
        false,
        undefined, // onChunk
        sessionId,
        user.id,
        user.fullName || 'User',
        user.primaryEmailAddress?.emailAddress,
        'free'
      );

      // Clean up response: remove quotes, newlines, and markdown code ticks
      let title = (response && 'content' in response ? response.content.trim() : "New Chat") || "New Chat";
      title = title.replace(/^["']|["']$/g, '')          // Remove surrounding quotes
        .replace(/`/g, '')                     // Remove backticks
        .replace(/\*\*/g, '')                  // Remove bold markdown
        .replace(/# /g, '')                    // Remove header markdown
        .split('\n')[0]                        // Take first line only
        .substring(0, 50);                     // Hard limit length

      if (title && title.length > 0) {
        await updateChatSession(sessionId, { title });
        if (refreshSessions) refreshSessions();
      }
    } catch (error) {
      console.error("Auto-title generation failed:", error);
    }
  }, [sessionId, user, refreshSessions]);

  // Trigger Auto-Title
  useEffect(() => {
    if (messages.length === 2 && messages[1].role === 'ai' && sessionId && sessions) {
      const currentSession = sessions.find(s => s.id === sessionId);
      // Only generate if title is default or empty
      if (currentSession && (currentSession.title === 'New Chat' || !currentSession.title)) {
        if (messages[0].role === 'user') {
          generateAutoTitle(messages[0].content);
        }
      }
    }
  }, [messages.length, sessionId, sessions, generateAutoTitle]);

  const handleSelectSession = (selectedSessionId: string) => {
    navigate(`/chat/${selectedSessionId}`);
    // Messages will be loaded via useEffect when sessionId changes
  };

  const handleOpenSettings = () => {
    // Open settings modal - you can implement this
    console.log('Open settings');
  };

  // Handle Canvas Analyze
  const handleCanvasAnalyze = useCallback((blob: Blob) => {
    console.log('🎨 Canvas analyze triggered');

    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const canvasImageData = reader.result as string;

      // Switch to chat tab on mobile
      if (isMobile) {
        setMobileTab('chat');
      }

      // Create user message with canvas image
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: "Please analyze this canvas drawing and explain what you see.",
        timestamp: new Date(),
        images: [canvasImageData]
      };

      setMessages(prev => [...prev, userMessage]);
      setInput("Please analyze this canvas drawing and explain what you see.");
    };
    reader.readAsDataURL(blob);

    // Auto-submit for analysis
    // The image is now in the message, it will be processed by the AI
  }, [isMobile, setMobileTab, setMessages, setInput]);


  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedImages.length >= MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images per message.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesArray = Array.from(files);
    const MAX_SIZE_MB = 10;
    const validFiles = filesArray.filter(file => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File ${file.name} is too large (> ${MAX_SIZE_MB}MB).`);
        return false;
      }
      return true;
    });

    const filesToProcess = validFiles.slice(0, MAX_IMAGES - attachedImages.length);

    if (filesToProcess.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Process all files in parallel with compression
    const imagePromises = filesToProcess.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => {
          console.error('Error reading file:', file.name);
          reject(new Error(`Failed to read file: ${file.name}`));
        };
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // Compress the image before uploading
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              const MAX_DIMENSION = 1024; // Max width/height 1024px for great AI analysis without bloat
              
              if (width > height && width > MAX_DIMENSION) {
                height = Math.round((height * MAX_DIMENSION) / width);
                width = MAX_DIMENSION;
              } else if (height > MAX_DIMENSION) {
                width = Math.round((width * MAX_DIMENSION) / height);
                height = MAX_DIMENSION;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                // Compress as JPEG with 0.7 quality to dramatically reduce size
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedBase64);
              } else {
                resolve(reader.result as string); // Fallback if no context
              }
            };
            img.onerror = () => {
              resolve(reader.result as string); // Fallback on error
            };
            img.src = reader.result;
          } else {
            reject(new Error(`Failed to read file: ${file.name}`));
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises)
      .then(newImages => {
        setAttachedImages(prev => {
          const updated = [...prev, ...newImages];
          console.log('✅ Images added:', { count: newImages.length, total: updated.length });
          return updated;
        });
        // Reset input after all files are processed
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowAttachmentMenu(false);
      })
      .catch(error => {
        console.error('Error processing images:', error);
        alert(`Error processing images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  // Feedback Tracking Logic
  const checkFeedbackConditions = useCallback(() => {
    if (!user) return;

    const userId = user.id;
    const STORAGE_PREFIX = `noir_ai_feedback_${userId}`;

    // Get stored data
    const chatCount = parseInt(localStorage.getItem(`${STORAGE_PREFIX}_count`) || '0');
    const hasGivenFirstFeedback = localStorage.getItem(`${STORAGE_PREFIX}_first_given`) === 'true';
    const lastFeedbackDateOffset = parseInt(localStorage.getItem(`${STORAGE_PREFIX}_last_date`) || '0');
    const lastFeedbackDate = lastFeedbackDateOffset ? new Date(lastFeedbackDateOffset) : null;

    // Increment chat count
    const newCount = chatCount + 1;
    localStorage.setItem(`${STORAGE_PREFIX}_count`, newCount.toString());

    // Condition 1: First time - after 3 chats
    if (!hasGivenFirstFeedback && newCount === 3) {
      setTimeout(() => setShowFeedbackPopup(true), 2000); // Slight delay for UX
      return;
    }

    // Condition 2: Recurring - 1 week after last feedback
    if (hasGivenFirstFeedback && lastFeedbackDate) {
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
      const now = new Date();
      if (now.getTime() - lastFeedbackDate.getTime() > oneWeekInMs) {
        // Check if user is active enough (e.g., every 10th message after a week) to assume "continued use"
        // Simpler approach: if it has been a week, show it on next chat.
        setTimeout(() => setShowFeedbackPopup(true), 2000);
      }
    }
  }, [user]);

  // Handle Feedback Submission/Close
  const handleFeedbackClose = () => {
    setShowFeedbackPopup(false);
    if (!user) return;

    // Update tracking when closed (assumed seen/interacted)
    const userId = user.id;
    const STORAGE_PREFIX = `noir_ai_feedback_${userId}`;

    localStorage.setItem(`${STORAGE_PREFIX}_first_given`, 'true');
    localStorage.setItem(`${STORAGE_PREFIX}_last_date`, Date.now().toString());
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
        { element: captureBtn as HTMLElement, event: 'click', handler: handleCapture },
        { element: cancelBtn as HTMLElement, event: 'click', handler: handleCancel }
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
      if (tutorFeaturesMenuRef.current && !tutorFeaturesMenuRef.current.contains(event.target as Node)) {
        setShowTutorFeaturesMenu(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Download function for multi-file projects
  const downloadProjectFiles = async () => {
    const files = fileManager.getAllFiles();
    if (files.length === 0) return;

    // For React/Next.js/Vite projects, download all files sequentially
    // Create a simple download for each file (user can manually create folder structure)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const blob = new Blob([file.content], {
        type: file.path.endsWith('.json') ? 'application/json' :
          file.path.endsWith('.css') ? 'text/css' :
            file.path.endsWith('.ts') || file.path.endsWith('.tsx') ? 'text/typescript' :
              file.path.endsWith('.js') || file.path.endsWith('.jsx') ? 'text/javascript' :
                'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      // Use file path as download name, replace slashes with underscores for safety
      anchor.download = file.path.replace(/\//g, '_').replace(/\\/g, '_');
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      // Small delay between downloads to avoid browser blocking
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Show notification
    setLogs(prev => [...prev, `> Downloaded ${files.length} file(s) from ${currentFramework || 'react'} project`]);
  };

  const downloadCurrentCode = async () => {
    // Check if it's a multi-file project
    const files = fileManager.getAllFiles();
    if (files.length > 0 && currentFramework && currentFramework !== 'html') {
      await downloadProjectFiles();
      return;
    }

    // Single-file HTML download
    if (!currentCode) return;
    const blob = new Blob([currentCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'noir-ai-app.html';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearPreview = () => {
    setCurrentCode('');
    setActiveTab('preview');
    setLogs(prev => [...prev, '> Preview cleared']);
  };

  // Generate Plan (Builder Mode) with timeout handling
  const handleGeneratePlan = async (promptText: string) => {
    if (!promptText.trim() || isGeneratingPlan) return;

    setIsGeneratingPlan(true);
    try {
      // Generate plan with built-in timeout (15 seconds in agenticPlanner)
      // Use SumoPod/Groq for plan generation (now default)
      const planProvider = (provider === 'openai' || provider === 'gemini' || provider === 'anthropic') ? provider : 'groq';
      const plan = await generatePlan(promptText, planProvider as 'anthropic' | 'gemini' | 'openai' | 'groq');
      setCurrentPlan(plan);
      setShowPlanner(true);
    } catch (error: any) {
      console.error('Failed to generate plan:', error);
      // generatePlan already returns fallback plan on error, so we should have a plan
      // But just in case, create a simple fallback
      const { createFallbackPlan } = await import('@/lib/agenticPlanner');
      const fallbackPlan = createFallbackPlan(promptText);
      setCurrentPlan(fallbackPlan);
      setShowPlanner(true);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Handle Send
  // Helper: Estimate token count (rough: ~4 chars per token)
  const estimateTokenCount = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  // Helper: Truncate history to fit within token limit
  const truncateHistory = (history: any[], maxTokens: number = 1500): any[] => {
    // Estimate system prompt tokens (~500-800 tokens)
    const systemPromptTokens = 600;
    // Reserve tokens for current prompt (~500 tokens)
    const currentPromptTokens = 500;
    // Available tokens for history
    const availableTokens = maxTokens - systemPromptTokens - currentPromptTokens;

    if (availableTokens <= 0) return [];

    // Calculate total tokens in history
    let totalTokens = 0;
    const truncated: any[] = [];

    // Keep latest messages first (most important)
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const msgText = msg.parts?.[0]?.text || msg.content || '';
      const msgTokens = estimateTokenCount(msgText);

      if (totalTokens + msgTokens <= availableTokens) {
        truncated.unshift(msg);
        totalTokens += msgTokens;
      } else {
        // If adding this message would exceed, try to truncate it
        if (truncated.length === 0 && msgTokens > 0) {
          // At least keep the latest message, but truncated
          const maxLength = (availableTokens * 4) - 100; // Reserve some buffer
          const truncatedText = msgText.substring(0, maxLength) + '...[truncated]';
          truncated.unshift({
            ...msg,
            parts: [{ text: truncatedText }]
          });
        }
        break;
      }
    }

    return truncated;
  };

  // Robust copy to clipboard helper
  const copyTextToClipboard = async (text: string) => {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      alert("Chat link copied to clipboard: " + text);
    } catch (err) {
      console.error('Async: Could not copy text: ', err);
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert("Chat link copied to clipboard: " + text);
      } else {
        alert("Failed to copy text. Please try selecting and copying manually.");
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      alert("Failed to copy text. Please copy the text manually.");
    }

    document.body.removeChild(textArea);
  };

  // Helper to share chat
  const handleShareChat = async () => {
    if (!currentSessionId) {
      alert("Please start a conversation before sharing.");
      return;
    }

    try {
      const id = await shareChatSession(currentSessionId);
      if (id) {
        const url = `https://rlabs-studio.web.id/share/${id}`;
        setShareUrl(url);
        setIsShareModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to share chat", err);
    }
  };

  const saveComparison = async (messageId: string, version: 'a' | 'b') => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || !msg.isComparison || !sessionId || !user) return;

    try {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, selectedVersion: version } : m
      ));

      await import('@/lib/supabaseDatabase').then(db => 
        db.saveComparisonChoice(
          user.id,
          sessionId,
          messages[messages.indexOf(msg) - 1]?.content || '',
          msg.contentA || '',
          msg.contentB || '',
          msg.modelA || 'noir-1',
          msg.modelB || 'noir-2',
          version
        )
      );
    } catch (error) {
      console.error('Error saving comparison:', error);
    }
  };

  const handleSend = async (textOverride?: string | boolean, modeOverride?: AppMode, historyOverride?: Message[], deepDiveOverride?: boolean, attachmentsOverride?: Attachment[], imagesOverride?: string[]) => {
    // Handle case where first arg is boolean (deepDive flag from ChatInput)
    let deepDive = false;
    let text: string;
    if (typeof textOverride === 'boolean') {
      deepDive = textOverride;
      text = input;
    } else {
      text = textOverride || input;
      deepDive = deepDiveOverride || false;
    }
    const imagesToSend = imagesOverride || (historyOverride ? (historyOverride[historyOverride.length - 1]?.images || []) : attachedImages);

    if ((!text.trim() && imagesToSend.length === 0 && (!attachmentsOverride || attachmentsOverride.length === 0)) || isTyping) return;

    // Check credit limit
    if (!checkChatLimit()) return;

    // Track session start time for progress tracking
    const sessionStartTime = Date.now();

    // Declare codeResponse in outer scope to avoid "not defined" errors
    let codeResponse: CodeResponse | null = null;

    // Check if we have existing code in messages (indicates builder context)
    const hasExistingCode = messages.some(m => m.role === 'ai' && m.code && m.code.trim().length > 0);

    // Always detect mode from user input (unless explicitly overridden)
    let detectedMode = modeOverride || detectMode(text) || 'tutor';

    // Debug logging
    console.log(`🔍 Mode Detection Debug:`, {
      text: text.substring(0, 50),
      detectedMode,
      currentAppMode: appMode,
      hasExistingCode,
      modeOverride
    });

    // IMPORTANT: If we're in builder mode and have existing code, we need to be smart about mode switching
    if (appMode === 'builder' && hasExistingCode && !modeOverride) {
      // Check if it's an edit command (should stay in builder mode)
      const editCommandPatterns = [
        /^(ubah|edit|ganti|modify|change|update|tambah|add|hapus|remove|delete)/i,
        /^(make it|make the|buat jadi|buat menjadi|jadikan)/i,
        /^(ubah|ganti|buat|change)\s+(warna|color|style|desain|layout|background|font)/i,
        /(warna|color)\s+(kuning|yellow|merah|red|biru|blue|hijau|green|putih|white|hitam|black)/i,
        /^(tambah|add)\s+(button|gambar|image|komponen|component)/i,
      ];

      const isEditCommand = editCommandPatterns.some(pattern => pattern.test(text.trim()));

      if (isEditCommand) {
        detectedMode = 'builder'; // Force builder mode for edit commands
        console.log(`🔧 Edit command detected, keeping builder mode: "${text.substring(0, 50)}..."`);
      }
    }

    const mode = detectedMode;

    // Auto-switch mode if detected mode is different from current mode
    if (detectedMode !== appMode && !modeOverride) {
      console.log(`🔄 Auto-switching mode: ${appMode} → ${detectedMode} (detected from: "${text.substring(0, 50)}...")`);
      setAppMode(detectedMode);

      // When switching to tutor mode, reset activeTab to preview (hide code editor)
      if (detectedMode === 'tutor') {
        setActiveTab('preview');
        console.log(`📚 Switched to tutor mode, resetting tab to preview`);
      }

      // Update session mode in database if session exists (non-blocking)
      if (sessionId && user) {
        updateChatSession(sessionId, { mode: detectedMode as any })
          .then(() => console.log(`✅ Session mode updated to ${detectedMode}`))
          .catch(error => console.error('Error updating session mode:', error));
      }
    }

    let effectiveProvider = provider;

    // Ensure appMode is set (should already be set above if auto-switched)
    if (!appMode) setAppMode(mode);

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      images: imagesToSend,
      attachments: attachmentsOverride,
      timestamp: new Date()
    };

    // Always add message to UI immediately
    setMessages(prev => [...prev, newMessage]);
    
    // Only clear main input box if this wasn't an override action
    if (!textOverride || typeof textOverride === 'boolean') {
      setInput('');
      setAttachedImages([]);
      setAttachedFiles([]);
    }

    // Track feedback conditions
    checkFeedbackConditions();

    // Abort previous generation if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsTyping(true);

    // =====================================================
    // PDF GENERATION DETECTION - Intercepts before normal AI flow
    // =====================================================
    const pdfPatterns = [
      /\b(buatkan|buat|generate|create|bikin)\b.*\b(pdf|dokumen|document)\b/i,
      /\b(pdf|dokumen|document)\b.*\b(buatkan|buat|generate|create|bikin)\b/i,
      /\b(edit|ubah|modify)\b.*\bpdf\b/i,
      /\bpdf\b.*\b(edit|ubah|modify)\b/i,
      /\b(export|download|unduh)\b.*\b(pdf|dokumen)\b/i,
      /\b(smart\s*doc|smart\s*document)\b/i,
    ];

    const isPdfRequest = pdfPatterns.some(pattern => pattern.test(text));

    if (isPdfRequest) {
      console.log('📄 [PDFGen] PDF generation request detected in chat!');

      try {
        // Call the /api/generate-pdf endpoint
        const pdfResponse = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || 'local-user',
            prompt: text,
            images: imagesToSend.length > 0 ? imagesToSend : undefined,
          }),
        });

        if (!pdfResponse.ok) {
          const errData = await pdfResponse.json().catch(() => ({}));
          throw new Error(errData.details || errData.error || `Server error: ${pdfResponse.statusText}`);
        }

        const pdfData = await pdfResponse.json();

        if (!pdfData.html) {
          throw new Error('AI did not return document content. Please try rephrasing your request.');
        }

        // Client-side PDF generation using html2pdf.js
        const html2pdf = (await import('html2pdf.js')).default;
        const container = document.createElement('div');
        container.innerHTML = pdfData.html;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '794px';
        container.style.background = 'white';
        container.style.color = 'black';
        container.style.padding = '20px';
        document.body.appendChild(container);

        const opt = {
          margin: 10,
          filename: `noir-document-${Date.now()}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        } as any;

        await html2pdf().set(opt).from(container).save();
        document.body.removeChild(container);

        // Add success message to chat
        const aiSuccessMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: '✅ **PDF berhasil di-generate dan di-download!**\n\nDokumen PDF telah dibuat berdasarkan permintaan Anda dan otomatis ter-download. Silakan cek folder download Anda.\n\nJika Anda ingin membuat perubahan, cukup kirim pesan baru dengan instruksi yang lebih spesifik.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiSuccessMsg]);

        // Save AI message to session
        const pdfSessionId = currentSessionId;
        if (pdfSessionId && user) {
          await saveMessage(pdfSessionId, 'ai', aiSuccessMsg.content);
        }
      } catch (pdfError: any) {
        console.error('📄 [PDFGen] Error:', pdfError);
        const aiErrorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: `❌ **Gagal membuat PDF.**\n\n${pdfError.message || 'Terjadi kesalahan saat membuat dokumen. Silakan coba lagi.'}\n\n💡 *Tips: Pastikan prompt Anda menjelaskan isi dokumen yang ingin dibuat dengan jelas.*`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiErrorMsg]);
      } finally {
        setIsTyping(false);
      }
      return; // Stop here — don't continue to normal AI flow
    }
    // =====================================================
    // END PDF GENERATION DETECTION
    // =====================================================

    incrementFeatureUsage('chat');

    if (mode === 'builder') {
      setLogs(prev => [...prev, `> Processing request: "${text.substring(0, 20)}..."`]);
    }

    // Initialize variables
    let historyForAI: any[] = [];
    let activeSessionId = currentSessionId;
    let searchResults: any[] = [];

    // Construct prompt with attachments for AI (hidden from UI)
    let promptToSend = text;
    if (newMessage.attachments && newMessage.attachments.length > 0) {
      const attachmentText = newMessage.attachments.map(att =>
        `\n\n--- ${att.name} (${att.type}) ---\n${att.content}`
      ).join('\n');
      promptToSend = `${text}\n\n[Attached Content]:${attachmentText}`;
    }

    try {
      // 1. Create session if it doesn't exist
      if (!activeSessionId && user) {
        try {
          const sessionTitle = text.trim().length > 0 ? text.substring(0, 30) + '...' : 'New Chat';
          const newSession = await createChatSession(user.id, (mode || 'tutor') as any, effectiveProvider, sessionTitle);
          if (newSession) {
            activeSessionId = newSession.id;
            setCurrentSessionId(newSession.id);
            window.history.replaceState(null, '', `/chat/${newSession.id}`);
            setTimeout(() => {
              if (refreshSessions) refreshSessions();
            }, 1000);
          } else {
            console.warn('⚠️ Failed to create chat session, continuing without session');
          }
        } catch (error) {
          console.error('❌ Error creating chat session:', error);
        }
      }

      // 2. Save User Message
      if (activeSessionId && user) {
        await saveMessage(activeSessionId, 'user', text, undefined, imagesToSend);
      }

      if (historyOverride) {
        historyForAI = historyOverride.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: (m as any).code ? `${m.content}\n\nCode Generated:\n${(m as any).code}` : m.content }]
        }));
      } else {
        // Use AI memory history if available and token not exhausted
        const shouldUseMemory = !hasExceeded || isSubscribed;
        const historyToUse = shouldUseMemory ? aiMemoryHistory : [];

        // IMPORTANT: Do NOT add current message to historyForAI. 
        // usage: generateCode(prompt, history) -> prompt is current, history is past.
        const fullHistory = historyToUse.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.code ? `${m.content}\n\nCode Generated:\n${m.code}` : m.content }]
        }));

        // Truncate history if using OpenRouter
        if ((effectiveProvider === 'openai' || effectiveProvider === 'gemini' || effectiveProvider === 'anthropic') && fullHistory.length > 0) {
          const OPENROUTER_PROMPT_TOKEN_LIMIT = 2000;
          historyForAI = truncateHistory(fullHistory, OPENROUTER_PROMPT_TOKEN_LIMIT);

          if (historyForAI.length < fullHistory.length) {
            console.log(`⚠️ History truncated: ${fullHistory.length} → ${historyForAI.length} messages`);
          }
        } else {
          historyForAI = fullHistory;
        }

        if (shouldUseMemory && historyToUse.length > 0) {
          console.log(`🧠 AI Memory: Using ${historyForAI.length} previous messages for context`);
        }
      }

      // Handle Dual Response Flow
      if (comparisonMode && !modeOverride && mode !== 'builder') {
        const messageId = Date.now().toString();
        const aiMsg: Message = {
          id: messageId,
          role: 'ai',
          content: '',
          isComparison: true,
          contentA: '',
          contentB: '',
          modelA: 'kimi-k2-thinking', // Placeholder models, will be handled by NoirSync
          modelB: 'seed-2-0-lite-free',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMsg]);
        setAnimatingMessageId(messageId);

        try {
          // Prepare messages format for hook
          const hookMessages = [
            { role: 'system' as const, content: 'You are Noir AI, a helpful assistant.' },
            ...historyForAI.map(m => ({
              role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: m.parts[0].text
            })),
            { role: 'user' as const, content: promptToSend }
          ];

          // Trigger parallel streams
          await dualStream.startDualStream(
            'kimi-k2-thinking',
            'seed-2-0-lite-free',
            hookMessages
          );
        } catch (err) {
          console.error("Dual Stream Error:", err);
        } finally {
          setIsTyping(false);
          setAnimatingMessageId(null);
        }
        return;
      }

      // Perform web search if enabled (Allowed in all modes if explicitly enabled)
      if (enableWebSearch && text.trim()) {
        try {
          // Show searching indicator (optional: could add a state for this)
          console.log('🔍 Starting web search for:', text);

          const searchResponse = await performWebSearch(text, 5);
          searchResults = searchResponse.results;
          setSearchResults(searchResults);

          // Enhance prompt with search context
          if (searchResults.length > 0) {
            const searchContext = searchResults
              .map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`)
              .join('\n');
            promptToSend = `${text}\n\n[Web Search Results]\n${searchContext}\n\nPlease use the above search results to provide a comprehensive answer with citations.`;

            // For builder mode, also append context
            if (mode === 'builder') {
              console.log('🏗️ Builder mode: Adding search context to prompt');
            }
          }
        } catch (error) {
          console.error('Web search error:', error);
        }
      }

      // Include uploaded document context if available
      if (uploadedDocument && mode === 'tutor') {
        const docContext = `\n\n[Document Context: ${uploadedDocument.title}]\n${uploadedDocument.content.substring(0, 2000)}...\n\nPlease use the above document context to answer the question.`;
        promptToSend = promptToSend + docContext;
      }

      // Auto-explore codebase before generating (like v0.app) - Always for builder mode
      let explorationContext = '';
      if (mode === 'builder') {
        const existingFiles = fileManager.getAllFiles();
        setIsExploringCodebase(true);
        try {
          const analysis = CodebaseExplorerClass.analyzeCodebase(existingFiles);
          setCodebaseAnalysis(analysis);
          explorationContext = CodebaseExplorerClass.generateContextSummary(analysis);
          // Add exploration context to prompt
          promptToSend = explorationContext + '\n\n' + promptToSend;
        } catch (error) {
          console.error('Error exploring codebase:', error);
        } finally {
          setIsExploringCodebase(false);
        }
      }

      // IMPORTANT: Only generate code for builder mode
      // For tutor mode, generate text response only (no code)
      let code: string | null = null;
      let responseText = '';

      if (mode === 'builder') {
        // Set building state - show animation
        setIsBuildingCode(true);

        // Always use React framework for builder mode (never HTML)
        // Use 'mode' variable (already updated) instead of 'appMode' (may be stale due to async state)
        const frameworkToUse = framework;

        // Show building animation with file list
        const existingFiles = fileManager.getAllFiles();
        if (existingFiles.length > 0) {
          // Update building animation with current files
          setCodebaseAnalysis({
            components: existingFiles.map(f => ({
              name: f.path.split('/').pop() || f.path,
              path: f.path,
              type: f.type,
              summary: `File: ${f.path}`,
            })),
            totalFiles: existingFiles.length,
            frameworks: [],
            libraries: [],
            structure: {
              components: existingFiles.filter(f => f.type === 'component').map(f => f.path),
              pages: existingFiles.filter(f => f.type === 'page').map(f => f.path),
              styles: existingFiles.filter(f => f.type === 'style').map(f => f.path),
              config: existingFiles.filter(f => f.type === 'config').map(f => f.path),
            },
          });
        }

        // Debug: Log mode before generating code
        console.log(`🎯 Generating code with mode: ${mode}, framework: ${frameworkToUse}, text: "${text.substring(0, 50)}..."`);

        // Use workflow if enabled (check config)
        const { WORKFLOW_CONFIG } = await import('@/lib/workflow/config');
        const useWorkflow = WORKFLOW_CONFIG.enableWorkflow;

        // Create status update callback
        const onStatusUpdate = (status: string, message?: string) => {
          setWorkflowStatus({ status, message: message || '' });
        };

        codeResponse = await generateCode(
          promptToSend,
          historyForAI,
          mode as any,
          effectiveProvider,
          imagesToSend,
          frameworkToUse,
          useWorkflow ? { onStatusUpdate } : false,
          (chunk) => {
            // Streaming callback for builder mode (if applicable)
            // Currently builder mode expects JSON, so streaming raw text might break it unless we parse incrementally
            // For now, we only stream for tutor mode or if we implement incremental JSON parsing
          },
          activeSessionId,
          user?.id,
          user?.fullName || 'User',
          user?.primaryEmailAddress?.emailAddress,
          isSubscribed ? 'pro' : 'free',
          deepDive || withReasoning, // Combine deep dive param with reasoning state
          selectedModel, // NEW: Include selected model
          abortControllerRef.current?.signal // Support cancellation
        );

        // Handle multi-file or single-file response (BUILDER MODE ONLY)
        if (!codeResponse) {
          console.error('❌ No response received from generateCode');
          responseText = 'Error: No response received from AI. Please try again.';
          code = null;
          setIsBuildingCode(false);
          return;
        }

        if (codeResponse.type === 'multi-file') {
          // Multi-file project
          // CRITICAL: Check if any file contains error HTML
          const hasErrorFile = codeResponse.files.some(file =>
            file.content.includes('<!-- Error Generating Code -->') ||
            file.content.includes('text-red-500') ||
            file.content.includes('bg-red-900') ||
            file.content.includes('ANTHROPIC Error') ||
            file.content.includes('OpenRouter API Error')
          );

          if (hasErrorFile) {
            // Error detected in files - don't set code for preview
            console.error('❌ Error response detected in multi-file response, not setting code for preview');
            code = null;
            responseText = 'Error: Code generation failed. Please try again.';
            setIsBuildingCode(false);
            setLogs(prev => [...prev, '⚠️ Error: Code generation failed. Please try again with a different prompt or provider.']);
          } else {
            fileManager.clear();
            codeResponse.files.forEach(file => {
              fileManager.addFile(file.path, file.content, file.type);
            });
            if (codeResponse.entry) {
              fileManager.setEntry(codeResponse.entry);
              const entryFile = fileManager.getFile(codeResponse.entry);
              code = entryFile?.content || null;

              // If codebase mode, prioritize target file, otherwise use entry
              const fileToSelect = (codebaseMode && targetFile && fileManager.hasFile(targetFile))
                ? targetFile
                : codeResponse.entry;

              // Set selected file
              setSelectedFile(fileToSelect);
              if (!openFiles.includes(fileToSelect)) {
                setOpenFiles(prev => [...prev, fileToSelect]);
              }

              // If codebase mode, switch to code tab
              if (codebaseMode) {
                setActiveTab('code');
              }

              // IMPORTANT: Set currentCode for preview (only if not error)
              if (code) {
                setCurrentCode(code);
                setCurrentFramework(codeResponse.framework || 'react'); // Store framework for preview
              }
            } else if (codeResponse.files.length > 0) {
              // Fallback: use first file as entry
              const firstFile = codeResponse.files[0];
              fileManager.setEntry(firstFile.path);
              code = firstFile.content;
              setCurrentCode(code);
              setCurrentFramework(codeResponse.framework || 'react');

              // If codebase mode, prioritize target file, otherwise use first file
              const fileToSelect = (codebaseMode && targetFile && fileManager.hasFile(targetFile))
                ? targetFile
                : firstFile.path;

              setSelectedFile(fileToSelect);
              if (!openFiles.includes(fileToSelect)) {
                setOpenFiles(prev => [...prev, fileToSelect]);
              }

              // If codebase mode, switch to code tab
              if (codebaseMode) {
                setActiveTab('code');
              }
            }
            responseText = `Generated ${codeResponse.files.length} file(s) for ${codeResponse.framework || 'react'} project.`;
          }
        } else {
          // Single-file HTML (backward compatibility)
          code = codeResponse.content;

          // CRITICAL: Check if response is an error HTML BEFORE processing
          const isErrorResponse = code.includes('<!-- Error Generating Code -->') ||
            code.includes('text-red-500') ||
            code.includes('bg-red-900') ||
            code.includes('ANTHROPIC Error') ||
            code.includes('OpenRouter API Error') ||
            code.includes('This operation was aborted');

          if (isErrorResponse) {
            // This is an error response - don't set as code for preview
            console.error('❌ Error response detected in builder mode, not setting code for preview');
            code = null;
            responseText = extractTextFromErrorHtml(code) || 'Error: Code generation failed. Please try again.';
            setIsBuildingCode(false);
            setLogs(prev => [...prev, '⚠️ Error: Code generation failed. Please try again with a different prompt or provider.']);
          } else {
            const extracted = extractCode(code);
            responseText = extracted.text || 'Generated app successfully.';

            // Use extracted code if available, otherwise use original
            code = extracted.code || code;

            // Validate code - ensure it's valid HTML and not just whitespace/newlines
            if (!code || code.trim().length === 0 || /^[\s\n\r\t]+$/.test(code)) {
              console.error('⚠️ No valid code extracted from response (empty or whitespace only):', codeResponse.content.substring(0, 200));
              code = null;
              responseText = 'Error: No valid code found in response. Please try again.';
            } else if (!code.includes('<') && !code.includes('<!DOCTYPE')) {
              // Code doesn't look like HTML, might be plain text
              console.warn('⚠️ Code doesn\'t appear to be HTML:', code.substring(0, 100));
              // Try to wrap in HTML if it's just text
              if (code.trim().length > 0) {
                code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div class="p-8">
    <pre class="text-gray-800">${code}</pre>
  </div>
</body>
</html>`;
              }
            }
          }

          // Convert single-file to FileManager for consistency
          fileManager.clear();
          if (code && !isErrorResponse) {
            // If codebase mode and target file specified, use that instead of index
            // Always use .tsx for React code, not .html
            const fileName = (codebaseMode && targetFile) ? targetFile : 'App.tsx';
            fileManager.addFile(fileName, code, codebaseMode ? 'component' : 'page');
            fileManager.setEntry(fileName);
            setSelectedFile(fileName);
            if (!openFiles.includes(fileName)) {
              setOpenFiles(prev => [...prev, fileName]);
            }

            // If codebase mode, switch to code tab
            if (codebaseMode) {
              setActiveTab('code');
            }

            // IMPORTANT: Set currentCode for preview (only if not error)
            setCurrentCode(code);
            // Keep framework from response, or use 'react' for builder mode (never HTML)
            // Note: single-file responses don't have framework, so we default to 'react' for builder mode
            let responseFramework: Framework | undefined = undefined;
            // Type guard: check if codeResponse has 'files' property (multi-file)
            if ('files' in codeResponse && Array.isArray((codeResponse as any).files)) {
              responseFramework = (codeResponse as any).framework;
            }
            setCurrentFramework(codebaseMode ? 'react' : (responseFramework || 'react'));
            console.log('✅ Single-file code set:', {
              codeLength: code.length,
              hasDoctype: code.includes('<!DOCTYPE'),
              preview: code.substring(0, 150),
              fileName: fileName,
              codebaseMode: codebaseMode
            });
          } else {
            console.error('❌ No code extracted from single-file response');
          }
        }

        // Clear building state
        setIsBuildingCode(false);
      } else {
        // TUTOR MODE: Generate text response only (no code)
        console.log(`📚 Tutor mode: Generating text response for: "${text.substring(0, 50)}..."`);

        // Check if user is asking to build/create something in tutor mode
        // If so, auto-switch to builder mode for better code generation
        const buildRequestPatterns = [
          /^(buat|build|create|make|generate)\s+(web|website|app|aplikasi|page|halaman|site|situs)/i,
          /^(buatkan|buat|build|create|make|generate)\s+(saya|aku|me|i)\s+(web|website|app|aplikasi|page|halaman)/i,
        ];
        const isBuildRequest = buildRequestPatterns.some(pattern => pattern.test(text.trim()));

        if (isBuildRequest) {
          console.log('🔄 Tutor mode detected build request, switching to builder mode...');
          setAppMode('builder');
          // Update session mode
          if (activeSessionId && user) {
            updateChatSession(activeSessionId, { mode: 'builder' })
              .catch(error => console.error('Error updating session mode:', error));
          }
          // Recursively call handleSend with builder mode
          return handleSend(text, 'builder', historyOverride);
        }

        // For tutor mode, generate text response (no code)
        try {
          const { WORKFLOW_CONFIG } = await import('@/lib/workflow/config');
          const useWorkflow = WORKFLOW_CONFIG.enableWorkflow;

          const onStatusUpdate = (status: string, message?: string) => {
            setWorkflowStatus({ status, message: message || '' });
          };

          codeResponse = await generateCode(
            promptToSend,
            historyForAI,
            mode as any,
            effectiveProvider,
            imagesToSend,
            'html',
            useWorkflow ? { onStatusUpdate } : false,
            (chunk) => {
              // Streaming callback for tutor mode
              setIsTyping(false); // Stop typing indicator once streaming starts
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'ai' && lastMsg.id === 'streaming-temp') {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMsg, content: lastMsg.content + chunk }
                  ];
                } else {
                  return [
                    ...prev,
                    {
                      id: 'streaming-temp',
                      role: 'ai',
                      content: chunk,
                      timestamp: new Date()
                    }
                  ];
                }
              });
            },
            activeSessionId,
            user?.id,
            user?.fullName || 'User',
            user?.primaryEmailAddress?.emailAddress,
            isSubscribed ? 'pro' : 'free',
            deepDive || withReasoning,
            selectedModel, // selectedModel is the last argument (model)
            abortControllerRef.current?.signal // Support cancellation
          );

        } catch (error: any) {
          // Ignore superseded requests (Fix for duplicate output/interleaved streams)
          if (error.name === 'AbortError' && abortControllerRef.current !== controller) {
            console.log('🛑 Request aborted/superseded, silent return.');
            setIsTyping(false);
            return;
          }

          console.error('❌ Error calling generateCode in tutor mode:', error);
          codeResponse = null;

          // Granular Error Messages
          let userMessage = 'An unexpected error occurred.';
          if (error.message.includes('OpenRouter API Key not configured')) {
            userMessage = '⚠️ OpenRouter API Key Missing. Please set VITE_OPENROUTER_API_KEY in your .env file.';
          } else if (error.message.includes('401') || error.message.includes('403')) {
            userMessage = '⚠️ Authentication Failed. Please check your OpenRouter API Key.';
          } else if (error.message.includes('429') || error.message.includes('Credit')) {
            userMessage = '⏳ Rate limit or credit limit exceeded. Please check your OpenRouter credits.';
          } else if (error.message.includes('Timeout') || error.name === 'AbortError') {
            userMessage = '⏱️ Request timed out. The AI took too long to respond. Please try again.';
          } else if (error.message.includes('empty response')) {
            userMessage = '⚠️ AI returned an empty response. Please try rephrasing your prompt.';
          }

          setMessages(prev => [
            ...prev,
            {
              id: 'error-' + Date.now(),
              role: 'ai',
              content: userMessage,
              timestamp: new Date()
            }
          ]);
          setIsTyping(false);
          return;
        }

        // Extract text from response (tutor mode should not have code)
        // responseText already declared at line 1950 (outer scope)
        let code: string | null = null;

        if (!codeResponse) {
          console.error('❌ No response received from generateCode in tutor mode');
          responseText = 'I apologize, but I encountered an error while processing your request.\n\n' +
            '**Possible causes:**\n' +
            '- API connection issue\n' +
            '- API key configuration problem\n' +
            '- Service temporarily unavailable\n\n' +
            '**Please try:**\n' +
            '- Check your internet connection\n' +
            '- Verify API keys are configured correctly\n' +
            '- Switch to a different AI provider\n' +
            '- Try again in a moment';
          code = null;
          setIsBuildingCode(false);
        } else if (codeResponse.type === 'multi-file') {
          // If tutor mode returns multi-file (shouldn't happen, but handle it)
          responseText = codeResponse.files.map(f => f.content).join('\n\n');
          console.log('📚 Tutor mode: Multi-file response (unexpected)', { fileCount: codeResponse.files.length });
        } else {
          // Single-file response - for tutor mode, use content directly as text
          // Tutor mode should return plain text, not code
          const content = codeResponse.content || '';

          console.log('📚 Tutor mode: Processing response', {
            contentLength: content.length,
            hasCodeBlocks: content.includes('```'),
            contentPreview: content.substring(0, 100),
            hasError: content.includes('Error') || content.includes('error') || content.includes('<!-- Error'),
            isEmpty: !content || content.trim().length === 0,
            provider: effectiveProvider,
            mode: mode
          });

          // Check if response is an error HTML (from formatErrorHtml) - MUST CHECK FIRST
          const isErrorResponse = content.includes('<!-- Error Generating Code -->') ||
            content.includes('text-red-500') ||
            content.includes('bg-red-900') ||
            content.includes('Error:') ||
            content.includes('error:');

          if (isErrorResponse) {
            // This is an error response - extract readable text from HTML
            console.log('📚 Tutor mode: Error response detected, extracting text from HTML');
            responseText = extractTextFromErrorHtml(content);

            // Ensure we have meaningful text
            if (!responseText || responseText.trim().length === 0) {
              // Try to extract using DOM again
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = content;
              const extractedText = tempDiv.textContent || tempDiv.innerText || '';
              responseText = extractedText.trim() || content; // Fallback to original
            }

            // Add helpful prefix for error messages in tutor mode
            if (responseText && !responseText.startsWith('🚫') && !responseText.startsWith('⚠️') && !responseText.startsWith('Error')) {
              responseText = `🚫 Error: ${responseText}`;
            }

            console.log('📚 Tutor mode: Extracted error text', {
              extractedLength: responseText.length,
              extractedPreview: responseText.substring(0, 150),
              originalLength: content.length,
              isEmpty: !responseText || responseText.trim().length === 0,
              hasContent: !!content && content.trim().length > 0
            });
          } else if (!content || content.trim().length === 0) {
            // Empty content
            console.error('📚 Tutor mode: Empty content received from API', {
              codeResponseType: codeResponse.type,
              provider: effectiveProvider,
              mode: mode
            });
            responseText = 'I apologize, but I received an empty response from the AI service.\n\n' +
              'This might be due to:\n' +
              '- The AI service is temporarily unavailable\n' +
              '- Your prompt was too short or unclear\n' +
              '- API rate limiting\n\n' +
              '**Please try:**\n' +
              '- Rephrasing your question\n' +
              '- Switching to a different AI provider\n' +
              '- Trying again in a moment';
          } else {
            // Normal response - process it
            // For tutor mode, always use content directly as response text
            // Only try to extract if content looks like it has code blocks AND text
            if (content.includes('```') && content.length > 100) {
              // Has code blocks, try to extract text portion
              const extracted = extractCode(content);
              console.log('📚 Tutor mode: Extracted from code blocks', {
                extractedTextLength: extracted.text?.length || 0,
                hasExtractedText: !!(extracted.text && extracted.text.trim().length > 0),
                extractedCodeLength: extracted.code?.length || 0
              });
              // Use extracted text if it's meaningful, otherwise use full content
              if (extracted.text && extracted.text.trim().length > 0) {
                responseText = extracted.text;
              } else {
                // If no text extracted, use full content (might be code-only response)
                responseText = content;
              }
            } else {
              // No code blocks or simple response, use content directly
              responseText = content;
            }

            // CRITICAL: Double-check that responseText is set
            // This handles edge cases where extractCode might return empty text
            if (!responseText || responseText.trim().length === 0) {
              console.warn('⚠️ ResponseText became empty after processing, using content directly', {
                contentLength: content.length,
                contentPreview: content.substring(0, 200),
                hasCodeBlocks: content.includes('```')
              });
              // Always fallback to original content if responseText is empty
              responseText = content;
            }

            // Additional check: if content has HTML tags, try to extract text
            if (content.includes('<') && (!responseText || responseText.trim().length === 0)) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = content;
              const textContent = tempDiv.textContent || tempDiv.innerText || '';
              if (textContent.trim().length > 0) {
                responseText = textContent.trim();
              }
            }
          }

          // Final validation - ensure we have a response
          if (!responseText || responseText.trim().length === 0) {
            console.warn('📚 Tutor mode: Response text is still empty after processing', {
              contentLength: content.length,
              hasContent: !!content,
              contentPreview: content.substring(0, 200),
              isErrorResponse
            });

            // If it's an error response but we couldn't extract text, use a generic error message
            if (isErrorResponse) {
              responseText = '🚫 Error: API returned an error response. This usually means:\n\n' +
                '• Invalid API key - Check your OPENROUTER_API_KEY in backend environment variables\n' +
                '• Service unavailable - The API service may be down\n' +
                '• Model access issue - Verify the model is available in your OpenRouter account\n\n' +
                '**Please try:**\n' +
                '- Verify your OPENROUTER_API_KEY is set correctly in backend\n' +
                '- Check if the model is available in your OpenRouter account\n' +
                '- Try switching to a different AI provider\n' +
                '- Check backend logs for detailed error information';
            } else {
              // Last resort fallback for non-error empty responses
              responseText = 'I apologize, but I couldn\'t process the response properly.\n\n' +
                '**Please try:**\n' +
                '- Rephrasing your question\n' +
                '- Checking your internet connection\n' +
                '- Switching to a different AI provider';
            }
          }

          console.log('📚 Tutor mode: Final responseText', {
            responseTextLength: responseText.length,
            responseTextPreview: responseText.substring(0, 100),
            isErrorResponse,
            originalContentLength: content.length,
            originalContentPreview: content.substring(0, 100),
            isEmpty: !responseText || responseText.trim().length === 0
          });

          // CRITICAL: Ensure responseText is never empty if we have content
          if ((!responseText || responseText.trim().length === 0) && content && content.trim().length > 0) {
            console.warn('⚠️ ResponseText is empty but content exists! Using content directly.', {
              contentLength: content.length,
              contentPreview: content.substring(0, 200)
            });
            // Use content directly as last resort
            responseText = content;
          }

          // Don't set code for tutor mode
          code = null;

          // Ensure responseText is set before final check
          if (!responseText || responseText.trim().length === 0) {
            if (codeResponse?.type === 'single-file' && codeResponse.content) {
              // Last resort: use content directly
              console.warn('📚 Tutor mode: responseText is empty, using content directly as fallback');
              responseText = codeResponse.content;
            }
          }
        }

        // Clear building state (if it was set)
        setIsBuildingCode(false);
      }

      // 3. Save AI Response
      // Combine search results with response if available
      // For tutor mode, ensure we always have a response (never "Done.")
      let finalResponseText = responseText;
      if (!finalResponseText || finalResponseText.trim().length === 0) {
        // Only use "Done." for builder mode, never for tutor mode
        if (mode === 'tutor') {
          // Try to get more information about why response is empty
          console.error('📚 Tutor mode: Empty response detected after processing', {
            mode,
            provider: effectiveProvider,
            hasCodeResponse: !!codeResponse,
            codeResponseType: codeResponse?.type || 'unknown',
            codeResponseContentLength: codeResponse?.type === 'single-file' ? codeResponse.content?.length : 0,
            originalResponseText: responseText
          });

          // Check if codeResponse has content that we might have missed
          if (codeResponse && codeResponse.type === 'single-file' && codeResponse.content) {
            const content = codeResponse.content;
            console.log('📚 Tutor mode: Attempting to recover from codeResponse.content', {
              contentLength: content.length,
              contentPreview: content.substring(0, 200),
              isError: content.includes('<!-- Error') || content.includes('text-red-500')
            });

            // Try to extract from HTML if it's HTML content
            if (content.includes('<')) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = content;
              const extractedText = tempDiv.textContent || tempDiv.innerText || '';
              if (extractedText.trim().length > 0) {
                finalResponseText = extractedText.trim();
                console.log('📚 Tutor mode: Successfully extracted text from HTML content');
              } else {
                // If HTML extraction failed, use content directly
                finalResponseText = content;
                console.log('📚 Tutor mode: Using content directly as fallback');
              }
            } else {
              // Not HTML, use content directly
              finalResponseText = content;
              console.log('📚 Tutor mode: Using non-HTML content directly');
            }
          }

          // Only use fallback if we still don't have a response
          if (!finalResponseText || finalResponseText.trim().length === 0) {
            finalResponseText = 'I apologize, but I encountered an issue processing your request.\n\n' +
              '**Please try:**\n' +
              '- Rephrasing your question\n' +
              '- Checking your internet connection\n' +
              '- Switching to a different AI provider\n' +
              '- Trying again in a moment';
          }
        } else {
          finalResponseText = "Done.";
        }
      }
      if (searchResults.length > 0) {
        // Embed sources as hidden HTML comment for UI rendering
        const sourcesJson = JSON.stringify(searchResults);
        finalResponseText = (responseText || finalResponseText) + `\n\n<!-- SOURCES_JSON:${sourcesJson} -->`;
      }

      if (activeSessionId && user) {
        await saveMessage(activeSessionId, 'ai', finalResponseText, code || undefined, undefined);
      }

      const newMessageId = (Date.now() + 1).toString();
      const aiResponse: Message = {
        id: newMessageId,
        role: 'ai',
        content: finalResponseText,
        code: code || undefined,
        timestamp: new Date()
      };

      setAnimatingMessageId(newMessageId);
      setIsTyping(true);

      // FIX: For tutor mode (which uses real streaming), don't simulate typing
      // Just finalize the message to prevent duplicates (Streaming + Simulated)
      if (mode === 'tutor') {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          // If we have a streaming placeholder, replace it with the final response
          if (lastMsg && lastMsg.id === 'streaming-temp') {
            return [
              ...prev.slice(0, -1),
              aiResponse
            ];
          }
          // Fallback if no streaming happened for some reason
          return [...prev, aiResponse];
        });

        setIsTyping(false);
        setAnimatingMessageId(null);
      } else {
        // Builder mode still uses simulated streaming (or if streaming failed)
        const words = finalResponseText.split(' ');
        let currentWordIndex = 0;

        // Initial empty message to start the stream
        setMessages(prev => [...prev, {
          id: newMessageId,
          role: 'ai',
          content: '', // Start empty
          code: code || undefined,
          timestamp: new Date()
        }]);

        // Stream words
        const streamInterval = setInterval(() => {
          if (currentWordIndex >= words.length) {
            clearInterval(streamInterval);
            setIsTyping(false); // Only stop typing when done
            setAnimatingMessageId(null);
            return;
          }

          // Add next chunk of words (batching for speed)
          const batchSize = 3;
          const nextWords = words.slice(currentWordIndex, currentWordIndex + batchSize).join(' ');
          currentWordIndex += batchSize;

          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.id === newMessageId) {
              // Append content
              lastMsg.content = lastMsg.content ? lastMsg.content + ' ' + nextWords : nextWords;
            }
            return newMessages;
          });
        }, 50); // 50ms per batch update
      }

      // Track learning progress in tutor mode
      if (mode === 'tutor' && user && sessionStartTime) {
        const topic = extractTopicFromMessages();
        setCurrentTopic(topic);

        const studyDuration = Math.round((Date.now() - sessionStartTime) / 60000) || 1;

        // Update progress asynchronously (don't block UI)
        updateProgress(topic, {
          questionsAnswered: 1,
          studyTime: studyDuration,
        }).catch(err => console.error('Error updating progress:', err));

        // Record study session
        recordSession({
          topic,
          duration: studyDuration,
          questionsAnswered: 1,
          correctAnswers: 1, // Assume correct if user gets response
          sessionType: 'qna',
          startedAt: new Date(sessionStartTime),
          endedAt: new Date(),
        }).catch(err => console.error('Error recording session:', err));
      }

      // Update AI memory with new messages (only if token available)
      if (!hasExceeded || isSubscribed) {
        setAiMemoryHistory(prev => {
          const updated = [...prev, newMessage, aiResponse];
          // Limit memory to last 20 messages to prevent token overflow
          return updated.slice(-20);
        });
      }

      if (code && mode === 'builder') {
        setLogs(prev => [...prev, '> Code generation complete.', '> Bundling assets...', '> Starting development server...']);

        // Ensure currentCode is set (should already be set above, but double-check)
        if (!currentCode || currentCode !== code) {
          setCurrentCode(code);
        }

        // Ensure entry is set in fileManager
        if (!fileManager.getEntry() && fileManager.getAllFiles().length > 0) {
          const firstFile = fileManager.getAllFiles()[0];
          fileManager.setEntry(firstFile.path);
        }

        setActiveTab('preview');
        setRefreshKey(k => k + 1);

        // Auto-save version
        const versionManager = getVersionManager();
        versionManager.saveVersion(fileManager.getAllFiles(), 'Auto-save after generation');

        setTimeout(() => setLogs(prev => [...prev, '> Server running at http://localhost:3000', '> Ready.']), 800);

        // Debug: Log code preview info
        console.log('✅ Code set for preview:', {
          hasCode: !!code,
          codeLength: code?.length,
          codePreview: code?.substring(0, 200),
          entryFile: fileManager.getEntry(),
          entryContent: fileManager.getFile(fileManager.getEntry())?.content?.substring(0, 200),
          currentCodeSet: !!currentCode,
          fileManagerFiles: fileManager.getAllFiles().length
        });
      } else if (mode === 'builder' && !code) {
        console.error('❌ No code to preview:', {
          codeResponse: codeResponse || null,
          extracted: codeResponse?.type === 'single-file' ? extractCode(codeResponse.content) : null,
          files: codeResponse?.type === 'multi-file' ? codeResponse.files.map(f => ({ path: f.path, contentLength: f.content?.length })) : null
        });
        setLogs(prev => [...prev, '⚠️ Warning: No code generated. Please try again with a clearer prompt.']);
      }

      // Track token usage dengan optimistic update
      if (activeSessionId) {
        // Track ke database (async, tidak blocking) - use effective provider
        trackUsage(activeSessionId, effectiveProvider)
          .then((success) => {
            if (success) {
              console.log('✅ Token tracked successfully');
              // Delay untuk memastikan database commit, lalu sync
              setTimeout(() => {
                refreshLimit();
                refreshLimit(); // Also refresh Grok limit status
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
      setIsBuildingCode(false); // Clear building state on error
      console.error(error);
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : "Connection error. Please check your API Key.";

      // Auto-fallback: If OpenRouter providers fail with prompt token limit error
      const isPromptTokenError = (effectiveProvider === 'openai' || effectiveProvider === 'gemini' || effectiveProvider === 'anthropic') &&
        (errorMessage.toLowerCase().includes('prompt tokens') ||
          errorMessage.toLowerCase().includes('prompt token') ||
          errorMessage.toLowerCase().includes('token limit exceeded'));

      // Auto-retry with truncated history if prompt token limit error
      if (isPromptTokenError) {
        console.log(`🔄 ${effectiveProvider} prompt token limit exceeded, retrying with shorter history...`);

        // Truncate history more aggressively
        const truncatedHistory = truncateHistory(historyForAI, 1500); // Even shorter limit

        try {
          const { WORKFLOW_CONFIG } = await import('@/lib/workflow/config');
          const useWorkflow = WORKFLOW_CONFIG.enableWorkflow;

          const onStatusUpdate = (status: string, message?: string) => {
            setWorkflowStatus({ status, message: message || '' });
          };

          const fallbackResponse = await generateCode(
            text,
            truncatedHistory,
            mode as 'builder' | 'tutor',
            effectiveProvider,
            imagesToSend,
            mode === 'builder' ? framework : 'html',
            useWorkflow ? { onStatusUpdate } : false,
            undefined, // onChunk
            activeSessionId,
            user?.id,
            user?.fullName || 'User',
            user?.primaryEmailAddress?.emailAddress,
            isSubscribed ? 'pro' : 'free',
            deepDive || withReasoning,
            selectedModel // NEW: Include selected model
          );

          // Handle response (same logic as above)
          let code: string | null = null;
          let responseText = '';

          // For tutor mode, handle differently
          if (mode === 'tutor') {
            if (fallbackResponse.type === 'multi-file') {
              responseText = fallbackResponse.files.map(f => f.content).join('\n\n');
            } else {
              const content = fallbackResponse.content || '';
              // Extract text from content (remove HTML if present)
              if (content.includes('```')) {
                const extracted = extractCode(content);
                responseText = extracted.text || content;
              } else {
                responseText = content;
              }
            }
            code = null; // No code for tutor mode
          } else if (fallbackResponse.type === 'multi-file') {
            fileManager.clear();
            fallbackResponse.files.forEach(file => {
              fileManager.addFile(file.path, file.content, file.type);
            });
            if (fallbackResponse.entry) {
              fileManager.setEntry(fallbackResponse.entry);
              const entryFile = fileManager.getFile(fallbackResponse.entry);
              code = entryFile?.content || null;
              if (code) {
                setCurrentCode(code);
                setCurrentFramework(fallbackResponse.framework || 'react');
              }
              setSelectedFile(fallbackResponse.entry);
              if (!openFiles.includes(fallbackResponse.entry)) {
                setOpenFiles(prev => [...prev, fallbackResponse.entry]);
              }
            }
            setIsBuildingCode(false);
            responseText = `Generated ${fallbackResponse.files.length} file(s). (Note: History was shortened due to token limits)`;
          } else {
            code = fallbackResponse.content;
            const extracted = extractCode(code);
            responseText = (extracted.text || 'Generated successfully.') + ' (Note: History was shortened due to token limits)';
            code = extracted.code || code;
            fileManager.clear();
            if (code) {
              // Always use React/TSX for builder mode, not HTML
              const fileName = codebaseMode && targetFile ? targetFile : 'App.tsx';
              fileManager.addFile(fileName, code, codebaseMode ? 'component' : 'page');
              fileManager.setEntry(fileName);
              setCurrentCode(code);
              setCurrentFramework('react'); // Always React for builder mode
              setSelectedFile(fileName);
              if (!openFiles.includes(fileName)) {
                setOpenFiles(prev => [...prev, fileName]);
              }
              if (codebaseMode) {
                setActiveTab('code');
              }
            }
            setIsBuildingCode(false);
          }

          // Save response
          if (activeSessionId && user) {
            try {
              const token = null;
              await saveMessage(activeSessionId, 'ai', responseText, code || undefined, undefined);
            } catch (e) {
              console.error('Error saving fallback message:', e);
            }
          }

          // Combine search results if available
          let finalResponseText = responseText || "Done.";
          if (searchResults.length > 0 && mode === 'tutor') {
            finalResponseText = combineSearchAndResponse(searchResults, responseText);
          }

          const newMessageId = (Date.now() + 1).toString();
          setMessages(prev => [...prev, {
            id: newMessageId,
            role: 'ai',
            content: finalResponseText,
            code: code || undefined,
            timestamp: new Date()
          }]);
          setAnimatingMessageId(newMessageId);

          if (code && mode === 'builder') {
            setLogs(prev => [...prev, '> Code generation complete (with shortened history).', '> Bundling assets...', '> Starting development server...']);
            setCurrentCode(code);
            setActiveTab('preview');
            setRefreshKey(k => k + 1);
            const versionManager = getVersionManager();
            versionManager.saveVersion(fileManager.getAllFiles(), 'Auto-save after generation');
            setTimeout(() => setLogs(prev => [...prev, '> Server running at http://localhost:3000', '> Ready.']), 800);
          }

          // Track usage
          if (activeSessionId) {
            trackUsage(activeSessionId, effectiveProvider)
              .then(() => {
                setTimeout(() => {
                  refreshLimit();
                  refreshLimit();
                }, 1000);
              })
              .catch((e) => {
                console.error('Error tracking fallback usage:', e);
                setTimeout(() => refreshLimit(), 1000);
              });
          }

          setIsTyping(false);
          setWorkflowStatus(null); // Clear status when done
          setIsBuildingCode(false);
          return; // Success with truncated history
        } catch (truncatedError) {
          setIsBuildingCode(false); // Clear building state on error
          setIsTyping(false);
          setWorkflowStatus(null); // Clear status when done // Also clear typing state
          console.error('Retry with truncated history also failed:', truncatedError);
          // Continue to try fallback provider
        }
      }

      // Auto-fallback: If OpenRouter providers fail with token limit or credit error, switch to Groq/SumoPod (free)
      const isCreditError = errorMessage.toLowerCase().includes('credit') || errorMessage.toLowerCase().includes('insufficient');
      const isTokenLimitError = (effectiveProvider === 'openai' || effectiveProvider === 'gemini' || effectiveProvider === 'anthropic') &&
        (errorMessage.toLowerCase().includes('prompt tokens') ||
          errorMessage.toLowerCase().includes('token limit exceeded') ||
          isCreditError);

      if (isTokenLimitError && effectiveProvider !== 'groq' as AIProvider) {
        const errorType = isCreditError ? 'credits exceeded' : 'token limit exceeded';
        const providerName = effectiveProvider === 'openai' ? 'GPT-5-Nano' :
          effectiveProvider === 'anthropic' ? 'GPT OSS 20B' :
            effectiveProvider === 'gemini' ? 'GPT OSS 20B' : 'GPT OSS 20B';
        console.log(`🔄 ${effectiveProvider} ${errorType}, auto-switching to Groq/SumoPod (fallback)...`);
        setProvider('groq');
        setLogs(prev => [...prev, `⚠️ ${providerName} ${errorType}, retrying with Groq/SumoPod...`]);

        // Retry with Groq/SumoPod and shorter history
        const truncatedHistory = truncateHistory(historyForAI, 1500);
        try {
          const { WORKFLOW_CONFIG } = await import('@/lib/workflow/config');
          const useWorkflow = WORKFLOW_CONFIG.enableWorkflow;

          const onStatusUpdate = (status: string, message?: string) => {
            setWorkflowStatus({ status, message: message || '' });
          };

          const fallbackResponse = await generateCode(
            text,
            truncatedHistory,
            mode as 'builder' | 'tutor',
            'groq',
            imagesToSend,
            mode === 'builder' ? framework : 'html',
            useWorkflow ? { onStatusUpdate } : false,
            undefined, // onChunk
            activeSessionId,
            user?.id,
            user?.fullName || 'User',
            user?.primaryEmailAddress?.emailAddress,
            isSubscribed ? 'pro' : 'free',
            deepDive || withReasoning,
            selectedModel // NEW: Include selected model
          );

          // Handle response (same logic as above)
          let code: string | null = null;
          let responseText = '';

          if (fallbackResponse.type === 'multi-file') {
            fileManager.clear();
            fallbackResponse.files.forEach(file => {
              fileManager.addFile(file.path, file.content, file.type);
            });
            if (fallbackResponse.entry) {
              fileManager.setEntry(fallbackResponse.entry);
              const entryFile = fileManager.getFile(fallbackResponse.entry);
              code = entryFile?.content || null;
              if (code) {
                setCurrentCode(code);
                setCurrentFramework(fallbackResponse.framework || 'react');
              }
              setSelectedFile(fallbackResponse.entry);
              if (!openFiles.includes(fallbackResponse.entry)) {
                setOpenFiles(prev => [...prev, fallbackResponse.entry]);
              }
            }
            setIsBuildingCode(false);
            setIsTyping(false);
            setWorkflowStatus(null); // Clear status when done
            responseText = `Generated ${fallbackResponse.files.length} file(s) with Mistral Devstral.`;
          } else {
            code = fallbackResponse.content || '';
            const extracted = extractCode(code);
            responseText = extracted.text + ' (Generated with Mistral Devstral)';
            code = extracted.code || code;
            fileManager.clear();
            if (code) {
              // Always use React/TSX for builder mode, not HTML
              const fileName = codebaseMode && targetFile ? targetFile : 'App.tsx';
              fileManager.addFile(fileName, code, codebaseMode ? 'component' : 'page');
              fileManager.setEntry(fileName);
              setCurrentCode(code);
              setCurrentFramework('react'); // Always React for builder mode
              setSelectedFile(fileName);
              if (!openFiles.includes(fileName)) {
                setOpenFiles(prev => [...prev, fileName]);
              }
              if (codebaseMode) {
                setActiveTab('code');
              }
            }
            setIsBuildingCode(false);
            setIsTyping(false);
            setWorkflowStatus(null); // Clear status when done
          }

          // Save response
          if (activeSessionId && user) {
            try {
              const token = null;
              await saveMessage(activeSessionId, 'ai', responseText, code || undefined, undefined);
            } catch (e) {
              console.error('Error saving fallback message:', e);
            }
          }

          // Combine search results if available
          let finalResponseText = responseText || "Done.";
          if (searchResults.length > 0 && mode === 'tutor') {
            finalResponseText = combineSearchAndResponse(searchResults, responseText);
          }

          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: finalResponseText,
            code: code || undefined,
            timestamp: new Date()
          }]);

          if (code && mode === 'builder') {
            setLogs(prev => [...prev, '> Code generation complete (Mistral Devstral).', '> Bundling assets...', '> Starting development server...']);
            setCurrentCode(code);
            setActiveTab('preview');
            setRefreshKey(k => k + 1);
            const versionManager = getVersionManager();
            versionManager.saveVersion(fileManager.getAllFiles(), 'Auto-save after generation (Mistral Devstral)');
            setTimeout(() => setLogs(prev => [...prev, '> Server running at http://localhost:3000', '> Ready.']), 800);
          }

          // Track usage with Claude Opus 4.5
          if (activeSessionId) {
            trackUsage(activeSessionId, 'anthropic')
              .then(() => {
                setTimeout(() => {
                  refreshLimit();
                  refreshLimit();
                }, 1000);
              })
              .catch((e) => {
                console.error('Error tracking fallback usage:', e);
                setTimeout(() => refreshLimit(), 1000);
              });
          }

          return; // Success with fallback
        } catch (fallbackError) {
          setIsBuildingCode(false); // Clear building state on error
          console.error('Fallback to SumoPod also failed:', fallbackError);
          // Continue to show error message
        }
      }

      // Show error message
      setIsBuildingCode(false); // Clear building state before showing error
      setIsTyping(false); // Ensure typing state is cleared

      // Format error message based on mode
      let errorContent = '';
      if (mode === 'tutor') {
        // For tutor mode, provide helpful error message
        errorContent = `I apologize, but I encountered an error while processing your request.\n\n` +
          `**Error Details:** ${errorMessage}\n\n` +
          `**Possible Solutions:**\n` +
          `1. **Check your internet connection** - Ensure you're connected to the internet\n` +
          `2. **Verify API configuration** - Check if your API keys are set correctly\n` +
          `3. **Try a different provider** - Switch to a different AI model (e.g., Mistral Devstral)\n` +
          `4. **Restart the server** - If you're running a local server, try restarting it\n` +
          `5. **Check server logs** - Look for detailed error messages in the server console\n\n` +
          `If the problem persists, please try:\n` +
          `- Rephrasing your question\n` +
          `- Breaking down complex questions into smaller parts\n` +
          `- Contacting support if the issue continues`;
      } else {
        // For builder mode, show technical error
        errorContent = `Error: ${errorMessage}`;
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: errorContent,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
      setIsBuildingCode(false); // Ensure loading state is cleared
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
        const token = null;
        await saveMessage(sessionId, isAI ? 'ai' : 'user', text, undefined, undefined);
      } catch (error) {
        console.error('Error saving voice message:', error);
      }
    }
  };

  // Find active clarification for the bottom widget
  const lastMessage = messages[messages.length - 1];
  const activeClarification = lastMessage?.role === 'ai' && !answeredClarifications[lastMessage.id]
    ? { id: lastMessage.id, ...parseClarificationFromAIResponse(lastMessage.content) }
    : null;
  const showBottomClarification = activeClarification?.hasClarification && !isTyping;

  // --- Render Content ---
  const chatContent = (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden transition-colors duration-500">
      <DynamicBackground />
      {/* Header - Claude Style */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 transition-all duration-300",
        isMobile ? "h-14 bg-gradient-to-b from-white/90 to-transparent backdrop-blur-[2px]" : "h-14 bg-white/80 backdrop-blur-md border-b border-zinc-200/50"
      )}>
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
          {/* Mobile Sidebar Toggle */}
          {isMobile && (
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 text-gray-600 transition-colors"
              title="Open Sidebar"
            >
              <Menu size={20} strokeWidth={1.5} className="relative z-50" />
            </button>
          )}

          {/* Desktop Sidebar Toggle (when collapsed) */}
          {!isMobile && isSidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapse}
              className="p-2 -ml-2 mr-2 rounded-lg hover:bg-black/5 text-zinc-500 hover:text-zinc-900 transition-colors"
              title="Expand Sidebar"
            >
              <PanelLeft size={20} className="text-zinc-500" strokeWidth={1.5} />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            {/* Title Dropdown */}
            <div className="relative group">
              <button
                onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 -ml-1 rounded-lg hover:bg-black/5 text-zinc-800 transition-colors max-w-full"
              >
                <span className="text-sm font-semibold text-zinc-800 px-1 truncate max-w-[300px] sm:max-w-xl transition-all duration-300">
                  {sessions.find(s => s.id === sessionId)?.title || "New Chat"}
                </span>
                <ChevronDown size={14} className="text-zinc-400" />
              </button>

              {/* Dropdown Menu */}
              {isTitleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTitleDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setIsTitleDropdownOpen(false);
                        const currentTitle = sessions.find(s => s.id === sessionId)?.title || "New Chat";
                        const newTitle = prompt("Enter new title:", currentTitle);
                        if (newTitle && sessionId) {
                          updateChatSession(sessionId, { title: newTitle }).then(() => refreshSessions?.());
                        }
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 text-left transition-colors"
                    >
                      <Pencil size={14} className="text-zinc-500" /> Rename
                    </button>
                    <button
                      onClick={() => {
                        setIsTitleDropdownOpen(false);
                        if (sessionId && confirm("Delete this chat?")) {
                          // Assuming delete logic exists or we implement it later
                          console.log("Delete triggered");
                          // For now just clear
                          handleNewChat();
                        }
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                      <Trash2 size={14} /> Delete Chat
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleNewChat}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
            title="New Chat"
          >
            <Plus size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>



      {/* Chat List */}
      <div className={
        cn(
          "relative flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth",
          messages.length === 0
            ? "flex flex-col items-center justify-center text-center p-0"
            : "px-3 sm:px-4 md:px-5 lg:px-6 pt-20 md:pt-24 block " + (showBottomClarification ? "pb-[350px] md:pb-[400px]" : "pb-64 sm:pb-72 md:pb-80")
        )
      } >
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "w-full",
                appMode === 'tutor' ? "h-[calc(100vh-140px)] flex flex-col items-center justify-center" : ""
              )}
            >
              {appMode === 'tutor' ? (
                <div className="w-full flex items-center justify-center h-full">
                  <ResearchWelcome
                    userName={user?.fullName || 'User'}
                    initialQuery=""
                    onSearch={(query, attachments, model, reasoning) => {
                      // Separate images from other attachments
                      const images = attachments?.filter(a => a.type === 'file' && a.mimeType?.startsWith('image/'))
                        .map(a => a.content) || [];

                      const otherAttachments = attachments?.filter(a => !(a.type === 'file' && a.mimeType?.startsWith('image/')))
                        .map(a => ({
                          type: a.type,
                          name: a.name,
                          content: a.content,
                          mimeType: a.mimeType
                        })) as Attachment[];

                      // Send
                      handleSend(query, 'tutor', undefined, reasoning, otherAttachments, images);
                    }}
                    isWebSearchEnabled={enableWebSearch}
                    onToggleWebSearch={setEnableWebSearch}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full max-w-2xl px-4 space-y-4 pt-20 mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-zinc-200 flex items-center justify-center">
                    <Bot size={22} className="text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-zinc-900">Describe what you want to build</h2>
                  <p className="text-zinc-500 text-sm max-w-xl text-center">
                    Contoh: “Buat landing page SaaS modern dengan hero, fitur grid, pricing, dan footer.”<br />
                    Sertakan gaya (minimalis, glassmorphism), warna, atau referensi UI jika ada.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Show codebase exploration if active */}
              {isExploringCodebase && (
                <div className="flex flex-col gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                      <Bot size={14} className="text-zinc-500" />
                    </div>
                    <span className="text-xs text-zinc-400">NOIR BUILDER</span>
                  </div>
                  <div className="max-w-[85%] bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                    <CodebaseExplorer
                      analysis={codebaseAnalysis}
                      isExploring={isExploringCodebase}
                    />
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => {
                const clarification = msg.role === 'ai' ? parseClarificationFromAIResponse(msg.content) : null;
                const showClarification = clarification?.hasClarification && !answeredClarifications[msg.id];
                
                return (
                <div key={msg.id} className={cn("flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? 'items-end' : 'items-start')}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                        <Bot size={14} className="text-zinc-500" />
                      </div>
                      <span className="text-xs text-zinc-500 font-medium">
                        Noir AI
                      </span>
                    </div>
                  )}
                  <div className={cn(
                    "relative leading-relaxed transition-all duration-200",
                    msg.role === 'user'
                      ? "rounded-[18px] px-5 py-2.5 bg-[#F4F1EB] text-zinc-800 font-normal max-w-[85%] sm:max-w-[70%] ml-auto"
                      : "px-0 py-0 bg-transparent text-gray-800 max-w-full w-full"
                  )}>
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex gap-3 mb-4 flex-wrap">
                        {msg.images.map((img, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="relative group cursor-pointer"
                            onClick={() => setLightboxImage(img)}
                          >
                            <img src={img} alt="Attached" className={cn(
                              "object-cover shadow-xl transition-transform hover:scale-105",
                              appMode === 'tutor'
                                ? "w-28 h-28 md:w-36 md:h-36 rounded-xl md:rounded-2xl border-2 border-blue-500/30"
                                : "w-24 h-24 md:w-32 md:h-32 rounded-lg md:rounded-xl border border-purple-500/30 shadow-lg"
                            )} />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl flex items-center justify-center">
                              <ZoomIn size={24} className="text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-col gap-2 mb-4">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl max-w-sm backdrop-blur-sm">
                            <div className="p-2 bg-white/50 dark:bg-white/10 rounded-lg">
                              {att.type === 'file' ? <FileText size={20} className="text-zinc-700 dark:text-zinc-300" /> :
                                att.type === 'audio' ? <Play size={20} className="text-zinc-700 dark:text-zinc-300" /> :
                                  att.type === 'youtube' ? <Youtube size={20} className="text-red-500" /> :
                                    <Paperclip size={20} className="text-zinc-700 dark:text-zinc-300" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{att.name}</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{att.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.isComparison ? (
                      <div className="flex flex-col gap-4 w-full mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Option A */}
                          <div className={cn(
                            "flex flex-col gap-3 p-4 md:p-5 rounded-[22px] border-2 transition-all duration-300",
                            msg.selectedVersion === 'a' 
                              ? "bg-purple-50/40 border-purple-500/30 shadow-lg shadow-purple-500/5 ring-1 ring-purple-500/20" 
                              : "bg-white/80 backdrop-blur-sm border-zinc-100/80 shadow-sm hover:border-zinc-200"
                          )}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                  <Sparkles size={12} className="text-purple-600" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900/40">Versi Alpha</span>
                              </div>
                              {msg.selectedVersion === 'a' && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 rounded-full">
                                  <Check size={12} className="text-purple-600" strokeWidth={3} />
                                  <span className="text-[10px] font-bold text-purple-600">SELECTED</span>
                                </div>
                              )}
                            </div>
                            <div className="prose prose-sm max-w-none text-zinc-800 leading-relaxed font-normal">
                              {/* Sync from hook or use msg.contentA */}
                              <StreamingResponse 
                                content={msg.contentA || ''} 
                                isStreaming={isTyping && idx === messages.length - 1 && !msg.contentA && dualStream.streamA.isStreaming} 
                              />
                            </div>
                            {!msg.selectedVersion && (
                              <button 
                                onClick={() => saveComparison(msg.id, 'a')}
                                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[0px]"
                              >
                                Gunakan Jawaban Ini
                              </button>
                            )}
                          </div>

                          {/* Option B */}
                          <div className={cn(
                            "flex flex-col gap-3 p-4 md:p-5 rounded-[22px] border-2 transition-all duration-300",
                            msg.selectedVersion === 'b' 
                              ? "bg-blue-50/40 border-blue-500/30 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20" 
                              : "bg-white/80 backdrop-blur-sm border-zinc-100/80 shadow-sm hover:border-zinc-200"
                          )}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Sparkles size={12} className="text-blue-600" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900/40">Versi Beta</span>
                              </div>
                              {msg.selectedVersion === 'b' && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 rounded-full">
                                  <Check size={12} className="text-blue-600" strokeWidth={3} />
                                  <span className="text-[10px] font-bold text-blue-600">SELECTED</span>
                                </div>
                              )}
                            </div>
                            <div className="prose prose-sm max-w-none text-zinc-800 leading-relaxed font-normal">
                              <StreamingResponse 
                                content={msg.contentB || ''} 
                                isStreaming={isTyping && idx === messages.length - 1 && !msg.contentB && dualStream.streamB.isStreaming} 
                              />
                            </div>
                            {!msg.selectedVersion && (
                              <button 
                                onClick={() => saveComparison(msg.id, 'b')}
                                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-white border-2 border-zinc-100 text-zinc-900 text-[11px] font-bold hover:bg-zinc-50 transition-all shadow-sm flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[0px]"
                              >
                                Gunakan Jawaban Ini
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : msg.role === 'ai' ? (
                      <div className="prose prose-sm sm:prose-base max-w-none w-full break-words overflow-hidden
                        prose-p:text-zinc-800 prose-p:leading-7 prose-p:my-4 prose-p:text-[15px] sm:prose-p:text-base
                        prose-headings:text-zinc-900 prose-headings:font-bold prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-4
                        prose-h1:text-xl sm:prose-h1:text-2xl prose-h1:border-b prose-h1:border-zinc-200 prose-h1:pb-2
                        prose-h2:text-lg sm:prose-h2:text-xl
                        prose-h3:text-base sm:prose-h3:text-lg
                        prose-strong:text-zinc-900 prose-strong:font-semibold
                        prose-em:text-zinc-600 prose-em:italic
                        prose-code:text-[13px] prose-code:text-[#0164FF] prose-code:bg-blue-50/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-blue-100
                        prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:border-0 prose-pre:shadow-none
                        prose-ul:my-4 prose-ul:pl-6 prose-ul:space-y-2
                        prose-ol:my-4 prose-ol:pl-6 prose-ol:space-y-2
                        prose-li:text-zinc-800 prose-li:leading-7 prose-li:my-0 prose-li:marker:text-zinc-400
                        prose-blockquote:border-l-4 prose-blockquote:border-zinc-200 prose-blockquote:bg-transparent prose-blockquote:pl-4 prose-blockquote:text-zinc-600 prose-blockquote:italic prose-blockquote:my-4
                        prose-table:my-6 prose-table:w-full prose-table:border-collapse prose-table:text-sm
                        prose-th:text-left prose-th:font-semibold prose-th:text-zinc-900 prose-th:bg-zinc-50 prose-th:border prose-th:border-zinc-200 prose-th:px-4 prose-th:py-2
                        prose-td:text-zinc-700 prose-td:border prose-td:border-zinc-200 prose-td:px-4 prose-td:py-2
                        prose-a:text-[#0164FF] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-xl prose-img:shadow-sm prose-img:my-6
                        prose-hr:border-zinc-200 prose-hr:my-8
                      ">
                        {/* Parse and render sources if available (at top of message like ChatGPT) */}
                        {(() => {
                          const sourcesMatch = msg.content.match(/<!-- SOURCES_JSON:(.*?) -->/);
                          if (sourcesMatch) {
                            try {
                              const sources = JSON.parse(sourcesMatch[1]);
                              return (
                                <div className="mb-4 not-prose">
                                  <SourcesIndicator sources={sources} messageId={msg.id} />
                                </div>
                              );
                            } catch (e) {
                              return null;
                            }
                          }
                          return null;
                        })()}

                        {/* Use StreamingResponse for AI messages with hierarchical support */}
                        <StreamingResponse
                          content={clarification?.hasClarification ? clarification.cleanText : msg.content}
                          isStreaming={isTyping && idx === messages.length - 1}
                        />

                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100 leading-relaxed text-sm">
                        {msg.content.replace(/<!-- SOURCES_JSON:.*? -->/g, '')}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons - Different for Tutor vs Builder */}
                  {
                    msg.role === 'ai' && (
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Copy Button */}
                          <button
                            onClick={() => {
                              copyToClipboard(msg.content, () => {
                                setCopiedMessageId(msg.id);
                                setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
                              });
                            }}
                            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1.5"
                            title="Copy text"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check size={14} className="text-green-400" />
                                <span className="text-xs text-green-400 font-medium animate-pulse">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span className="text-xs">Copy</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={async () => {
                              const newFeedback = messageFeedback[msg.id] === 'like' ? null : 'like';
                              setMessageFeedback(prev => ({ ...prev, [msg.id]: newFeedback }));

                              // Send to Database
                              if (sessionId && user) {
                                try {
                                  const { supabase } = await import('@/lib/supabase');
                                  await supabase
                                    .from('messages')
                                    .update({ feedback: newFeedback })
                                    .eq('id', msg.id);
                                } catch (err) {
                                  console.error('Error sending feedback:', err);
                                }
                              }
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-zinc-800 rounded hover:bg-zinc-100 transition-colors",
                              messageFeedback[msg.id] === 'like' && "text-blue-500 hover:text-blue-600 font-medium"
                            )}
                            title="Good response"
                          >
                            <ThumbsUp size={14} className={cn(messageFeedback[msg.id] === 'like' && "fill-current")} />
                          </button>
                          <button
                            onClick={async () => {
                              const newFeedback = messageFeedback[msg.id] === 'dislike' ? null : 'dislike';
                              setMessageFeedback(prev => ({ ...prev, [msg.id]: newFeedback }));

                              // Send to Database
                              if (sessionId && user) {
                                try {
                                  const { supabase } = await import('@/lib/supabase');
                                  await supabase
                                    .from('messages')
                                    .update({ feedback: newFeedback })
                                    .eq('id', msg.id);
                                } catch (err) {
                                  console.error('Error sending feedback:', err);
                                }
                              }
                            }
                            }
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-zinc-800 rounded hover:bg-zinc-100 transition-colors",
                              messageFeedback[msg.id] === 'dislike' && "text-red-500 hover:text-red-600 font-medium"
                            )}
                            title="Bad response"
                          >
                            <ThumbsDown size={14} className={cn(messageFeedback[msg.id] === 'dislike' && "fill-current")} />
                          </button>

                          <button
                            onClick={handleShareChat}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-zinc-800 rounded hover:bg-zinc-100 transition-colors"
                            title="Share"
                          >
                            <Share size={14} />
                          </button>
                          {/* Regenerate Button with Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setRegenerateMenuOpen(regenerateMenuOpen === msg.id ? null : msg.id)}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-zinc-800 rounded hover:bg-zinc-100 transition-colors"
                              title="Regenerate"
                            >
                              <RefreshCcw size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            {regenerateMenuOpen === msg.id && (
                              <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animation-in fade-in zoom-in-95 duration-200">
                                <button
                                  onClick={() => {
                                    handleRegenerate(msg.id);
                                    setRegenerateMenuOpen(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <RefreshCcw size={12} />
                                  With no changes
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-white rounded hover:bg-white/5 transition-colors"
                            title="More"
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {appMode === 'builder' && msg.code && (
                            <>
                              <div className="w-[1px] h-3 bg-white/10 mx-1" />
                              <button
                                onClick={() => {
                                  if (msg.code) {
                                    setCurrentCode(msg.code);
                                    fileManager.clear();
                                    fileManager.addFile('index.html', msg.code, 'page');
                                    fileManager.setEntry('index.html');
                                    setSelectedFile('index.html');
                                    if (!openFiles.includes('index.html')) {
                                      setOpenFiles(prev => [...prev, 'index.html']);
                                    }
                                    setRefreshKey(k => k + 1);
                                  }
                                  setActiveTab('preview');
                                  if (isMobile) setMobileTab('workbench');
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-white/10"
                              >
                                <Eye size={14} /> View Generated
                              </button>
                              <button
                                onClick={() => {
                                  copyToClipboard(msg.code || '');
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-white/10"
                              >
                                <Copy size={14} /> Copy Code
                              </button>
                            </>
                          )}
                          {/* Redundant copy button removed */}
                        </div>
                      </div>
                    )
                  }
                </div>
                );
              })}
              {isTyping && (() => {
                // Context-aware loading messages based on last user prompt
                const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                const promptLower = (lastUserMsg?.content || '').toLowerCase();

                const codingKw = ['code', 'coding', 'function', 'component', 'debug', 'error', 'react', 'javascript', 'typescript', 'python', 'html', 'css', 'api', 'kode', 'program', 'algorithm', 'server', 'backend', 'frontend', 'database', 'sql', 'deploy'];
                const pdfKw = ['pdf', 'dokumen', 'document', 'export'];
                const designKw = ['design', 'desain', 'ui', 'ux', 'layout', 'landing page', 'website', 'visual', 'mockup', 'template'];

                let contextMessages: string[] | undefined;
                if (codingKw.some(kw => promptLower.includes(kw))) {
                  contextMessages = [
                    "Noir is writing code...",
                    "Analyzing your request...",
                    "Generating solution...",
                    "Building components...",
                    "Almost done..."
                  ];
                } else if (pdfKw.some(kw => promptLower.includes(kw))) {
                  contextMessages = [
                    "Noir is creating document...",
                    "Structuring content...",
                    "Formatting layout...",
                    "Generating PDF...",
                    "Almost done..."
                  ];
                } else if (designKw.some(kw => promptLower.includes(kw))) {
                  contextMessages = [
                    "Noir is designing...",
                    "Crafting visual layout...",
                    "Building interface...",
                    "Polishing design...",
                    "Almost done..."
                  ];
                }

                return (
                  <div className="pl-2">
                    <AILoading
                      mode={appMode || 'tutor'}
                      status={workflowStatus?.message}
                      loadingMessages={contextMessages}
                      userPrompt={lastUserMsg?.content}
                      hasImages={lastUserMsg?.images && lastUserMsg.images.length > 0}
                    />
                  </div>
                );
              })()}
              <div ref={messagesEndRef} />
            </motion.div>
          )
          }
        </AnimatePresence >
      </div >

      {/* Soft Limit Warning Banner */}
      {
        softLimitReached && !isSubscribed && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-md px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/90 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md shadow-lg flex items-center justify-center gap-2 pointer-events-auto mx-auto"
            >
              <AlertTriangle size={14} className="fill-white/20" />
              <span className="font-medium">⚡ Low Credits: {credits} remaining today (Reset at 00:00)</span>
              <Link to="/pricing" className="underline hover:no-underline ml-1">Upgrade</Link>
            </motion.div>
          </div>
        )
      }

      {/* Clarification Widget Area (Claude Style) */}
      <AnimatePresence>
        {showBottomClarification && activeClarification?.question && activeClarification?.options && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: 10, x: "-50%" }}
            className="absolute bottom-4 left-1/2 z-40 w-full max-w-2xl px-4"
          >
            <InteractiveQAWidget
              question={activeClarification.question}
              options={activeClarification.options}
              allowCustomInput={true}
              onSelect={(selectedOption) => {
                setAnsweredClarifications(prev => ({ ...prev, [activeClarification.id]: true }));
                const responseText = `Q: ${activeClarification.question}\nA: ${selectedOption}`;
                handleSend(responseText, appMode);
              }}
              onSkip={() => {
                setAnsweredClarifications(prev => ({ ...prev, [activeClarification.id]: true }));
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area - ChatGPT Style - Show after first message or always for tutor mode */}
      {
        !showBottomClarification && messages.length > 0 && (
          <ChatInput
            input={input}
            setInput={setInput}
            handleSend={(deepDive?: boolean) => handleSend(deepDive)}
            isTyping={isTyping}
            attachedImages={attachedImages}
            removeImage={removeImage}
            appMode={appMode}
            isMobile={isMobile}
            isSubscribed={isSubscribed || false}
            tokensUsed={tokensUsed || 0}
            enableWebSearch={enableWebSearch}
            setEnableWebSearch={setEnableWebSearch}
            setShowQuiz={setShowQuiz}
            setShowNotes={setShowNotes}
            setShowDashboard={setShowDashboard}
            setShowFlashcards={setShowFlashcards}
            setShowVoiceCall={setShowVoiceCall}
            comparisonMode={comparisonMode}
            onComparisonModeToggle={setComparisonMode}
            toggleCanvas={() => {
              // Toggle canvas panel
              if (appMode === 'builder') {
                setActiveTab(activeTab === 'preview' ? 'code' : 'preview');
              } else {
                // For now, simple console log or switch mode if applicable
                console.log("Toggle Canvas triggered");
              }
            }}
            fileInputRef={fileInputRef}
            documentInputRef={documentInputRef}
            handleFileChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    if (dataUrl) setAttachedImages(prev => [...prev, dataUrl]);
                  };
                  reader.readAsDataURL(file);
                });
              }
            }}
            handleCameraCapture={handleCameraCapture}
            setUploadedDocument={setUploadedDocument}
            setShowDocumentViewer={setShowDocumentViewer}
            uploadedDocument={uploadedDocument}
            messagesLength={messages.length}

            // Model Selection Props
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            withReasoning={withReasoning}
            setWithReasoning={setWithReasoning}

            // File Upload Props
            attachedFiles={attachedFiles}
            onFilesSelected={(files) => setAttachedFiles(prev => [...prev, ...files])}
            removeFile={(index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}

            // Deep Research Props
            deepResearchMode={deepResearchMode}
            onToggleDeepResearch={setDeepResearchMode}
          />
        )
      }
    </div >
  );

  const workbenchContent = (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-md border-l border-white/20 font-sans relative overflow-hidden">
      {/* Workbench Header - Clean Dark Style */}
      <div className={cn(
        "relative z-[100] border-b border-white/20 flex items-center justify-between shrink-0 bg-white/40 backdrop-blur-md",
        isMobile ? "h-12 px-3" : "h-11 px-4"
      )}>
        {/* Left: Tabs & FileTree Toggle (Mobile/Tablet) */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {/* FileTree Toggle Button - Mobile/Tablet Only */}
          {(isMobile || isTablet) && activeTab === 'code' && fileManager.getAllFiles().length > 0 && (
            <button
              onClick={() => setFileTreeOpen(!fileTreeOpen)}
              className={cn(
                "p-2.5 md:p-2 rounded-lg transition-colors shrink-0 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center",
                "bg-white hover:bg-zinc-100 border border-zinc-200",
                fileTreeOpen && "bg-purple-50 border-purple-200"
              )}
              title={fileTreeOpen ? "Hide File Tree" : "Show File Tree"}
              aria-label={fileTreeOpen ? "Hide File Tree" : "Show File Tree"}
            >
              <Folder size={16} className={fileTreeOpen ? "text-purple-600" : "text-zinc-400"} />
            </button>
          )}
          {/* Tabs - Clean Dark Style */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-100 rounded-lg p-0.5 sm:p-1 border border-zinc-200 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-2 md:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all min-h-[44px] md:min-h-0 whitespace-nowrap shrink-0",
                activeTab === 'preview'
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Play size={isMobile ? 10 : 12} className={activeTab === 'preview' ? "fill-current" : ""} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-2 md:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all min-h-[44px] md:min-h-0 whitespace-nowrap shrink-0",
                activeTab === 'design'
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Palette size={isMobile ? 10 : 12} />
              <span>Design</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('code');
                if (!selectedFile && fileManager.getEntry()) {
                  setSelectedFile(fileManager.getEntry());
                  if (!openFiles.includes(fileManager.getEntry()!)) {
                    setOpenFiles(prev => [...prev, fileManager.getEntry()!]);
                  }
                }
              }}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-2 md:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all min-h-[44px] md:min-h-0 whitespace-nowrap shrink-0",
                activeTab === 'code'
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Code size={isMobile ? 10 : 12} />
              <span>Code</span>
            </button>
          </div>
          {/* Design Tools (when Design tab is active) */}
          {activeTab === 'design' && (
            <div className={cn(
              "flex items-center gap-1 ml-2 pl-2 border-l border-zinc-200",
              isMobile && "hidden"
            )}>
              <button
                onClick={() => setShowDesignTools(!showDesignTools)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Fonts"
                aria-label="Fonts"
              >
                <Type size={12} />
              </button>
              <button
                onClick={() => setShowDesignTools(!showDesignTools)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Colors"
                aria-label="Colors"
              >
                <Palette size={12} />
              </button>
              <button
                onClick={() => setShowDesignTools(!showDesignTools)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Assets"
                aria-label="Assets"
              >
                <ImageIcon size={12} />
              </button>
            </div>
          )}

          {/* Design Tools Toggle Button - Mobile Only */}
          {activeTab === 'design' && isMobile && (
            <button
              onClick={() => setShowDesignTools(!showDesignTools)}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ml-2"
              title="Design Tools"
              aria-label="Design Tools"
            >
              <Palette size={16} />
            </button>
          )}
        </div>

        {/* Center: Canvas Controls - Clean Dark Style - Hide on mobile, show in right section */}
        {activeTab === 'preview' && !isMobile && (
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
              <button
                onClick={() => {
                  const newZoom = Math.max(canvasZoom - 10, 25);
                  setCanvasZoom(newZoom);
                }}
                className="p-1.5 hover:bg-zinc-200 rounded transition-colors w-6 h-6 flex items-center justify-center min-w-[24px] min-h-[24px]"
                disabled={canvasZoom <= 25}
                aria-label="Zoom out"
              >
                <ZoomOut size={12} className={canvasZoom <= 25 ? "text-zinc-300" : "text-zinc-500"} />
              </button>
              <span className="text-xs text-zinc-500 min-w-[40px] text-center font-mono">{canvasZoom}%</span>
              <button
                onClick={() => {
                  const newZoom = Math.min(canvasZoom + 10, 200);
                  setCanvasZoom(newZoom);
                }}
                className="p-1.5 hover:bg-zinc-200 rounded transition-colors w-6 h-6 flex items-center justify-center min-w-[24px] min-h-[24px]"
                disabled={canvasZoom >= 200}
                aria-label="Zoom in"
              >
                <ZoomIn size={12} className={canvasZoom >= 200 ? "text-zinc-300" : "text-zinc-500"} />
              </button>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className={cn(
          "flex items-center shrink-0",
          isMobile ? "gap-0.5" : "gap-2"
        )}>
          {/* Canvas Controls - Mobile only (moved here) */}
          {activeTab === 'preview' && isMobile && (
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 mr-1">
              <button
                onClick={() => {
                  const newZoom = Math.max(canvasZoom - 10, 25);
                  setCanvasZoom(newZoom);
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                disabled={canvasZoom <= 25}
                aria-label="Zoom out"
              >
                <ZoomOut size={12} className={canvasZoom <= 25 ? "text-gray-600" : "text-gray-400"} />
              </button>
              <span className="text-[10px] text-gray-400 min-w-[32px] text-center font-mono">{canvasZoom}%</span>
              <button
                onClick={() => {
                  const newZoom = Math.min(canvasZoom + 10, 200);
                  setCanvasZoom(newZoom);
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                disabled={canvasZoom >= 200}
                aria-label="Zoom in"
              >
                <ZoomIn size={12} className={canvasZoom >= 200 ? "text-gray-600" : "text-gray-400"} />
              </button>
            </div>
          )}

          {/* Undo/Redo - Hide on very small mobile screens */}
          {!isMobile && (
            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/5 mr-1">
              <button
                onClick={() => {
                  const undoRedo = getUndoRedoManager();
                  const operation = undoRedo.undo();
                  if (operation && selectedFile) {
                    // Get content from operation (oldContent for undo)
                    const content = operation.oldContent || '';
                    if (content) {
                      fileManager.addFile(selectedFile, content, 'page');
                      setCurrentCode(content);
                      setRefreshKey(k => k + 1);
                    }
                  }
                }}
                className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
                title="Undo"
              >
                <Undo2 size={12} className="text-zinc-500" />
              </button>
              <button
                onClick={() => {
                  const undoRedo = getUndoRedoManager();
                  const operation = undoRedo.redo();
                  if (operation && selectedFile) {
                    // Get content from operation (newContent for redo)
                    const content = operation.newContent || '';
                    if (content) {
                      fileManager.addFile(selectedFile, content, 'page');
                      setCurrentCode(content);
                      setRefreshKey(k => k + 1);
                    }
                  }
                }}
                className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
                title="Redo"
              >
                <Redo2 size={12} className="text-zinc-500" />
              </button>
            </div>
          )}

          {/* Device Preview Toggles - Responsive sizing */}
          {activeTab === 'preview' && (
            <div className={cn(
              "flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5 border border-zinc-200",
              isMobile ? "mr-0.5" : "mr-1"
            )}>
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={cn(
                  "rounded-md transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center",
                  isMobile ? "p-1.5" : "p-1.5",
                  previewDevice === 'desktop'
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                )}
                title="Desktop"
                aria-label="Desktop view"
              >
                <Monitor size={isMobile ? 12 : 12} />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={cn(
                  "rounded-md transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center",
                  isMobile ? "p-1.5" : "p-1.5",
                  previewDevice === 'tablet'
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                )}
                title="Tablet"
                aria-label="Tablet view"
              >
                <Smartphone size={isMobile ? 12 : 12} className="rotate-90" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={cn(
                  "rounded-md transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center",
                  isMobile ? "p-1.5" : "p-1.5",
                  previewDevice === 'mobile'
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                )}
                title="Mobile"
                aria-label="Mobile view"
              >
                <Smartphone size={isMobile ? 12 : 12} />
              </button>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={async () => {
              // Check if it's multi-file project
              const files = fileManager.getAllFiles();
              if (files.length > 0 && currentFramework && currentFramework !== 'html') {
                await downloadProjectFiles();
              } else {
                const code = currentCode || fileManager.getFile(fileManager.getEntry())?.content || '';
                if (!code) return;
                const blob = new Blob([code], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'index.html';
                a.click();
                URL.revokeObjectURL(url);
              }
            }}
            className={cn(
              "flex items-center font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-white/5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0",
              isMobile ? "gap-1 px-2 py-1.5 text-[10px] justify-center" : "gap-1.5 px-3 py-1.5 text-[11px]"
            )}
            title="Export"
            aria-label="Export"
          >
            <Download size={isMobile ? 14 : 10} />
            {!isMobile && <span>Export</span>}
          </button>

          {/* Workspace Menu */}
          <div className="ml-1">
            <WorkspaceMenu
              onOpenComponents={() => setShowComponentLibrary(true)}
              onOpenGitHub={() => setShowGitHubIntegration(true)}
              onOpenHistory={() => setShowVersionHistory(true)}
              onOpenDesignSystem={() => setShowDesignSystem(true)}
              onOpenDatabase={() => { }} // Database panel removed - using Firebase
              onOpenAPI={() => setShowAPIIntegration(true)}
              onOpenMobile={() => setShowMobileGenerator(true)}
            />
          </div>
        </div>
      </div>

      {/* Design Tools Panel (Slide-in) - Mobile: Full overlay, Desktop: Side panel */}
      {showDesignTools && activeTab === 'design' && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setShowDesignTools(false)}
            />
          )}
          <div className={cn(
            "absolute left-0 top-14 bottom-0 bg-[#1a1a1a] border-r border-white/10 z-40 shadow-2xl transition-all",
            isMobile ? "w-full" : "w-80"
          )}>
            <div className="p-3 md:p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Design Tools</h3>
              <button
                onClick={() => setShowDesignTools(false)}
                className="p-2 hover:bg-white/10 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close design tools"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="p-3 md:p-4 space-y-4 md:space-y-6 overflow-y-auto">
              {/* Fonts */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-2 block">Fonts</label>
                <div className="space-y-2">
                  {['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans'].map((font) => (
                    <button
                      key={font}
                      onClick={() => {
                        // TODO: Apply font to code
                        console.log('Font selected:', font);
                      }}
                      className="w-full px-3 py-2.5 md:py-2 text-left text-sm rounded-lg transition-colors bg-white/5 text-gray-300 hover:bg-white/10 min-h-[44px] md:min-h-0"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-2 block">Colors</label>
                <div className="grid grid-cols-5 gap-2">
                  {['#7e22ce', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316'].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        // TODO: Apply color to code
                        console.log('Color selected:', color);
                      }}
                      className="w-full aspect-square rounded-lg transition-all hover:scale-105 min-w-[44px] min-h-[44px]"
                      style={{ backgroundColor: color }}
                      title={color}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex overflow-hidden relative bg-[#050505] transition-all",
        showDesignTools && activeTab === 'design' && !isMobile ? "ml-80" : "ml-0"
      )}>
        {activeTab === 'design' ? (
          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Design Settings</h2>
              <p className="text-sm sm:text-base text-gray-400 mb-4">Use the design tools in the toolbar to customize fonts, colors, and assets.</p>
              <div className="bg-[#1a1a1a] rounded-lg border border-white/10 p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-gray-500">Design tools panel will appear when you click Fonts, Colors, or Assets buttons in the toolbar.</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'code' ? (
          /* Code Editor Mode with FileTree */
          <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-zinc-900"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>}>
            <div className="flex-1 flex h-full relative">
              {/* FileTree Sidebar - Responsive */}
              {fileManager.getAllFiles().length > 0 && (
                <div className={cn(
                  "shrink-0 border-r border-white/5 bg-[#0a0a0a] transition-all duration-300 overflow-hidden",
                  // Desktop: always visible
                  !isMobile && !isTablet && "w-64",
                  // Tablet: can be toggled
                  isTablet && (fileTreeOpen ? "w-64 absolute inset-y-0 left-0 z-30 shadow-2xl" : "w-0"),
                  // Mobile: can be toggled, full overlay
                  isMobile && (fileTreeOpen ? "w-full absolute inset-0 z-30 shadow-2xl" : "w-0")
                )}>
                  <div className="h-full flex flex-col">
                    {/* FileTree Header with Close Button (Mobile/Tablet) */}
                    {(isMobile || isTablet) && (
                      <div className="flex items-center justify-between p-3 border-b border-white/5">
                        <h3 className="text-sm font-semibold text-white">Files</h3>
                        <button
                          onClick={() => setFileTreeOpen(false)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <X size={16} className="text-gray-400" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                      <FileTree
                        files={fileManager.getAllFiles()}
                        selectedFile={selectedFile}
                        onSelectFile={(path) => {
                          setSelectedFile(path);
                          if (!openFiles.includes(path)) {
                            setOpenFiles(prev => [...prev, path]);
                          }
                          // Close file tree on mobile/tablet after selection
                          if (isMobile || isTablet) {
                            setFileTreeOpen(false);
                          }
                        }}
                        onNewFile={(parentPath) => {
                          const newPath = parentPath
                            ? `${parentPath}/new-file.tsx`
                            : `src/components/new-file.tsx`;
                          fileManager.addFile(newPath, '', 'component');
                          setSelectedFile(newPath);
                          setOpenFiles(prev => [...prev, newPath]);
                          if (isMobile || isTablet) {
                            setFileTreeOpen(false);
                          }
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
                  </div>
                </div>
              )}
              {/* Overlay untuk mobile ketika file tree terbuka */}
              {(isMobile || isTablet) && fileTreeOpen && (
                <div
                  className="absolute inset-0 bg-black/50 z-20"
                  onClick={() => setFileTreeOpen(false)}
                />
              )}

              {/* Code Editor Area */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* File Tabs */}
                {openFiles.length > 0 && (
                  <div className={cn(
                    "flex items-center gap-1 bg-zinc-50 border-b border-zinc-200 overflow-x-auto scrollbar-thin scrollbar-thumb-purple-200",
                    isMobile ? "px-1" : "px-2"
                  )}>
                    {openFiles.map(path => {
                      const file = fileManager.getFile(path);
                      return (
                        <div
                          key={path}
                          className={clsx(
                            "flex items-center gap-1 md:gap-2 rounded-t-lg transition-colors whitespace-nowrap shrink-0",
                            isMobile ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
                            selectedFile === path
                              ? "bg-white text-zinc-900 border-t border-l border-r border-zinc-200"
                              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                          )}
                        >
                          <button
                            onClick={() => setSelectedFile(path)}
                            className="flex items-center gap-1 md:gap-2 flex-1 min-w-0"
                          >
                            <FileCode size={isMobile ? 10 : 12} />
                            <span className={cn(
                              "truncate",
                              isMobile ? "max-w-[80px]" : "max-w-[120px]"
                            )}>{path.split('/').pop()}</span>
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
                            className={cn(
                              "ml-1 hover:bg-white/10 rounded shrink-0",
                              isMobile ? "p-0.5" : "p-0.5"
                            )}
                            title="Close file"
                          >
                            <X size={isMobile ? 10 : 12} />
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
                    value={(() => {
                      const file = fileManager.getFile(selectedFile);
                      const content = file?.content;
                      // Ensure content is always a string
                      return typeof content === 'string' ? content : String(content || '');
                    })()}
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
                  <div className="flex-1 flex items-center justify-center text-zinc-400">
                    <div className="text-center">
                      <FileCode size={48} className="mx-auto mb-4 opacity-50 text-zinc-300" />
                      <p>No file selected</p>
                      <p className="text-sm mt-2">Select a file from the tree or generate code</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </React.Suspense>
        ) : activeTab === 'visual' ? (
          <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-zinc-900"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>}>
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-50 min-h-0">
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
            </div>
          </React.Suspense>
        ) : activeTab === 'preview' ? (
          <PreviewContainer
            isMobile={isMobile}
            previewDevice={previewDevice}
            isSubscribed={isSubscribed || false}
            hasExceeded={hasExceeded || false}
            isBuildingCode={isBuildingCode}
            isExploringCodebase={isExploringCodebase}
            fileManager={fileManager}
            currentCode={currentCode}
            currentFramework={currentFramework as Framework}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
            setCurrentCode={setCurrentCode}
            setSelectedFile={setSelectedFile}
            setOpenFiles={setOpenFiles}
            messages={messages}
            canvasZoom={canvasZoom}
            selectedFile={selectedFile}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            <div className="w-56 border-r border-zinc-200 bg-zinc-50 flex flex-col">
              <div className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2.5 border-b border-zinc-200">
                <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Folder size={12} className="text-blue-600" />
                </div>
                <span>Explorer</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
                {files.map(file => <FileTreeItem key={file.name} node={file} />)}
              </div>
            </div>
            {/* Code Editor */}
            <div className="flex-1 bg-white overflow-hidden flex flex-col">
              <div className="h-11 bg-zinc-50 border-b border-zinc-200 flex items-center px-5 gap-3">
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
                  style={oneLight}
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
        <ChatTerminal
          isOpen={terminalOpen}
          onToggle={setTerminalOpen}
          logs={logs}
          onClear={() => setLogs([])}
        />


      </div >
    </div >
  );

  return (
    <>
      {/* DISABLED FOR TESTING - SubscriptionPopup modal */}
      {/* <SubscriptionPopup
        isOpen={showSubscriptionPopup}
        onClose={() => {
          setShowSubscriptionPopup(false);
          // Refresh limits after closing (in case user recharged)
          refreshLimit();
          refreshLimit();
        }}
        tokensUsed={tokensUsed}
        tokensLimit={FREE_TOKEN_LIMIT}
        onSelectFree={() => {
          setFreeFallback(true);
          setProvider('anthropic');
          setShowSubscriptionPopup(false);
          // Refresh limits
          refreshLimit();
          refreshLimit();
        }}
      /> */}
      <FeedbackPopup
        isOpen={showFeedbackPopup}
        onClose={handleFeedbackClose}
      />
      {/* Voice Call Modal - Only for Tutor Mode */}
      {appMode === 'tutor' && (
        <>
          {/* Learning Features Modals */}
          {showQuiz && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Quiz: {currentTopic || 'General'}</h2>
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <QuizPanel
                    topic={currentTopic || 'General'}
                    difficulty="medium"
                    provider={provider}
                    onClose={() => setShowQuiz(false)}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {showNotes && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Take Notes</h2>
                  <button
                    onClick={() => setShowNotes(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <NoteEditor
                    topic={currentTopic}
                    conversationId={currentSessionId || sessionId || undefined}
                    onSave={(note) => {
                      console.log('Note saved:', note);
                      setShowNotes(false);
                    }}
                    onClose={() => setShowNotes(false)}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {showDashboard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Learning Dashboard</h2>
                  <button
                    onClick={() => setShowDashboard(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <LearningDashboard />
                </div>
              </motion.div>
            </div>
          )}

          {showFlashcards && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Review Flashcards</h2>
                  <button
                    onClick={() => setShowFlashcards(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <FlashcardReview
                    topic={currentTopic}
                    limit={10}
                    onComplete={() => setShowFlashcards(false)}
                  />
                </div>
              </motion.div>
            </div>
          )}

          <VoiceCall
            isOpen={showVoiceCall}
            onClose={() => setShowVoiceCall(false)}
            provider={provider}
            sessionId={sessionId}
            onMessage={handleVoiceMessage}
          />
        </>
      )}
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <div className="flex h-dvh w-full bg-transparent text-zinc-900 overflow-hidden overscroll-none font-sans">
          {isMobile ? (
            /* MOBILE LAYOUT - Locked Viewport */
            <div className="flex flex-col fixed inset-0 w-full h-dvh overflow-hidden overscroll-none">
              {/* Mobile Sidebar Overlay */}
              {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-50 flex">
                  {/* Backdrop */}
                  <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsMobileSidebarOpen(false)}
                  />
                  {/* Sidebar Panel */}
                  <div className="relative w-4/5 max-w-[300px] h-full bg-white shadow-2xl animate-in slide-in-from-left duration-300">
                    <Sidebar
                      activeSessionId={sessionId}
                      onNewChat={() => {
                        handleNewChat();
                        setIsMobileSidebarOpen(false);
                      }}
                      onSelectSession={(sid) => {
                        handleSelectSession(sid);
                        setIsMobileSidebarOpen(false);
                      }}
                      onOpenSettings={() => {
                        handleOpenSettings();
                        setIsMobileSidebarOpen(false);
                      }}
                      onClose={() => setIsMobileSidebarOpen(false)}
                      isSubscribed={isSubscribed}
                    />
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm text-zinc-500 hover:text-zinc-900 z-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 relative overflow-hidden overflow-x-hidden">
                {/* Chat Layer */}
                <div className={cn("absolute inset-0 w-full h-full transition-transform duration-300 overflow-x-hidden", mobileTab === 'chat' ? 'translate-x-0' : '-translate-x-full')}>
                  {chatContent}
                </div>

                {/* Workbench Layer (Builder Mode) */}
                {appMode === 'builder' && (
                  <div className={cn("absolute inset-0 w-full h-full transition-transform duration-300 bg-zinc-50 overflow-x-hidden", mobileTab === 'workbench' ? 'translate-x-0' : 'translate-x-full')}>
                    {workbenchContent}
                  </div>
                )}

                {/* Canvas Layer (Canvas Mode) */}
                {appMode === 'canvas' && (
                  <div className={cn("absolute inset-0 w-full h-full transition-transform duration-300 bg-white overflow-x-hidden", mobileTab === 'canvas' ? 'translate-x-0' : 'translate-x-full')}>
                    <CanvasBoard onAnalyze={handleCanvasAnalyze} />
                  </div>
                )}
              </div>

              {/* Mobile Nav */}
              {(appMode === 'builder' || appMode === 'canvas') && (
                <div className="h-16 bg-white border-t border-zinc-200 flex items-center justify-around shrink-0 z-20 pb-safe px-safe">
                  <button
                    onClick={() => setMobileTab('chat')}
                    className={cn("flex flex-col items-center gap-1 p-3 md:p-2 rounded-lg transition-colors min-w-[60px] min-h-[60px] md:min-w-0 md:min-h-0 flex-shrink-0", mobileTab === 'chat' ? "text-purple-400" : "text-gray-500")}
                  >
                    <MessageSquare size={22} />
                    <span className="text-[10px] font-medium">Chat</span>
                  </button>
                  <div className="w-[1px] h-8 bg-white/5"></div>
                  {appMode === 'builder' && (
                    <button
                      onClick={() => setMobileTab('workbench')}
                      className={cn("flex flex-col items-center gap-1 p-3 md:p-2 rounded-lg transition-colors min-w-[60px] min-h-[60px] md:min-w-0 md:min-h-0 flex-shrink-0", mobileTab === 'workbench' ? "text-blue-400" : "text-gray-500")}
                    >
                      <Layout size={22} />
                      <span className="text-[10px] font-medium">Workbench</span>
                    </button>
                  )}
                  {appMode === 'canvas' && (
                    <button
                      onClick={() => setMobileTab('canvas')}
                      className={cn("flex flex-col items-center gap-1 p-3 md:p-2 rounded-lg transition-colors min-w-[60px] min-h-[60px] md:min-w-0 md:min-h-0 flex-shrink-0", mobileTab === 'canvas' ? "text-orange-400" : "text-gray-500")}
                    >
                      <Sparkles size={22} />
                      <span className="text-[10px] font-medium">Canvas</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* DESKTOP LAYOUT */
            <PanelGroup direction="horizontal" className="h-full">
              {/* Sidebar - Hidden completely when collapsed, only toggle icon in header */}
              {isSidebarOpen && !isSidebarCollapsed && (
                <>
                  <Panel
                    defaultSize={25}
                    minSize={20}
                    maxSize={35}
                    collapsible={false}
                    className="hidden md:block border-r border-zinc-200 transition-all duration-300 ease-in-out"
                  >
                    <Sidebar
                      activeSessionId={sessionId}
                      onNewChat={handleNewChat}
                      onSelectSession={handleSelectSession}
                      onOpenSettings={handleOpenSettings}
                      isSubscribed={isSubscribed}
                      onCollapse={toggleSidebarCollapse}
                      onClose={() => setIsSidebarCollapsed(false)}
                      isCollapsed={isSidebarCollapsed}
                    />
                  </Panel>
                  <PanelResizeHandle className="w-0 bg-transparent hover:w-1 hover:bg-blue-500/30 transition-all duration-200 cursor-col-resize z-50 relative group">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0 bg-transparent group-hover:w-0.5 group-hover:bg-blue-500/50 transition-all" />
                  </PanelResizeHandle>
                </>
              )}

              {/* Panel 1: Chat - Full width when sidebar collapsed */}
              <Panel
                defaultSize={
                  appMode === 'builder' && isCanvasOpen
                    ? 45
                    : (isSidebarOpen && !isSidebarCollapsed)
                      ? 75
                      : 100
                }
                minSize={appMode === 'builder' && isCanvasOpen ? 30 : 50}
                maxSize={appMode === 'builder' && isCanvasOpen ? 60 : 100}
                className="flex flex-col bg-transparent"
              >
                {chatContent}
              </Panel>

              {/* Panel 2: Canvas (Orak Orek) - Replacing Workbench */}
              {(appMode === 'builder' || appMode === 'canvas') && isCanvasOpen && (
                <>
                  <PanelResizeHandle className="w-1 bg-zinc-200 hover:w-2 hover:bg-purple-500/50 transition-all duration-200 cursor-col-resize z-50 relative group">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-purple-500/0 group-hover:bg-purple-500 transition-colors" />
                  </PanelResizeHandle>
                  <Panel defaultSize={65} minSize={50} className="flex flex-col bg-white overflow-hidden relative">
                    <CanvasBoard
                      onAnalyze={handleCanvasAnalysis}
                      isAnalyzing={isTyping}
                      onClose={() => setIsCanvasOpen(false)}
                    />
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
        projectName={`noir-ai-${sessionId || Date.now()}`}
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
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">Code Sandbox</h2>
              <button
                onClick={() => setShowCodeSandbox(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <CodeSandbox language="python" />
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal (Tutor Mode) */}
      {appMode === 'tutor' && showDocumentViewer && uploadedDocument && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xl">
            <DocumentViewer
              document={uploadedDocument}
              onClose={() => setShowDocumentViewer(false)}
            />
          </div>
        </div>
      )}

      {/* Search Results Panel (Tutor Mode) - HIDDEN PER USER REQUEST */}
      {/* {appMode === 'tutor' && searchResults.length > 0 && (
        <div className="fixed right-4 bottom-20 w-96 max-h-96 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden z-40 backdrop-blur-xl">
          <div className="flex items-center justify-between p-3 border-b border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
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
      )} */}

      {/* Planner Panel (Builder Mode) */}
      {appMode === 'builder' && (showPlanner || isGeneratingPlan) && (
        <div className="fixed right-4 top-20 bottom-20 w-96 bg-zinc-50 border border-zinc-200 rounded-xl shadow-2xl overflow-hidden z-40 backdrop-blur-xl flex flex-col">
          <PlannerPanel
            plan={currentPlan}
            isLoading={isGeneratingPlan}
            onPlanUpdate={(updatedPlan) => {
              setCurrentPlan(updatedPlan);
            }}
            onStartGeneration={() => {
              setShowPlanner(false);
              // Proceed with code generation
              handleSend(input, 'builder');
            }}
            onClose={() => {
              setShowPlanner(false);
              setIsGeneratingPlan(false);
            }}
            className="flex-1"
          />
        </div>
      )}

      {/* Design System Manager (Builder Mode) */}
      {appMode === 'builder' && (
        <DesignSystemManager
          isOpen={showDesignSystem}
          onClose={() => setShowDesignSystem(false)}
          onApply={(system: DesignSystem) => {
            // Apply design system to current code
            const entry = fileManager.getEntry();
            if (entry) {
              const file = fileManager.getFile(entry);
              if (file) {
                const updatedCode = designSystemManager.applyToCode(file.content, system);
                fileManager.addFile(entry, updatedCode, file.type);
                setCurrentCode(updatedCode);
                setRefreshKey(k => k + 1);
              }
            }
          }}
        />
      )}

      {/* Share Chat Modal - Fix for Safari Clipboard Issue */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <Share size={20} className="text-blue-500" />
                Share This Chat
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-500">
              Anyone with this link can view this chat session.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={() => {
                  // Synchronous copy for Safari compatibility
                  try {
                    const textArea = document.createElement("textarea");
                    textArea.value = shareUrl;
                    textArea.style.position = "fixed"; // Avoid scrolling to bottom
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);

                    if (successful) {
                      alert("Copied!");
                    } else {
                      // Fallback attempt with Navigator API if execCommand fails unexpectedly (unlikely on modern browsers)
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(shareUrl).then(() => alert("Copied!")).catch(() => alert("Failed to copy. Please select and copy manually."));
                      } else {
                        alert("Failed to copy. Please select the text and copy manually.");
                      }
                    }
                  } catch (err) {
                    console.error("Copy failed", err);
                    alert("Manual copy required.");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Copy Link"
              >
                <Copy size={18} />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-800 px-4 py-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Panel removed - using Firebase */}

      {/* API Integration Wizard (Builder Mode) */}
      {appMode === 'builder' && (
        <APIIntegrationWizard
          isOpen={showAPIIntegration}
          onClose={() => setShowAPIIntegration(false)}
          onGenerateCode={(code) => {
            // Add generated code as new file
            const fileName = `lib/api.ts`;
            fileManager.addFile(fileName, code, 'other');
            setOpenFiles(prev => [...prev, fileName]);
            setSelectedFile(fileName);
          }}
        />
      )}

      {/* Mobile Generator Modal - Keep for quick access from Tools menu */}
      {appMode === 'builder' && (
        <MobileGenerator
          isOpen={showMobileGenerator}
          onClose={() => setShowMobileGenerator(false)}
          webCode={currentCode || fileManager.getFile(fileManager.getEntry())?.content || ''}
          onGenerateCode={(files) => {
            // Add all generated mobile files
            files.forEach(file => {
              fileManager.addFile(file.path, file.content, 'other');
              setOpenFiles(prev => [...prev, file.path]);
            });
            if (files.length > 0) {
              setSelectedFile(files[0].path);
              setActiveTab('code');
            }
          }}
        />
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ChatInterface;

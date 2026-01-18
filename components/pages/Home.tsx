import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronDown, Paperclip, X, AlertTriangle, Image as ImageIcon, Camera, ImagePlus, Layout, Phone, ChevronLeft, Menu, User, Bot, CheckCircle2, Youtube, FileText, Loader2, File, Paintbrush, MessageSquare } from 'lucide-react';
import BentoGrid from '../BentoGrid';
import Integrations from '../Integrations';
import CTA from '../CTA';
import Footer from '../Footer';
import Background from '../ui/Background';
import { FlipText } from '../ui/flip-text';
import { AIProvider } from '@/lib/ai';
import { detectMode } from '@/lib/modeDetector';
import { useAuth, useUser } from '@/lib/authContext';
import SubscriptionPopup from '../SubscriptionPopup';
import TokenBadge from '../TokenBadge';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import { FREE_TOKEN_LIMIT } from '@/lib/tokenLimit';

import Sidebar from '../Sidebar';
import SettingsModal from '../settings/SettingsModal';
import TemplateBrowser from '../TemplateBrowser';
import { Template } from '@/lib/templates';
import VoiceCall from '../VoiceCall';
import { ResearchWelcome } from '../ResearchWelcome';
import { RedesignWelcome } from '../RedesignWelcome';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Home: React.FC = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { hasExceeded, tokensUsed, isSubscribed, refreshLimit } = useTokenLimit();
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'redesign'>('chat');

  // Sidebar Persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', String(newState));
      return newState;
    });
  };

  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate('/chat/new');
  };

  const handleSelectSession = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }, 100);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const savedPrompt = localStorage.getItem('nevra_pending_prompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  useEffect(() => {
    const savedPrompt = localStorage.getItem('nevra_pending_prompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<AIProvider>('groq');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedDoc, setAttachedDoc] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 3;
  const MAX_SIZE_MB = 2;
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const imageMenuRef = useRef<HTMLDivElement>(null);

  // Camera Refs
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraModalRef = useRef<HTMLElement | null>(null);
  const cameraEventListenersRef = useRef<Array<{ element: HTMLElement; event: string; handler: EventListener }>>([]);

  const suggestedPrompts = [
    "Build a CRM dashboard with dark mode",
    "Create a landing page for a coffee shop",
    "Make a personal portfolio with 3D effects",
    "Design an e-commerce product card"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (attachedImages.length >= MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images per request.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const files = Array.from(e.target.files);

    let accepted = 0;
    files.forEach(file => {
      if (attachedImages.length + accepted >= MAX_IMAGES) return;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File ${file.name} is too large (> ${MAX_SIZE_MB}MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
      accepted += 1;
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowImageMenu(false);
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Removed local detectMode stub to use imported one

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Validate file type
    const validTypes = ['.pdf', '.docx', '.txt', '.md'];
    const isExtensionValid = validTypes.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isExtensionValid) {
      alert('Supported file types: PDF, DOCX, TXT, MD');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be under 10MB');
      return;
    }

    setAttachedDoc(file);
    // Clear prompt if it was empty to prompt for summary
    if (!prompt) {
      setPrompt(`Summarize this document: ${file.name}`);
    }
  };

  const removeDoc = () => {
    setAttachedDoc(null);
    if (docInputRef.current) docInputRef.current.value = '';
    if (prompt.startsWith('Summarize this document:')) {
      setPrompt('');
    }
  };

  const handleSearch = async () => {
    if ((!prompt.trim() || isUploading) && attachedImages.length === 0 && !attachedDoc) return;

    if (!isSignedIn) {
      localStorage.setItem('nevra_pending_prompt', prompt);
      navigate('/sign-in');
      return;
    }

    // Handle Document Upload & Parsing
    let finalPrompt = prompt;
    let finalImages = [...attachedImages];

    if (attachedDoc) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', attachedDoc);

        // Adjust API URL based on environment
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8788';

        const response = await fetch(`${apiUrl}/api/parse-document`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to parse document');
        }

        const data = await response.json();

        // Append document content to prompt
        finalPrompt = `Document: ${data.title}\n\nContent:\n${data.content.substring(0, 20000)}...\n\nTask: ${prompt || 'Summarize this document.'}`;

      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to process document. Please try again.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else {
      // Check for YouTube URL in prompt
      const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]{11})/;
      const match = prompt.match(youtubeRegex);
      if (match) {
        setIsUploading(true);
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8788';
          const response = await fetch(`${apiUrl}/api/transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: match[0] })
          });

          if (!response.ok) throw new Error('Failed to fetch transcript');
          const data = await response.json();

          finalPrompt = `Video Transcript:\n${data.transcript.substring(0, 20000)}...\n\nTask: ${prompt}`;
        } catch (error) {
          console.error('YouTube transcript failed', error);
          // Fallback to just passing the URL if transcript fails
          if (prompt.trim() === match[0]) {
            finalPrompt = `Summarize this video: ${match[0]}`;
          }
        }
        setIsUploading(false);
      }
    }

    localStorage.removeItem('nevra_pending_prompt');
    const detectedMode = detectMode(finalPrompt);

    // Silent Canvas Activation: if prompt is just "orak orek" or similar, don't auto-send
    const canvasTriggers = ['orak orek', 'orak-orek', 'rak orek', 'rak-orek', 'canvas', 'whiteboard', 'papan tulis', 'gambar', 'sketch', 'draw', 'drawing', 'lukis', 'board', 'coret'];
    const lowerPrompt = finalPrompt.toLowerCase().trim();
    const isSilentCanvas = detectedMode === 'canvas' && canvasTriggers.some(t => lowerPrompt === t || lowerPrompt.includes(t));

    navigate('/chat', {
      state: {
        initialPrompt: isSilentCanvas ? '' : finalPrompt, // Clear prompt if silent activation
        initialProvider: provider,
        initialImages: finalImages,
        enableWebSearch: isWebSearchEnabled,
        mode: detectedMode, // Pass detected mode explicitly
        ...(detectedMode === 'builder' ? {
          mode: 'codebase', // Overwrite for builder to codebase link
          framework: 'react'
        } : {})
      }
    });
  };

  return (
    <div className="flex h-dvh bg-[#FDFDFD] selection:bg-purple-100 overflow-hidden font-sans text-zinc-900">

      {/* Mobile Sidebar Overlay */}
      {isSignedIn && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isSignedIn && (
        <>
          {/* Desktop Sidebar Panel */}
          <div
            className={cn(
              "hidden md:block border-r border-zinc-200 bg-zinc-50 transition-all duration-300 ease-in-out shrink-0",
              isSidebarCollapsed ? "w-[60px]" : "w-[260px]" // Fixed width matching ChatInterface
            )}
          >
            <Sidebar
              activeSessionId={undefined}
              onNewChat={handleNewChat}
              onSelectSession={handleSelectSession}
              onOpenSettings={handleOpenSettings}
              isSubscribed={isSubscribed || false}
              onCollapse={toggleSidebarCollapse}
              onClose={() => setIsSidebarCollapsed(false)}
              isCollapsed={isSidebarCollapsed}
            />
          </div>

          {/* Mobile Sidebar */}
          <div className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-[280px] h-full border-r border-zinc-200 bg-[#F9FAFB]
        `}>
            <Sidebar
              onNewChat={() => {
                setPrompt('');
                setAttachedImages([]);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              onSelectSession={(sessionId) => navigate(`/chat/${sessionId}`)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isSubscribed={isSubscribed || false}
              onClose={() => setIsSidebarOpen(false)}
            />


          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full h-full overflow-y-auto overflow-x-hidden">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100 bg-white/80 backdrop-blur-md z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-zinc-600">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-zinc-900">Nevra</span>
          <div className="w-8" /> {/* Spacer */}
        </div>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Main Interface */}
        <main className="flex-1 relative w-full flex flex-col min-h-0">
          {/* Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className={cn(
              "absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-colors duration-500",
              activeMode === 'redesign' ? "bg-pink-100/30" : "bg-purple-100/30"
            )} />
            <div className={cn(
              "absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 transition-colors duration-500",
              activeMode === 'redesign' ? "bg-violet-100/30" : "bg-blue-100/30"
            )} />
          </div>

          {/* Mode Tabs */}
          <div className="relative z-20 flex justify-center pt-4 md:pt-8">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100/80 backdrop-blur-sm border border-zinc-200/50 shadow-sm">
              <button
                onClick={() => setActiveMode('chat')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
                  activeMode === 'chat'
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                )}
              >
                <MessageSquare size={16} />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveMode('redesign')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
                  activeMode === 'redesign'
                    ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/25"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                )}
              >
                <Paintbrush size={16} />
                <span>Redesign</span>
              </button>
            </div>
          </div>

          {/* Conditional Content */}
          {activeMode === 'chat' ? (
            <ResearchWelcome
              onSearch={(query, attachments) => {
                localStorage.removeItem('nevra_pending_prompt');
                const detectedMode = detectMode(query);

                // Silent Canvas Activation: if prompt is just "orak orek" or similar, don't auto-send
                const canvasTriggers = ['orak orek', 'orak-orek', 'rak orek', 'rak-orek', 'canvas', 'whiteboard', 'papan tulis', 'gambar', 'sketch', 'draw', 'drawing', 'lukis', 'board', 'coret'];
                const lowerQuery = query.toLowerCase().trim();
                const isSilentCanvas = detectedMode === 'canvas' && canvasTriggers.some(t => lowerQuery === t || lowerQuery.includes(t));

                // Build attachment content string if any
                let attachmentContent = '';
                if (attachments && attachments.length > 0) {
                  attachmentContent = attachments.map(att => {
                    return `\n\n--- ${att.name} (${att.type}) ---\n${att.content}`;
                  }).join('\n');
                }

                // Combine query with attachment content for AI processing
                const fullPrompt = attachmentContent
                  ? `${query}\n\n[Attached Content]:${attachmentContent}`
                  : query;

                navigate('/chat', {
                  state: {
                    initialPrompt: isSilentCanvas ? '' : fullPrompt,
                    initialProvider: provider,
                    initialImages: attachedImages,
                    enableWebSearch: isWebSearchEnabled,
                    mode: detectedMode,
                    ...(detectedMode === 'builder' ? {
                      mode: 'codebase',
                      framework: 'react'
                    } : {})
                  }
                });
              }}
              initialQuery={prompt}
              isWebSearchEnabled={isWebSearchEnabled}
              onToggleWebSearch={(enabled) => setIsWebSearchEnabled(enabled)}
              hasApiKey={true}
              className="z-10"
              userName={user?.firstName || undefined}
            />
          ) : (
            <RedesignWelcome
              className="z-10"
              userName={user?.firstName || undefined}
            />
          )}
        </main>
      </div>

      {/* Subscription Popup */}
      <SubscriptionPopup
        isOpen={showSubscriptionPopup}
        onClose={() => setShowSubscriptionPopup(false)}
        tokensUsed={tokensUsed}
        tokensLimit={FREE_TOKEN_LIMIT}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isSubscribed={isSubscribed || false}
        tokensUsed={tokensUsed}
      />
    </div>
  );
};

export default Home;

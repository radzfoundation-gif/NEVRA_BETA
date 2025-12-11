import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../Navbar';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronDown, Paperclip, X, AlertTriangle, Image as ImageIcon, Camera, ImagePlus } from 'lucide-react';
import BentoGrid from '../BentoGrid';
import Integrations from '../Integrations';
import CTA from '../CTA';
import Footer from '../Footer';
import Background from '../ui/Background';
import ProviderSelector from '../ui/ProviderSelector';
import { AIProvider } from '@/lib/ai';
import { useAuth, useUser } from '@clerk/clerk-react';
import SubscriptionPopup from '../SubscriptionPopup';
import TokenBadge from '../TokenBadge';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import { FREE_TOKEN_LIMIT } from '@/lib/tokenLimit';
import { useGrokTokenLimit } from '@/hooks/useGrokTokenLimit';

import Sidebar from '../Sidebar';
import SettingsModal from '../settings/SettingsModal';
import TemplateBrowser from '../TemplateBrowser';
import { Template } from '@/lib/templates';

import { User, ChevronLeft, Menu } from 'lucide-react';

const Home: React.FC = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { hasExceeded, tokensUsed, tokensRemaining, isSubscribed, refreshLimit } = useTokenLimit();
  const { isGrokLocked } = useGrokTokenLimit();
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Added state for settings modal
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);

  // Add effect to trigger animations for BentoGrid
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    // Small timeout to ensure DOM is ready
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }, 100);

    return () => observer.disconnect();
  }, []);

  // Restore prompt from localStorage if available
  useEffect(() => {
    const savedPrompt = localStorage.getItem('nevra_pending_prompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
      // Optional: Clear it after restoring, or keep it until successfully sent
      // localStorage.removeItem('nevra_pending_prompt'); 
    }
  }, []);

  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<AIProvider>('grok');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const MAX_IMAGES = 3;
  const MAX_SIZE_MB = 2;
  const [freeFallback, setFreeFallback] = useState(false);

  // Typewriter Effect State
  const [placeholderText, setPlaceholderText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [showImageMenu, setShowImageMenu] = useState(false);
  const imageMenuRef = useRef<HTMLDivElement>(null);
  // Refs for camera cleanup
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraModalRef = useRef<HTMLElement | null>(null);
  const cameraEventListenersRef = useRef<Array<{ element: HTMLElement; event: string; handler: EventListener }>>([]);

  useEffect(() => {
    const toRotate = ["help you today?", "build your app?", "debug your code?", "teach you something new?"];
    const handleTyping = () => {
      const i = loopNum % toRotate.length;
      const fullText = toRotate[i];

      setPlaceholderText(isDeleting
        ? fullText.substring(0, placeholderText.length - 1)
        : fullText.substring(0, placeholderText.length + 1)
      );

      setTypingSpeed(isDeleting ? 30 : 150);

      if (!isDeleting && placeholderText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000); // Pause at end
      } else if (isDeleting && placeholderText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, loopNum, typingSpeed]);

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
          alert(`Maximum ${MAX_IMAGES} images per request.`);
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

  const handleSearch = () => {
    if (!prompt.trim() && attachedImages.length === 0) return;

    // Auto-switch to OpenAI if images are attached (only OpenAI supports vision)
    let effectiveProvider = provider;
    if (attachedImages.length > 0 && provider !== 'openai') {
      if (!isSubscribed) {
        alert('Image analysis requires GPT-4o (OpenAI). Please subscribe to use this feature, or remove the images to use other providers.');
        return;
      }
      effectiveProvider = 'openai';
      console.log('🖼️ Images detected, switching to OpenAI for vision analysis');
    }

    // Check if user is signed in
    if (!isSignedIn) {
      // Save prompt to localStorage before redirecting
      localStorage.setItem('nevra_pending_prompt', prompt);

      // Redirect to sign-in with current state
      navigate('/sign-in', {
        state: {
          from: '/',
          initialPrompt: prompt,
          initialProvider: effectiveProvider,
          initialImages: attachedImages
        }
      });
      return;
    }

    // Check token limit for non-subscribed users
    if (!isSubscribed && hasExceeded) {
      if (!freeFallback) {
        setShowSubscriptionPopup(true);
        return;
      }
      // Pakai fallback gratis: paksa ke Llama 3
      if (attachedImages.length === 0) {
        effectiveProvider = 'groq';
      }
    }

    // Clear saved prompt once successfully navigating to chat
    localStorage.removeItem('nevra_pending_prompt');

    navigate('/chat', {
      state: {
        initialPrompt: prompt || (attachedImages.length > 0 ? 'Analyze this image' : ''),
        initialProvider: effectiveProvider,
        initialImages: attachedImages
      }
    });
  };

  const handleTemplateSelect = (template: Template) => {
    setPrompt(template.prompt);
    // Auto navigate to chat with template prompt
    if (isSignedIn) {
      navigate('/chat', {
        state: {
          initialPrompt: template.prompt,
          initialProvider: provider,
          initialImages: [],
          templateId: template.id,
          templateName: template.name
        }
      });
    } else {
      // Save template to localStorage and redirect to sign-in
      localStorage.setItem('nevra_pending_prompt', template.prompt);
      localStorage.setItem('nevra_template_id', template.id);
      navigate('/sign-in', {
        state: {
          from: '/',
          initialPrompt: template.prompt,
          initialProvider: provider,
          initialImages: [],
          templateId: template.id,
          templateName: template.name
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-aura-black text-white selection:bg-purple-500/30 font-sans flex">
      <Background />
      <Navbar />

      <SubscriptionPopup
        isOpen={showSubscriptionPopup}
        onClose={() => setShowSubscriptionPopup(false)}
        tokensUsed={tokensUsed}
        tokensLimit={FREE_TOKEN_LIMIT}
        onSelectFree={() => {
          setFreeFallback(true);
          setProvider('groq');
          setShowSubscriptionPopup(false);
        }}
      />

      {/* Settings Modal - Rendered at root level to avoid sidebar transform issues */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Sidebar - Collapsible */}
      {isSignedIn && (
        <>
          {/* Mobile Overlay */}
          <div
            className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Container */}
          <div
            className={`
              fixed inset-y-0 left-0 z-50 bg-[#0a0a0a] border-r border-white/10 transition-all duration-300 ease-in-out flex flex-col h-full
              md:static md:h-screen md:shrink-0
              ${isSidebarOpen
                ? 'translate-x-0 w-[85vw] max-w-[320px] md:w-[280px]'
                : '-translate-x-full w-0 md:w-0 md:translate-x-0 overflow-hidden'
              }
            `}
          >
            <div className={`flex-1 overflow-hidden h-full flex flex-col ${!isSidebarOpen && 'invisible'}`}>
              <Sidebar
                onNewChat={() => {
                  setPrompt('');
                  setAttachedImages([]);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                onSelectSession={(sessionId) => {
                  console.log('Select session:', sessionId);
                  navigate(`/chat/${sessionId}`);
                }}
                onOpenSettings={() => {
                  setIsSettingsOpen(true);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
              />
            </div>

            {/* Collapse Button inside Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-1/2 -right-3 w-6 h-12 bg-[#0a0a0a] border border-l-0 border-white/10 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Toggle Button (User Icon) - Visible when sidebar is closed */}
          <div
            className={`fixed bottom-4 left-4 z-40 transition-all duration-300 ${isSidebarOpen ? 'opacity-0 pointer-events-none translate-x-[-20px]' : 'opacity-100 translate-x-0'}`}
          >
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="group flex items-center justify-center w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 text-white hover:bg-[#2a2a2a] hover:border-purple-500/50 transition-all shadow-lg overflow-hidden"
              title="Open Sidebar"
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="User" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
              ) : (
                <User size={20} className="text-gray-400 group-hover:text-white" />
              )}
            </button>
          </div>
        </>
      )}

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : ''}`}>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
            >
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-sm font-medium text-gray-300">New: AI-Powered Component Generation</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight"
            >
              Build{' '}
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-500"
                style={{ backgroundSize: '200% 200%' }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
              >
                Faster
              </motion.span>{' '}
              with
              <br />
              NEVRA
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Nevra accelerates full-stack development with intelligent AI.
            </motion.p>

            {/* Templates Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <button
                onClick={() => setShowTemplateBrowser(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 text-purple-400 hover:text-purple-300 rounded-full font-medium transition-all duration-300"
              >
                <Sparkles size={18} />
                Browse Templates
              </button>
            </motion.div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-12 animate-fade-in-up delay-300 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity duration-500"></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl">
                {/* Attached Images Preview */}
                {attachedImages.length > 0 && (
                  <div className="p-4 pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-purple-400" />
                      <span className="text-xs text-purple-400 font-medium">
                        {attachedImages.length} image{attachedImages.length > 1 ? 's' : ''} ready for AI analysis
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                      {attachedImages.map((img, idx) => (
                        <div key={idx} className="relative group/img shrink-0">
                          <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-purple-500/30 shadow-lg" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative w-full overflow-hidden rounded-t-2xl">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder={`How can Nevra ${placeholderText}`}
                    className="w-full bg-transparent text-white text-lg p-6 pl-12 pb-16 focus:outline-none resize-none placeholder-gray-600 font-sans min-h-[140px]"
                  />

                  {/* File Upload Buttons */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                    />
                    <div className="relative" ref={imageMenuRef}>
                      <button
                        type="button"
                        onClick={() => setShowImageMenu(!showImageMenu)}
                        className="text-gray-500 hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                        title="Attach images for AI analysis"
                      >
                        <ImageIcon size={20} />
                      </button>
                      {showImageMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-xl">
                          <button
                            onClick={handleCameraCapture}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-300 hover:bg-white/10 transition-colors whitespace-nowrap"
                          >
                            <Camera size={16} className="text-purple-400 shrink-0" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            onClick={() => {
                              fileInputRef.current?.click();
                              setShowImageMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-300 hover:bg-white/10 transition-colors border-t border-white/5 whitespace-nowrap"
                          >
                            <ImagePlus size={16} className="text-blue-400 shrink-0" />
                            <span>Choose from Gallery</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-500 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                      title="Attach files"
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 flex items-center gap-3 z-20">
                  {/* Token Badge - Show for signed in users */}
                  {isSignedIn && (
                    <TokenBadge
                      tokensUsed={tokensUsed}
                      tokensLimit={FREE_TOKEN_LIMIT}
                      isSubscribed={isSubscribed}
                      compact={true}
                    />
                  )}

                  {/* Provider Selector */}
                  <ProviderSelector
                    value={provider}
                    onChange={(p) => {
                      // Prevent selecting Grok if locked
                      if (p === 'grok' && isGrokLocked && !isSubscribed) {
                        alert('Kimi K2 token limit has been reached. Please recharge tokens to use Kimi K2, or select another provider.');
                        return;
                      }
                      setProvider(p);
                    }}
                    isSubscribed={isSubscribed}
                  />

                  <button
                    type="submit"
                    onClick={handleSearch}
                    disabled={!prompt.trim() && attachedImages.length === 0}
                    className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-2 transition-colors cursor-pointer"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>

              {/* Suggested Prompts */}
              <div className="mt-6 flex flex-wrap justify-center gap-3 relative z-30">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 px-4 py-2 rounded-full transition-all text-gray-400 hover:text-white"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isSignedIn && !isSubscribed && hasExceeded && (
            <div className="mt-4 max-w-2xl mx-auto text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in-up delay-350">
              <AlertTriangle size={16} className="text-amber-400" />
              Free quota reached. Upgrade to continue generating with Nevra.
            </div>
          )}
        </section>

        <BentoGrid />
        <Integrations />
        <CTA />
        <Footer />
      </div>

      {/* Template Browser Modal */}
      <TemplateBrowser
        isOpen={showTemplateBrowser}
        onClose={() => setShowTemplateBrowser(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

export default Home;

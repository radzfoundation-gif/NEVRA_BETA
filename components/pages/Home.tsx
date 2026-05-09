import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronDown, Paperclip, X, AlertTriangle, Image as ImageIcon, Camera, ImagePlus, Layout, Phone, ChevronLeft, LayoutGrid, User, Bot, CheckCircle2, Youtube, FileText, Loader2, File, Paintbrush, MessageSquare } from 'lucide-react';
import { detectMode } from '@/lib/modeDetector';
import { useUser } from '@/lib/authContext';
import { useUI } from '../UIContext';

import Sidebar from '../Sidebar';
import { ResearchWelcome } from '../ResearchWelcome';
import { RedesignWelcome } from '../RedesignWelcome';

const Home: React.FC<{ defaultMode?: 'chat' | 'redesign' }> = ({ defaultMode = 'chat' }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { setSidebarOpen } = useUI();
  const [activeMode, setActiveMode] = useState<'chat' | 'redesign'>(defaultMode);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <div className="md:hidden flex items-center justify-between p-4 z-30 bg-transparent">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-foreground hover:bg-foreground/10 rounded-lg transition-colors">
            <LayoutGrid size={24} strokeWidth={1.5} />
          </button>
        </div>

        <main className="flex-1 relative w-full flex flex-col min-h-0">
          {activeMode === 'chat' ? (
            <ResearchWelcome
              onSearch={(query, attachments, model, reasoning, featureType) => {
                const detectedMode = detectMode(query);
                if (featureType) {
                  setActiveMode('redesign');
                  return;
                }
                navigate('/chat', {
                  state: {
                    initialPrompt: query,
                    mode: detectedMode,
                    autoSend: true,
                    model,
                    reasoning
                  }
                });
              }}
              userName={user?.firstName || undefined}
            />
          ) : (
            <RedesignWelcome
              onBack={() => setActiveMode('chat')}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;

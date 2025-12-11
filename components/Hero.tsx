import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Terminal as TerminalIcon, 
  Webhook, 
  Mail, 
  Database, 
  Clock, 
  MessageSquare, 
  FileText, 
  Edit3, 
  GitBranch, 
  Bell, 
  Plus, 
  MousePointer2 
} from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center pt-20 pb-20 overflow-hidden">
      
      {/* 1. Main Text Layer (Centered) */}
      <div className="relative z-20 text-center flex flex-col items-center max-w-[90vw]">
        
        {/* Top Badge */}
        <div className="mb-8 animate-float">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A]/80 border border-purple-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <div className="w-4 h-4 text-purple-400">
               <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="text-sm font-medium text-white tracking-wide">Self-Healing Workflows</span>
          </div>
        </div>

        {/* Huge Typography with Shimmer Animation */}
        <div className="relative">
          <h1 className="font-display font-bold text-[15vw] md:text-[11rem] leading-[0.85] tracking-tighter select-none pointer-events-none drop-shadow-2xl mix-blend-overlay opacity-90
            bg-gradient-to-r from-neutral-500 via-white to-neutral-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
            NEVRA
          </h1>
          <h1 className="font-display font-bold text-[12vw] md:text-[9rem] leading-[0.85] tracking-tighter select-none pointer-events-none drop-shadow-2xl mix-blend-overlay opacity-90
            bg-gradient-to-r from-neutral-500 via-white to-neutral-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer" style={{ animationDelay: '0.2s' }}>
            BUILDER
          </h1>
        </div>

        {/* Subtext */}
        <p className="mt-8 text-lg md:text-xl text-aura-secondary max-w-2xl mx-auto text-center leading-relaxed">
          Orchestrate autonomous agents that plan, execute, and optimize business processes in real-time. 
          Replace manual toil with <span className="text-white font-medium">liquid logic</span>.
        </p>

        {/* CTA Button */}
        <div className="mt-10">
          <Link to="/chat" className="group relative px-8 py-4 bg-gradient-to-b from-[#2a2a2a] to-[#0a0a0a] rounded-full border border-white/10 shadow-[0_0_40px_-10px_rgba(100,100,255,0.2)] hover:shadow-[0_0_60px_-10px_rgba(100,100,255,0.4)] transition-all overflow-hidden inline-flex items-center gap-3">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <Zap className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-white font-semibold tracking-wide">Start Automating</span>
          </Link>
        </div>

      </div>


      {/* 2. Floating Interface Cards Layer (Absolute Positioning) */}
      
      {/* CARD 1: Trigger Source (Top Left) */}
      <div className="hidden lg:block absolute top-[15%] left-[5%] xl:left-[10%] w-72 bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-2xl animate-float">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-medium text-neutral-400">Trigger Source</span>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        </div>
        <div className="space-y-2">
          <div className="p-3 bg-[#151515] rounded-lg border border-purple-500/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Webhook className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Webhook Event</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">POST</span>
          </div>
          <div className="p-3 hover:bg-[#151515] rounded-lg border border-transparent transition-colors flex items-center gap-3 opacity-50">
            <Mail className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-300">New Email</span>
          </div>
          <div className="p-3 hover:bg-[#151515] rounded-lg border border-transparent transition-colors flex items-center gap-3 opacity-50">
            <Database className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-300">Row Created</span>
          </div>
          <div className="p-3 hover:bg-[#151515] rounded-lg border border-transparent transition-colors flex items-center gap-3 opacity-50">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-300">Scheduled</span>
          </div>
        </div>
      </div>

      {/* CARD 2: Right Stack (Action Cards) */}
      <div className="hidden lg:flex flex-col gap-3 absolute top-[15%] right-[5%] xl:right-[10%] w-64 animate-float-delayed">
        
        {/* Item 1 */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-4">
           <div className="w-10 h-10 rounded-lg bg-[#151515] flex items-center justify-center border border-white/5">
              <MessageSquare className="w-5 h-5 text-neutral-300" />
           </div>
           <div>
              <div className="text-sm font-semibold text-white">Analyze Sentiment</div>
              <div className="text-[10px] text-neutral-500">LLM-v4-Turbo</div>
           </div>
        </div>

        {/* Item 2 */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-4">
           <div className="w-10 h-10 rounded-lg bg-[#151515] flex items-center justify-center border border-white/5">
              <FileText className="w-5 h-5 text-neutral-300" />
           </div>
           <div>
              <div className="text-sm font-semibold text-white">Extract Data</div>
              <div className="text-[10px] text-neutral-500">Vision Model</div>
           </div>
        </div>

        {/* Item 3 */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-4">
           <div className="w-10 h-10 rounded-lg bg-[#151515] flex items-center justify-center border border-white/5">
              <Edit3 className="w-5 h-5 text-neutral-300" />
           </div>
           <div>
              <div className="text-sm font-semibold text-white">Draft Reply</div>
              <div className="text-[10px] text-neutral-500">Context Aware</div>
           </div>
        </div>
      </div>

      {/* CARD 3: Bottom Left (Flow Logic) */}
      <div className="hidden lg:block absolute bottom-[10%] left-[8%] w-80 bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 shadow-2xl animate-float-delayed">
        <div className="flex flex-col gap-0 relative">
          
          {/* Connector Line */}
          <div className="absolute left-5 top-8 bottom-8 w-[2px] bg-white/10"></div>

          {/* Step 1 */}
          <div className="relative z-10 bg-[#151515] border border-white/10 rounded-lg p-3 mb-4">
             <div className="flex items-center gap-3">
               <GitBranch className="w-4 h-4 text-neutral-400" />
               <span className="text-sm font-medium text-white">Conditional Route</span>
             </div>
          </div>

          {/* Sub Step (Active) */}
          <div className="ml-8 relative z-10">
             <div className="text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-wider pl-1">IF High Priority</div>
             <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3 relative overflow-hidden group">
               <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <Bell className="w-4 h-4 text-blue-400" />
               <span className="text-sm font-medium text-blue-100">Slack Alert</span>
             </div>
          </div>

          {/* Add Step */}
          <div className="ml-8 mt-4 relative z-10">
             <div className="border border-dashed border-white/20 rounded-lg p-2 flex items-center gap-2 text-neutral-500 cursor-pointer hover:border-white/40 hover:text-neutral-300 transition-all">
                <Plus className="w-4 h-4" />
                <span className="text-xs">Add step</span>
             </div>
          </div>

          {/* Fake Cursor */}
          <div className="absolute bottom-[25%] right-[-10px] translate-y-1/2 z-20">
             <MousePointer2 className="w-5 h-5 text-purple-500 fill-purple-500/20" />
             <div className="absolute left-4 top-4 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Auto-GPT</div>
          </div>

        </div>
      </div>

      {/* CARD 4: Bottom Right (Terminal) */}
      <div className="hidden lg:block absolute bottom-[10%] right-[8%] w-[400px] bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-float">
        {/* Terminal Header */}
        <div className="bg-[#151515] px-4 py-2 border-b border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <TerminalIcon className="w-3 h-3 text-neutral-500" />
              <span className="text-xs font-mono text-neutral-400">Live Execution</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-mono text-green-500 uppercase">Running</span>
           </div>
        </div>
        
        {/* Terminal Content */}
        <div className="p-4 font-mono text-xs space-y-2 h-[180px] overflow-hidden text-neutral-300 bg-[#050505]">
           <div className="flex gap-2">
              <span className="text-neutral-600">10:42:01</span>
              <span className="text-blue-400">info</span>
              <span>Trigger received: webhook_01</span>
           </div>
           <div className="flex gap-2">
              <span className="text-neutral-600">10:42:02</span>
              <span className="text-purple-400">processing</span>
              <span>Analyzing payload...</span>
           </div>
           <div className="flex gap-2">
              <span className="text-neutral-600">10:42:03</span>
              <span className="text-yellow-400">decision</span>
              <span>Priority &gt; 0.8: <span className="text-white font-bold">True</span></span>
           </div>
           <div className="flex gap-2">
              <span className="text-neutral-600">10:42:04</span>
              <span className="text-green-400">success</span>
              <span>Action executed: Slack Alert</span>
           </div>
           <div className="flex gap-2 opacity-50">
              <span className="text-neutral-600">10:42:04</span>
              <span className="text-neutral-400">waiting</span>
              <span>Awaiting next event...</span>
           </div>
        </div>
        
        {/* Footer Stats */}
        <div className="bg-[#151515] px-4 py-2 border-t border-white/5 flex justify-between items-center font-mono text-[10px] text-neutral-500">
           <div>Latency: <span className="text-neutral-300">240ms</span></div>
           <div>Cost: <span className="text-neutral-300">$0.002</span></div>
        </div>
      </div>
      
      {/* Mobile-only view simplified */}
      <div className="block lg:hidden mt-12 px-6">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 shadow-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-mono text-neutral-400">System Active</span>
           </div>
           <div className="space-y-3 font-mono text-xs text-neutral-300">
              <div className="flex justify-between">
                 <span>Workflows Running</span>
                 <span className="text-white">12</span>
              </div>
              <div className="flex justify-between">
                 <span>Events Processed</span>
                 <span className="text-white">8,402</span>
              </div>
              <div className="flex justify-between">
                 <span>Avg Latency</span>
                 <span className="text-white">45ms</span>
              </div>
           </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
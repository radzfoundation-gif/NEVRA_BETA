import React, { useRef } from 'react';
import SpotlightCard from './ui/SpotlightCard';
import { Bot, Zap, Shield, Cpu, Globe, Activity } from 'lucide-react';
import LaserFlow from './ui/LaserFlow';

const BentoGrid: React.FC = () => {
  const revealImgRef = useRef<HTMLImageElement>(null);

  return (
    <section id="features" className="py-24 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        <div 
          className="mb-20 rounded-2xl overflow-hidden relative border border-white/10 reveal"
          style={{ 
            height: '400px', 
            position: 'relative', 
            backgroundColor: '#060010'
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const el = revealImgRef.current;
            if (el) {
              el.style.setProperty('--mx', `${x}px`);
              el.style.setProperty('--my', `${y}px`);
            }
          }}
          onMouseLeave={() => {
            const el = revealImgRef.current;
            if (el) {
              el.style.setProperty('--mx', '-9999px');
              el.style.setProperty('--my', '-9999px');
            }
          }}
        >
          <LaserFlow
            horizontalBeamOffset={0.1}
            verticalBeamOffset={0.0}
            color="#FF79C6"
          />
          
          {/* Grid Overlay */}
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none z-[4]" />

          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6,
            pointerEvents: 'none'
          }}>
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-6 text-white text-center">Built for hyper-scale.</h2>
            <p className="text-aura-secondary text-lg max-w-2xl leading-relaxed text-center px-4">
              Everything you need to build production-grade AI applications. 
              Reliable, secure, and incredibly fast.
            </p>
          </div>

          <img
            ref={revealImgRef}
            src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop"
            alt="Reveal effect"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              objectFit: 'cover',
              zIndex: 5,
              mixBlendMode: 'lighten',
              opacity: 0.3,
              pointerEvents: 'none',
              '--mx': '-9999px',
              '--my': '-9999px',
              WebkitMaskImage: 'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)',
              maskImage: 'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat'
            } as React.CSSProperties}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">
          
          {/* Card 1: Autonomous Agents */}
          <div className="md:col-span-2 md:row-span-2 reveal">
            <SpotlightCard className="h-full p-8 flex flex-col justify-between group">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                  <Bot className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Autonomous Agents</h3>
                <p className="text-aura-secondary leading-relaxed max-w-sm">
                  Deploy autonomous agents that can browse the web, execute code, and manage complex workflows without human intervention.
                </p>
              </div>
              
              {/* Animation inside card */}
              <div className="mt-8 rounded-lg border border-white/5 bg-[#1A1A1A] overflow-hidden h-48 relative w-full">
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
                 
                 {/* Moving nodes */}
                 <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-blue-500 rounded-full blur-[2px] animate-ping"></div>
                 <div className="absolute top-1/3 left-2/3 w-2 h-2 bg-purple-500 rounded-full blur-[2px] animate-pulse"></div>
                 
                 {/* Grid lines */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                 
                 {/* Scanning line */}
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[beam_3s_infinite]"></div>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 2: Latency */}
          <div className="md:col-span-1 md:row-span-1 reveal delay-100">
            <SpotlightCard className="h-full p-6 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                  <h3 className="text-lg font-bold mb-1 text-white">Real-time Latency</h3>
                  <p className="text-sm text-aura-secondary">Sub-50ms inference across global edge networks.</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 3: Security */}
          <div className="md:col-span-1 md:row-span-1 reveal delay-200">
            <SpotlightCard className="h-full p-6 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                  <h3 className="text-lg font-bold mb-1 text-white">Enterprise Security</h3>
                  <p className="text-sm text-aura-secondary">SOC2 Type II certified with end-to-end encryption.</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 4: Neural Engine */}
          <div className="md:col-span-1 md:row-span-2 reveal delay-100">
            <SpotlightCard className="h-full p-6 flex flex-col relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
               <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 relative z-10">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white relative z-10">Neural Engine</h3>
              <p className="text-aura-secondary text-sm mb-6 relative z-10 leading-relaxed">
                Our proprietary inference engine optimizes token usage and cost automatically.
              </p>
              <div className="flex-grow rounded-lg bg-[#1A1A1A] border border-white/5 relative overflow-hidden flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-purple-500/30 flex items-center justify-center animate-[spin_8s_linear_infinite]">
                      <div className="w-16 h-16 rounded-full border border-purple-500/50 flex items-center justify-center border-t-transparent border-l-transparent">
                          <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,1)]"></div>
                      </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent"></div>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 5: Global Network */}
          <div className="md:col-span-2 md:row-span-1 reveal delay-200">
            <SpotlightCard className="h-full p-8 flex items-center justify-between gap-6 group">
               <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-white">Global Edge Network</h3>
                  <p className="text-aura-secondary text-sm">Deploy models closer to your users. 35+ regions supported instantly.</p>
               </div>
               <div className="hidden sm:block w-32 h-20 rounded-lg bg-black/50 border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-1 p-2">
                      {Array.from({ length: 24 }).map((_, i) => (
                          <div key={i} className={`rounded-[1px] transition-colors duration-500 ${Math.random() > 0.7 ? 'bg-blue-500/60' : 'bg-white/5 group-hover:bg-white/10'}`}></div>
                      ))}
                  </div>
               </div>
            </SpotlightCard>
          </div>

          {/* Card 6: Uptime */}
          <div className="md:col-span-1 md:row-span-1 reveal delay-300">
            <SpotlightCard className="h-full p-6 flex flex-col justify-center items-center text-center">
              <Activity className="w-8 h-8 text-neutral-500 mb-3 group-hover:text-white transition-colors" />
              <h3 className="text-lg font-bold text-white">99.99% Uptime</h3>
            </SpotlightCard>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BentoGrid;
import React from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import Background from '../ui/Background';
import { Bot, Brain, Zap, ArrowRight } from 'lucide-react';

const AgentsPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-aura-primary bg-[#020202] page-transition">
      <Background />
      <Navbar />
      <main className="flex-grow pt-24 relative z-10">
        <section className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-200">Autonomous Workforce</span>
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-white tracking-tight">
              Deploy Intelligent <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">AI Agents</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              Create agents that can browse the web, use APIs, and execute complex tasks autonomously. 
              No more rigid scripts—just goals and outcomes.
            </p>
          </div>
        </section>

        <section className="py-12 px-6 bg-[#0A0A0A]/50 border-y border-white/5">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "Cognitive Processing", desc: "Agents reason through problems using Chain-of-Thought prompting." },
              { icon: Zap, title: "Real-time Execution", desc: "Sub-50ms response times for critical decision making." },
              { icon: Bot, title: "Self-Correction", desc: "Agents validate their own outputs and retry upon failure." }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#111] border border-white/5 hover:border-blue-500/30 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AgentsPage;

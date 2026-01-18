import React from 'react';
import Footer from '../Footer';
import Background from '../ui/Background';
import { Bot, Brain, Zap, ArrowRight } from 'lucide-react';

const AgentsPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-zinc-900 bg-white page-transition">
      <Background />
      <main className="flex-grow pt-24 relative z-10">
        <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-blue-50 border border-blue-200 mb-6 md:mb-8">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-blue-600">Autonomous Workforce</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-7xl mb-4 md:mb-6 text-zinc-900 tracking-tight px-2">
              Deploy Intelligent <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI Agents</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed px-4">
              Create agents that can browse the web, use APIs, and execute complex tasks autonomously.
              No more rigid scripts—just goals and outcomes.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12 px-4 sm:px-6 bg-zinc-50 border-y border-zinc-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              { icon: Brain, title: "Cognitive Processing", desc: "Agents reason through problems using Chain-of-Thought prompting." },
              { icon: Zap, title: "Real-time Execution", desc: "Sub-50ms response times for critical decision making." },
              { icon: Bot, title: "Self-Correction", desc: "Agents validate their own outputs and retry upon failure." }
            ].map((feature, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200 hover:border-blue-300 transition-all group shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-zinc-500">{feature.desc}</p>
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

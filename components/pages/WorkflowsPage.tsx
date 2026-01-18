import React from 'react';
import Footer from '../Footer';
import Background from '../ui/Background';
import { GitBranch, Workflow, Clock, Code2 } from 'lucide-react';

const WorkflowsPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-zinc-900 bg-white page-transition">
      <Background />
      <main className="flex-grow pt-24 relative z-10">
        <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-purple-50 border border-purple-200 mb-6 md:mb-8">
              <Workflow className="w-4 h-4 text-purple-600" />
              <span className="text-xs sm:text-sm font-medium text-purple-600">Liquid Logic</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-7xl mb-4 md:mb-6 text-zinc-900 tracking-tight px-2">
              Orchestrate Complex <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Workflows</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed px-4">
              Visualise and build multi-step automation pipelines.
              Connect triggers, logic, and actions in a drag-and-drop canvas.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-4 sm:mb-6">Flow Engine v2</h2>
                  <ul className="space-y-3 sm:space-y-4">
                    {[
                      "Event-driven architecture",
                      "Conditional branching & loops",
                      "Human-in-the-loop approval steps",
                      "Persistent state management"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm sm:text-base text-zinc-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="h-48 sm:h-64 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center">
                  <span className="text-zinc-500 font-mono text-xs sm:text-sm px-4 text-center">[Interactive Flow Canvas Preview]</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default WorkflowsPage;

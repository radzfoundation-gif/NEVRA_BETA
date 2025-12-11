import React from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import Background from '../ui/Background';
import { GitBranch, Workflow, Clock, Code2 } from 'lucide-react';

const WorkflowsPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-aura-primary bg-[#020202] page-transition">
      <Background />
      <Navbar />
      <main className="flex-grow pt-24 relative z-10">
        <section className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <Workflow className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-200">Liquid Logic</span>
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-white tracking-tight">
              Orchestrate Complex <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Workflows</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              Visualise and build multi-step automation pipelines. 
              Connect triggers, logic, and actions in a drag-and-drop canvas.
            </p>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
             <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <div>
                      <h2 className="text-3xl font-bold text-white mb-6">Flow Engine v2</h2>
                      <ul className="space-y-4">
                        {[
                          "Event-driven architecture",
                          "Conditional branching & loops",
                          "Human-in-the-loop approval steps",
                          "Persistent state management"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            {item}
                          </li>
                        ))}
                      </ul>
                   </div>
                   <div className="h-64 bg-[#111] rounded-xl border border-white/10 flex items-center justify-center">
                      <span className="text-gray-600 font-mono text-sm">[Interactive Flow Canvas Preview]</span>
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

import React from 'react';
import { Link } from 'react-router-dom';

const CTA: React.FC = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="rounded-3xl border border-aura-border bg-gradient-to-b from-aura-card to-black p-12 md:p-20 text-center relative overflow-hidden">
          {/* Glow effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-500/10 blur-[100px]"></div>
          
          <h2 className="relative z-10 font-display font-bold text-4xl md:text-6xl mb-6 text-white tracking-tight">
            Ready to build the future?
          </h2>
          <p className="relative z-10 text-aura-secondary text-lg mb-10 max-w-xl mx-auto">
            Join thousands of developers building the next generation of AI applications with Aura.
          </p>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link to="/chat" className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:scale-105 transition-transform inline-block">
                Get Started Now
             </Link>
             <button className="px-8 py-3 text-aura-secondary hover:text-white font-medium transition-colors">
                Read Documentation
             </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
import React from 'react';

const LOGOS = [
  "Notion", "Linear", "GitHub", "Slack", "Discord", "Figma", "Docker", "Vercel", "AWS", "Google Cloud"
];

const Integrations: React.FC = () => {
  return (
    <section className="py-20 border-t border-b border-white/5 bg-aura-black relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-aura-black to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-aura-black to-transparent z-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-sm font-medium text-aura-secondary uppercase tracking-widest">Trusted by engineering teams at</p>
      </div>

      <div className="flex overflow-hidden group">
        <div className="flex animate-scroll gap-16 pr-16 min-w-full">
            {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, idx) => (
                <div key={`${logo}-${idx}`} className="flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-white/20 hover:text-white transition-colors cursor-default whitespace-nowrap">
                        {logo}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
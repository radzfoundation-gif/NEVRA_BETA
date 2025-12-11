import React from 'react';
import { Command } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-6 border-t border-aura-border bg-aura-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="flex items-center gap-2">
           <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-tr from-purple-500 to-blue-500">
            <Command className="w-3 h-3 text-white" />
          </div>
          <span className="font-display font-bold text-white tracking-tight">NEVRA</span>
        </div>

        <div className="flex gap-8 text-sm text-aura-secondary">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
        </div>

        <div className="text-sm text-neutral-600">
          © 2024 Nevra Systems. All rights reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;
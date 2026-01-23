import React from 'react';
import { Command } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-6 border-t border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-950">
            <Command className="w-3 h-3 text-white" />
          </div>
          <span className="font-display font-bold text-zinc-900 tracking-tight">NOIR AI</span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-zinc-500">
          <a href="#" className="hover:text-zinc-900 transition-colors min-h-[44px] md:min-h-0 flex items-center">Privacy</a>
          <a href="#" className="hover:text-zinc-900 transition-colors min-h-[44px] md:min-h-0 flex items-center">Terms</a>
          <a href="#" className="hover:text-zinc-900 transition-colors min-h-[44px] md:min-h-0 flex items-center">Twitter</a>
          <a href="#" className="hover:text-zinc-900 transition-colors min-h-[44px] md:min-h-0 flex items-center">GitHub</a>
        </div>

        <div className="text-sm text-zinc-400">
          © 2024 Noir Systems. All rights reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;
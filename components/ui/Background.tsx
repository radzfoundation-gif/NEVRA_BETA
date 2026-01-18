import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 min-h-screen w-full bg-white dark:bg-zinc-950 z-[-1] overflow-hidden pointer-events-none transition-colors duration-300">
      {/* Woven Fabric Pattern Background */}
      <div
        className="absolute inset-0 z-0 opacity-100 dark:opacity-[0.03] dark:bg-zinc-950 transition-colors duration-300"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, var(--pattern-color, rgba(75, 85, 99, 0.08)), var(--pattern-color, rgba(75, 85, 99, 0.08)) 2px, transparent 2px, transparent 6px),
            repeating-linear-gradient(90deg, var(--pattern-color, rgba(107, 114, 128, 0.06)), var(--pattern-color, rgba(107, 114, 128, 0.06)) 2px, transparent 2px, transparent 6px),
            repeating-linear-gradient(0deg, var(--pattern-color, rgba(55, 65, 81, 0.04)), var(--pattern-color, rgba(55, 65, 81, 0.04)) 1px, transparent 1px, transparent 12px),
            repeating-linear-gradient(90deg, var(--pattern-color, rgba(55, 65, 81, 0.04)), var(--pattern-color, rgba(55, 65, 81, 0.04)) 1px, transparent 1px, transparent 12px)
          `,
        }}
      />
    </div>
  );
};

export default Background;
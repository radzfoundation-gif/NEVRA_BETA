import React, { Suspense } from 'react';
import Silk from './Silk';

const Background: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      overflow: 'hidden',
      backgroundColor: '#020202' // Deep dark background
    }}>
      {/* Silk Background - Lightweight and performant */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-[#020202]" />}>
          <Silk
            speed={5}
            scale={1.5}
            color="#4a1a6e"
            noiseIntensity={2.0}
            rotation={0}
          />
        </Suspense>
      </div>

      {/* iOS-style Mesh Gradients / Liquid Orbs */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-purple-900/20 rounded-full blur-[128px] animate-blob mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/15 rounded-full blur-[128px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-indigo-900/15 rounded-full blur-[128px] animate-blob animation-delay-4000 mix-blend-screen"></div>
        {/* Noise Texture for Glass Effect */}
        <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* Overlay to ensure text readability - reduced opacity */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(2, 2, 2, 0.05)', // Very light overlay - let Silk shine through
        pointerEvents: 'none',
        zIndex: 20
      }} />
    </div>
  );
};

export default Background;
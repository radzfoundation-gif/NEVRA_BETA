import React from 'react';
import { Link } from 'react-router-dom';

const Studio: React.FC = () => {
    return (
        <div className="font-body selection:bg-tertiary-fixed selection:text-white">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl flex justify-between items-center px-12 py-6 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                <div className="text-2xl font-serif tracking-[0.2em] uppercase text-white">
                    <Link to="/studio">NOIR VISION</Link>
                </div>
                <div className="hidden md:flex items-center gap-6 font-label text-[10px] tracking-[0.1em] uppercase">
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/redesign">Explore</Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/redesign">Image</Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/redesign">Video</Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/redesign">Audio</Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300 flex items-center gap-1" to="/chat">
                        Chat <span className="bg-[#c00502] text-white text-[8px] px-1 py-0.5 rounded-sm">NEW</span>
                    </Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/redesign">Edit</Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/redesign">Character</Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/redesign">Moodboard</Link>
                    <Link className="text-white relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-[#c00502]" to="/studio">Apps</Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/chat">Assist</Link>
                    <Link className="text-[#919191] hover:text-white transition-all duration-300" to="/gallery">Gallery</Link>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/pricing" className="flex flex-col items-center">
                        <button className="flex items-center gap-2 bg-surface-container-high px-3 py-2 text-white text-[10px] font-label uppercase hover:bg-surface-variant transition-all">
                            <span className="material-symbols-outlined text-sm">diamond</span>
                            Pricing
                        </button>
                        <span className="text-[8px] bg-tertiary-fixed text-white px-1.5 mt-1 font-label uppercase">30% OFF</span>
                    </Link>
                    <button className="bg-[#1b1b1b] p-2 flex items-center gap-2 text-[#919191] hover:text-white transition-colors">
                        <span className="material-symbols-outlined">folder</span>
                        <span className="font-label text-[10px] uppercase">Assets</span>
                    </button>
                    <Link to="/chat" className="material-symbols-outlined text-white cursor-pointer text-3xl">account_circle</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen w-full flex items-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img 
                        alt="Noir Cinema Eye" 
                        className="w-full h-full object-cover grayscale opacity-60 brightness-50" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS6AnFj2suOO8p9aOIeaXAcGu49Bi8VdcVkEfba1CXoOL2R8IrWb3wP10xqFvoP3PbEW3PBad54trSVhynVomzEwhA_Oy3kQm-ciDCLMd4f2sGHOGti8YQVJInTy8JGOII2XGJP22EkBRKK6NLaFrt7kU5wYtIlXvXgXXrHJO2a7kxwrPMbdOeuZ2VL0-YD83mYr_2B4jfYY_JTtxIf4lMZArjRUTCrjm-1cBQND0QbHLlIOKTKe4XfXFX6IMFU-f0pwwQVCMQ2RZh"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#131313]/50 to-[#131313]"></div>
                </div>
                <div className="relative z-10 px-12 w-full">
                    <div className="max-w-4xl">
                        <span className="font-label text-[12px] tracking-[0.5em] text-tertiary-fixed mb-8 block uppercase">Volume I: The Aperture</span>
                        <h1 className="font-headline text-6xl md:text-9xl font-extralight tracking-tight leading-none text-white drop-shadow-lg italic">
                            THE FUTURE OF CINEMA <br/>
                            <span className="not-italic font-bold tracking-tighter">IS RENDERED IN SHADOWS.</span>
                        </h1>
                        <div className="mt-12 flex items-center gap-8">
                            <Link to="/chat" className="bg-primary text-on-primary px-10 py-4 font-label text-[11px] tracking-widest uppercase hover:bg-primary-container transition-all">
                                Begin Transmission
                            </Link>
                            <Link to="/redesign" className="text-primary font-label text-[11px] tracking-widest uppercase relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary hover:after:w-full after:transition-all after:duration-500">
                                View Manifesto
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-12 right-12 hidden md:block">
                    <p className="font-label text-[10px] tracking-[0.4em] text-outline text-right uppercase">
                        Coordinates: 34.0522° N, 118.2437° W <br/>
                        Status: Active Render State
                    </p>
                </div>
            </section>

            {/* Showcase: SOUL CINEMA */}
            <section className="py-32 px-12 bg-surface">
                <div className="flex flex-col md:flex-row justify-between items-baseline mb-24 border-b border-outline-variant/30 pb-12">
                    <h2 className="font-headline text-5xl italic text-white">Soul Cinema</h2>
                    <p className="font-label text-[10px] tracking-widest text-outline uppercase max-w-xs text-right mt-4 md:mt-0">
                        Exploring the boundary between machine precision and human flawed emotion.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Feature Film 1 */}
                    <div className="md:col-span-8 group cursor-crosshair">
                        <div className="relative overflow-hidden aspect-video bg-surface-container-low">
                            <img 
                                alt="Cinematic Frame" 
                                className="w-full h-full object-cover grayscale transition-transform duration-1000 group-hover:scale-105" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp52josDBTE3pIyj9cTiuhhcYPignrcpLupCMp3TkLcGoPqXWd06AzdBoNE8GOoP7oxSP417y2akiq583BukORkXQuk84Wc9Yi4hUTjjHjM8x1wlR8DDbH_yYx60F0NR6jFMwwFk2P6kGGAdKPlTAqo3mIOu7guHRwgrQA0q8Alj-lCSUNgtC2nFJaq9ACg8kxdQSXuWtKaNkPCZhBzX81_p6n8WysIBAWvEutAsoYhgkvKpDhJ_gmdI19NW8A4FMVZGijAnwoA1g8"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                <Link to="/redesign" className="material-symbols-outlined text-white text-6xl hover:scale-110 transition-transform">play_arrow</Link>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-between items-start">
                            <div>
                                <h3 className="font-headline text-3xl text-white">The Last Frame</h3>
                                <p className="font-body text-outline mt-2 text-sm italic">Directed by Neural Architect v.4</p>
                            </div>
                            <span className="font-label text-[10px] text-tertiary-fixed border border-tertiary-fixed px-3 py-1 uppercase tracking-widest">
                                Premiering
                            </span>
                        </div>
                    </div>
                    {/* Meta Stats Column */}
                    <div className="md:col-span-4 flex flex-col justify-between">
                        <div className="space-y-12">
                            <div className="border-l border-tertiary-fixed pl-6">
                                <p className="font-label text-[10px] text-outline uppercase tracking-widest mb-2">Duration</p>
                                <p className="font-body text-2xl text-white">01:42:04</p>
                            </div>
                            <div className="border-l border-outline-variant pl-6">
                                <p className="font-label text-[10px] text-outline uppercase tracking-widest mb-2">Algorithm</p>
                                <p className="font-body text-2xl text-white">Obsidian-7</p>
                            </div>
                            <div className="border-l border-outline-variant pl-6">
                                <p className="font-label text-[10px] text-outline uppercase tracking-widest mb-2">Texture</p>
                                <p className="font-body text-2xl text-white">35mm Digital Grain</p>
                            </div>
                        </div>
                        <div className="pt-12">
                            <Link to="/gallery" className="w-full py-4 border border-outline text-outline font-label text-[11px] tracking-[0.3em] uppercase hover:text-white hover:border-white transition-colors text-center block">
                                Explore Full Gallery
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* THE LAB: Experimental Bento */}
            <section className="py-32 px-12 bg-surface-container-lowest">
                <div className="mb-24 text-center">
                    <h2 className="font-label text-[12px] tracking-[0.6em] text-outline uppercase mb-4">Laboratory Alpha</h2>
                    <h3 className="font-headline text-6xl text-white">The Architecture of Dreams</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[800px]">
                    {/* Tool 1 */}
                    <Link to="/redesign" className="md:col-span-2 md:row-span-2 bg-surface-container p-12 flex flex-col justify-between relative group overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200')] opacity-5 grayscale bg-cover mix-blend-overlay group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative">
                            <span className="material-symbols-outlined text-tertiary-fixed mb-6 block">blur_on</span>
                            <h4 className="font-headline text-4xl text-white mb-4">Neural Grading</h4>
                            <p className="text-outline text-sm font-body leading-relaxed max-w-xs">
                                Real-time cinematic color extraction from subconscious visual prompts.
                            </p>
                        </div>
                        <button className="relative w-fit text-white font-label text-[10px] tracking-widest uppercase py-2 border-b border-tertiary-fixed">
                            Launch Module
                        </button>
                    </Link>
                    {/* Tool 2 */}
                    <Link to="/chat" className="md:col-span-2 md:row-span-1 bg-surface-container-low p-8 flex flex-col justify-end hover:bg-surface-container transition-colors group">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-headline text-2xl text-white">Atmospheric Depth</h4>
                                <p className="text-outline text-[10px] font-label tracking-widest uppercase mt-2">Voxel Mist Engine</p>
                            </div>
                            <span className="material-symbols-outlined text-white transition-transform group-hover:translate-x-2">arrow_forward</span>
                        </div>
                    </Link>
                    {/* Tool 3 */}
                    <Link to="/redesign" className="md:col-span-1 md:row-span-1 bg-surface-container-high p-8 flex flex-col justify-between hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-outline block">camera</span>
                        <p className="font-label text-[10px] tracking-widest text-white uppercase">Anamorphic Flux</p>
                    </Link>
                    {/* Tool 4 */}
                    <Link to="/chat" className="md:col-span-1 md:row-span-1 bg-[#1b1b1b] p-8 flex flex-col justify-between border-t-2 border-tertiary-fixed hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-tertiary-fixed block" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
                        <p className="font-label text-[10px] tracking-widest text-white uppercase">Chaos Theory</p>
                    </Link>
                </div>
            </section>

            {/* Editorial Quote */}
            <section className="py-48 px-12 bg-surface flex flex-col items-center justify-center text-center">
                <div className="max-w-4xl">
                    <span className="font-label text-[10px] tracking-[0.8em] text-outline uppercase mb-12 block">The Philosophy</span>
                    <p className="font-headline text-4xl md:text-6xl text-on-surface leading-tight italic">
                        "We do not create images; we capture the echoes of light that have escaped the void."
                    </p>
                    <p className="font-label text-[12px] tracking-[0.4em] text-tertiary-fixed uppercase mt-12">— Noir Vision Manifesto</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0e0e0e] w-full py-16 px-12 flex flex-col md:flex-row justify-between items-end gap-8">
                <div className="w-full md:w-auto text-left">
                    <div className="text-lg font-serif tracking-tighter text-white opacity-50 mb-4">NOIR VISION</div>
                    <div className="font-mono text-[10px] tracking-widest uppercase text-[#919191]">
                        © 2024 NOIR VISION. THE SHADOW & THE LIGHT.
                    </div>
                </div>
                <div className="flex gap-12 font-mono text-[10px] tracking-widest uppercase text-[#474747]">
                    <Link to="/privacy" className="hover:text-[#c00502] transition-colors duration-700">Privacy</Link>
                    <Link to="/terms" className="hover:text-[#c00502] transition-colors duration-700">Terms</Link>
                    <Link to="/manifesto" className="hover:text-[#c00502] transition-colors duration-700">Manifesto</Link>
                    <Link to="/contact" className="hover:text-[#c00502] transition-colors duration-700">Contact</Link>
                </div>
                <div className="flex gap-6">
                    <span className="material-symbols-outlined text-[#474747] hover:text-white cursor-pointer">videocam</span>
                    <span className="material-symbols-outlined text-[#474747] hover:text-white cursor-pointer">podcasts</span>
                    <span className="material-symbols-outlined text-[#474747] hover:text-white cursor-pointer">stream</span>
                </div>
            </footer>
        </div>
    );
};

export default Studio;
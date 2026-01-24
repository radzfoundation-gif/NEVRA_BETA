import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Paintbrush, Layout, Code, ExternalLink } from 'lucide-react';

const DesignDashboard = () => (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
        <div className="max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                        <Paintbrush className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Noir Studio</h1>
                        <p className="text-zinc-400 text-sm">Design & Canvas Mode</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-mono">
                        design.noirai.dev
                    </div>
                    <a href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                        Back to Chat <ExternalLink size={14} />
                    </a>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Web Generator Card */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-purple-500/50 transition-colors group cursor-pointer">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                        <Layout size={24} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Web Generator</h3>
                    <p className="text-zinc-400 text-sm">Generate complete landing pages and web apps with AI.</p>
                </div>

                {/* Code Editor Card */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-blue-500/50 transition-colors group cursor-pointer">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                        <Code size={24} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Code Canvas</h3>
                    <p className="text-zinc-400 text-sm">Edit and preview React components in real-time.</p>
                </div>
            </div>
        </div>
    </div>
);

const DesignApp: React.FC = () => {
    return (
        <Routes>
            <Route path="*" element={<DesignDashboard />} />
        </Routes>
    );
};

export default DesignApp;

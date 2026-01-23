import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, FileCode, Sparkles, Download, Trash2, Eye, Loader2, LayoutGrid, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Sidebar from '../Sidebar';
import { useAuth, useUser } from '@/lib/authContext';

interface Artifact {
    id: string;
    type: 'image' | 'code' | 'document';
    title: string;
    preview?: string;
    createdAt: string;
}

const ArtifactsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    // Mock artifacts data - in real app, fetch from Supabase
    const [artifacts, setArtifacts] = React.useState<Artifact[]>([
        // Demo items - will be empty until user generates content
    ]);

    const getArtifactIcon = (type: Artifact['type']) => {
        switch (type) {
            case 'image':
                return <Image className="w-5 h-5 text-pink-500" />;
            case 'code':
                return <FileCode className="w-5 h-5 text-blue-500" />;
            case 'document':
                return <Sparkles className="w-5 h-5 text-purple-500" />;
            default:
                return <Sparkles className="w-5 h-5 text-zinc-500" />;
        }
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                activeSessionId=""
                onNewChat={() => navigate('/chat')}
                onSelectSession={(id) => navigate(`/chat/${id}`)}
                onOpenSettings={() => setShowSettings(true)}
                onClose={() => setSidebarCollapsed(false)}
                onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                isCollapsed={sidebarCollapsed}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="px-6 py-4 border-b border-zinc-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-zinc-900">Artifacts</h1>
                            <p className="text-sm text-zinc-500 mt-0.5">Your AI-generated content</p>
                        </div>
                        <button
                            onClick={() => navigate('/redesign')}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
                        >
                            <Sparkles size={16} />
                            Generate New
                        </button>
                    </div>
                </header>

                {/* Filter Tabs */}
                <div className="px-6 py-3 border-b border-zinc-100 flex gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-lg">
                        All
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors">
                        Images
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors">
                        Code
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors">
                        Documents
                    </button>
                </div>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                        </div>
                    ) : artifacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                                <LayoutGrid className="w-8 h-8 text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-900 mb-1">No artifacts yet</h3>
                            <p className="text-sm text-zinc-500 mb-4 max-w-sm">
                                Generate images, code, or designs using Nevra Labs to see them here
                            </p>
                            <button
                                onClick={() => navigate('/redesign')}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
                            >
                                <Sparkles size={16} />
                                Start Creating
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {/* Create New Card */}
                            <button
                                onClick={() => navigate('/redesign')}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-all group aspect-square"
                            >
                                <div className="w-12 h-12 rounded-xl bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center mb-3 transition-colors">
                                    <Plus className="w-6 h-6 text-zinc-500" />
                                </div>
                                <span className="text-sm font-medium text-zinc-600">Create New</span>
                            </button>

                            {/* Artifact Cards */}
                            {artifacts.map((artifact) => (
                                <div
                                    key={artifact.id}
                                    className="group relative bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer"
                                >
                                    {/* Preview Area */}
                                    <div className="aspect-square bg-zinc-50 flex items-center justify-center">
                                        {artifact.preview ? (
                                            <img
                                                src={artifact.preview}
                                                alt={artifact.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
                                                {getArtifactIcon(artifact.type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <h3 className="font-medium text-sm text-zinc-900 truncate">{artifact.title}</h3>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {new Date(artifact.createdAt).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </p>
                                    </div>

                                    {/* Hover Actions */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white shadow-sm">
                                            <Eye className="w-4 h-4 text-zinc-600" />
                                        </button>
                                        <button className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white shadow-sm">
                                            <Download className="w-4 h-4 text-zinc-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ArtifactsPage;

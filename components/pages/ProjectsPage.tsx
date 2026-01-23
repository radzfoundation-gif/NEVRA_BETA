import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, ChevronRight, Settings, Loader2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import Sidebar from '../Sidebar';
import { useAuth, useUser } from '@/lib/authContext';
import { useChatSessions } from '@/hooks/useSupabase';

const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { sessions, loading } = useChatSessions();
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);

    // Group sessions as "projects" - each unique conversation context
    const projects = React.useMemo(() => {
        // For now, we'll treat recent chat sessions as projects
        return sessions.slice(0, 10).map(session => ({
            id: session.id,
            title: session.title || 'Untitled Project',
            lastUpdated: session.updated_at || session.created_at,
            type: 'chat' as const,
        }));
    }, [sessions]);

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
                            <h1 className="text-xl font-semibold text-zinc-900">Projects</h1>
                            <p className="text-sm text-zinc-500 mt-0.5">Manage and organize your work</p>
                        </div>
                        <button
                            onClick={() => navigate('/chat')}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
                        >
                            <Plus size={16} />
                            New Project
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                                <FolderOpen className="w-8 h-8 text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-900 mb-1">No projects yet</h3>
                            <p className="text-sm text-zinc-500 mb-4">Start a new chat to create your first project</p>
                            <button
                                onClick={() => navigate('/chat')}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
                            >
                                <Plus size={16} />
                                Create Project
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Create New Card */}
                            <button
                                onClick={() => navigate('/chat')}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-all group min-h-[140px]"
                            >
                                <div className="w-12 h-12 rounded-xl bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center mb-3 transition-colors">
                                    <Plus className="w-6 h-6 text-zinc-500" />
                                </div>
                                <span className="text-sm font-medium text-zinc-600">New Project</span>
                            </button>

                            {/* Project Cards */}
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => navigate(`/chat/${project.id}`)}
                                    className="group p-5 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <FolderOpen className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                                    </div>
                                    <h3 className="font-medium text-zinc-900 truncate mb-1">{project.title}</h3>
                                    <p className="text-xs text-zinc-500">
                                        {new Date(project.lastUpdated).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProjectsPage;

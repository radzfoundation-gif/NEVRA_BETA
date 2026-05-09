import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, ChevronRight, Loader2 } from 'lucide-react';
import Sidebar from '../Sidebar';
import { useChatSessions } from '@/hooks/useSupabase';

const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const { sessions, loading } = useChatSessions();

    const projects = React.useMemo(() => {
        return sessions.slice(0, 10).map(session => ({
            id: session.id,
            title: session.title || 'Untitled Project',
            lastUpdated: session.updated_at || session.created_at,
        }));
    }, [sessions]);

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="px-6 py-4 border-b border-zinc-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-zinc-900">Projects</h1>
                            <p className="text-sm text-zinc-500 mt-0.5">Manage and organize your work</p>
                        </div>
                        <button onClick={() => navigate('/chat')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium">
                            <Plus size={16} /> New Project
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-zinc-400 animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <div key={project.id} onClick={() => navigate(`/chat/${project.id}`)} className="group p-5 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-purple-600" /></div>
                                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                                    </div>
                                    <h3 className="font-medium text-zinc-900 truncate mb-1">{project.title}</h3>
                                    <p className="text-xs text-zinc-500">{new Date(project.lastUpdated).toLocaleDateString()}</p>
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

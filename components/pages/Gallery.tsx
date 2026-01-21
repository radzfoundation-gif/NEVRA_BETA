import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import { useAuth, useUser } from '@/lib/authContext';
import { useChatSessions } from '@/hooks/useSupabase';
import { LayoutGrid, Image, Code, MessageSquare, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const Gallery: React.FC = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'logos' | 'designs'>('all');

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const { sessions, loading } = useChatSessions();

    const items = sessions
        .filter(s => s.mode === 'redesign' || s.mode === 'logo')
        .map(session => ({
            id: session.id,
            type: (session.mode === 'logo' ? 'logo' : 'design') as 'logo' | 'design',
            title: session.title || 'Untitled Design',
            date: new Date(session.updated_at || session.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            image: session.metadata?.thumbnail || null,
            preview: 'View Result'
        }));

    const filteredItems = activeTab === 'all'
        ? items
        : items.filter(i =>
            (activeTab === 'logos' && i.type === 'logo') ||
            (activeTab === 'designs' && i.type === 'design')
        );

    if (loading) {
        return (
            <div className="flex h-screen bg-white items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <div className="hidden md:block border-r border-zinc-200 h-full">
                <Sidebar
                    activeSessionId={undefined}
                    onNewChat={() => navigate('/')}
                    onSelectSession={(id) => navigate(`/chat/${id}`)}
                    onOpenSettings={() => { }}
                    onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isCollapsed={isSidebarCollapsed}
                />
            </div>

            {/* Mobile Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-[280px] bg-white transform transition-transform duration-300 ease-in-out md:hidden border-r border-zinc-200 shadow-xl",
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar
                    activeSessionId={undefined}
                    onNewChat={() => {
                        navigate('/');
                        setIsMobileSidebarOpen(false);
                    }}
                    onSelectSession={(id) => {
                        navigate(`/chat/${id}`);
                        setIsMobileSidebarOpen(false);
                    }}
                    onOpenSettings={() => { }}
                    onClose={() => setIsMobileSidebarOpen(false)}
                    isCollapsed={false}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-zinc-50">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200 sticky top-0 z-30">
                    <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg">
                        <LayoutGrid size={24} />
                    </button>
                    <span className="font-semibold text-zinc-900">My Gallery</span>
                    <div className="w-8" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">My Gallery</h1>
                                <p className="text-zinc-500">Manage your saved logos, designs, and chats.</p>
                            </div>
                            <button onClick={() => navigate('/redesign')} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors flex items-center gap-2">
                                <Plus size={16} /> New Project
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { id: 'all', label: 'All Items', icon: LayoutGrid },
                                { id: 'logos', label: 'Logos', icon: Image },
                                { id: 'designs', label: 'Web Designs', icon: Code },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap flex-shrink-0",
                                        activeTab === tab.id
                                            ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                                            : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                                    )}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => navigate(`/chat/${item.id}`)}
                                    className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="aspect-square bg-zinc-100 flex items-center justify-center relative overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <MessageSquare size={32} className="text-zinc-300" />
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="font-semibold text-zinc-900 truncate">{item.title}</h3>
                                        </div>
                                        <p className="text-xs text-zinc-500">{item.date} • {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Always show Create New */}
                            <div className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-zinc-300 hover:bg-zinc-50 transition-all cursor-pointer min-h-[200px]" onClick={() => navigate('/redesign')}>
                                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 text-zinc-400">
                                    <Plus size={24} />
                                </div>
                                <p className="text-sm font-medium text-zinc-900">Create New</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gallery;

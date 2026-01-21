import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import { useAuth, useUser } from '@/lib/authContext';
import { LayoutGrid, Image, Code, MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const Gallery: React.FC = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'logos' | 'designs' | 'chats'>('all');

    // Mock Data for UI Visualization
    const items = [
        { id: 1, type: 'logo', title: 'Tech Startup Logo', date: '2 hours ago', image: 'https://via.placeholder.com/150' },
        { id: 2, type: 'design', title: 'Dashboard UI', date: '1 day ago', image: 'https://via.placeholder.com/150' },
        { id: 3, type: 'chat', title: 'Marketing Strategy', date: '2 days ago', preview: 'Discussing Q3 plan...' },
    ];

    const filteredItems = activeTab === 'all' ? items : items.filter(i => i.type === activeTab || (activeTab === 'designs' && i.type === 'design') || (activeTab === 'logos' && i.type === 'logo'));

    return (
        <div className="flex h-screen bg-white">
            <Sidebar
                activeSessionId={undefined}
                onNewChat={() => navigate('/')}
                onSelectSession={(id) => navigate(`/chat/${id}`)}
                onOpenSettings={() => { }}
                onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isCollapsed={isSidebarCollapsed}
            />

            <div className="flex-1 overflow-y-auto bg-zinc-50 p-8">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">My Gallery</h1>
                            <p className="text-zinc-500">Manage your saved logos, designs, and chats.</p>
                        </div>
                        <button onClick={() => navigate('/')} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors flex items-center gap-2">
                            <Plus size={16} /> New Project
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {[
                            { id: 'all', label: 'All Items', icon: LayoutGrid },
                            { id: 'logos', label: 'Logos', icon: Image },
                            { id: 'designs', label: 'Web Designs', icon: Code },
                            { id: 'chats', label: 'Saved Chats', icon: MessageSquare },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap",
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredItems.map(item => (
                            <div key={item.id} className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer">
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

                        {/* Empty State Mockup */}
                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-zinc-300 hover:bg-zinc-50 transition-all cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 text-zinc-400">
                                <Plus size={24} />
                            </div>
                            <p className="text-sm font-medium text-zinc-900">Create New</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Gallery;

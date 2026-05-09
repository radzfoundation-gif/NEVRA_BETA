import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import { useUser } from '@/lib/authContext';
import { useChatSessions } from '@/hooks/useSupabase';
import { LayoutGrid, Image, Code, MessageSquare, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../UIContext';

const Gallery: React.FC = () => {
    const navigate = useNavigate();
    const { setSidebarOpen } = useUI();
    const { sessions, loading } = useChatSessions();
    const [activeTab, setActiveTab] = useState<'all' | 'logos' | 'designs'>('all');

    const items = sessions
        .filter(s => s.mode === 'redesign' || s.mode === 'logo')
        .map(session => ({
            id: session.id,
            type: (session.mode === 'logo' ? 'logo' : 'design') as 'logo' | 'design',
            title: session.title || 'Untitled Design',
            date: new Date(session.updated_at || session.created_at || Date.now()).toLocaleDateString(),
            image: session.metadata?.thumbnail || null,
        }));

    const filteredItems = activeTab === 'all' ? items : items.filter(i => (activeTab === 'logos' && i.type === 'logo') || (activeTab === 'designs' && i.type === 'design'));

    if (loading) return <div className="flex h-screen bg-white items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 overflow-y-auto p-4 md:p-8">
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200 sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"><LayoutGrid size={24} /></button>
                    <span className="font-semibold text-zinc-900">My Gallery</span>
                </div>
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">My Gallery</h1>
                            <p className="text-zinc-500">Manage your saved logos and designs.</p>
                        </div>
                        <button onClick={() => navigate('/redesign')} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors flex items-center gap-2"><Plus size={16} /> New Project</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
                        {filteredItems.map(item => (
                            <div key={item.id} onClick={() => navigate(`/chat/${item.id}`)} className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer">
                                <div className="aspect-square bg-zinc-100 flex items-center justify-center relative overflow-hidden">
                                    {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <MessageSquare size={32} className="text-zinc-300" />}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-zinc-900 truncate">{item.title}</h3>
                                    <p className="text-xs text-zinc-500">{item.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gallery;

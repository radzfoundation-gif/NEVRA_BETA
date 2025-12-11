import React, { useState } from 'react';
import {
    MessageSquare, Search, Settings, HelpCircle,
    CreditCard, User, LogOut, Plus, ChevronDown,
    MoreHorizontal, Trash2, LayoutGrid, X, ChevronLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useChatSessions } from '@/hooks/useSupabase';
import { formatDistanceToNow } from 'date-fns';
import SettingsModal from './settings/SettingsModal';

interface SidebarProps {
    activeSessionId?: string;
    onNewChat: () => void;
    onSelectSession: (sessionId: string) => void;
    onOpenSettings: () => void;
    onClose?: () => void;
    onCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSessionId, onNewChat, onSelectSession, onOpenSettings, onClose, onCollapse }) => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const { sessions, loading, error, deleteSession } = useChatSessions();
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group sessions by date
    const groupedSessions = filteredSessions.reduce((groups, session) => {
        const date = new Date(session.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key = 'Older';
        if (date.toDateString() === today.toDateString()) {
            key = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday';
        } else if (date > new Date(today.setDate(today.getDate() - 7))) {
            key = 'Previous 7 Days';
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(session);
        return groups;
    }, {} as Record<string, typeof sessions>);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/5 w-full md:w-[280px]">
            {/* Header */}
            <div className="p-4 relative">
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    {onCollapse && (
                        <button
                            onClick={onCollapse}
                            className="hidden md:flex p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-purple-400 transition-all duration-200 border border-white/10 hover:border-purple-500/30 shadow-lg hover:shadow-purple-500/10"
                            title="Collapse Sidebar"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 md:hidden border border-white/10"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] text-white px-4 py-2.5 rounded-lg transition-colors border border-white/5 text-sm font-medium"
                >
                    <Plus size={16} className="text-purple-400" />
                    Start new chat
                </button>
            </div>

            {/* Search */}
            <div className="px-4 mb-2">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border border-white/5 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500/30 placeholder-gray-600"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-800">
                {error && (
                    <div className="mx-3 mb-3 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="text-center py-8 text-xs text-gray-500">Loading chats...</div>
                ) : Object.entries(groupedSessions).map(([group, groupSessions]) => (
                    <div key={group} className="mb-6">
                        <h3 className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {group}
                        </h3>
                        <div className="space-y-0.5">
                            {groupSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeSessionId === session.id
                                        ? 'bg-[#1a1a1a] text-white'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                        }`}
                                    onClick={() => onSelectSession(session.id)}
                                >
                                    <MessageSquare size={14} className={activeSessionId === session.id ? 'text-purple-400' : 'opacity-50'} />
                                    <span className="text-xs truncate flex-1">{session.title}</span>

                                    {/* Delete Button (visible on hover) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(session.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {sessions.length === 0 && !loading && (
                    <div className="text-center py-12 px-4">
                        <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-3">
                            <LayoutGrid size={20} className="text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-500">No chats yet</p>
                        <p className="text-[10px] text-gray-600 mt-1">Start a new conversation to see it here</p>
                    </div>
                )}
            </div>

            {/* Bottom Menu */}
            <div className="p-2 border-t border-white/5 space-y-1">
                <Link to="/pricing" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    <CreditCard size={14} />
                    <span>My Subscription</span>
                </Link>

                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                    <Settings size={14} />
                    <span>Settings</span>
                </button>

                <a href="#" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    <HelpCircle size={14} />
                    <span>Help Center</span>
                </a>

                {/* User Profile */}
                <div className="mt-2 pt-2 border-t border-white/5">
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                        >
                            <img
                                src={user?.imageUrl}
                                alt={user?.fullName || 'User'}
                                className="w-8 h-8 rounded-full border border-white/10"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">
                                    {user?.fullName || 'User'}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate">
                                    {user?.primaryEmailAddress?.emailAddress}
                                </div>
                            </div>
                            <MoreHorizontal size={14} className="text-gray-500" />
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-xs text-red-400 hover:bg-white/5 transition-colors"
                                >
                                    <LogOut size={14} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

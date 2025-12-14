import React, { useState, useEffect, useMemo } from 'react';
import {
    MessageSquare, Search, Settings,
    CreditCard, LogOut, Plus,
    MoreHorizontal, Trash2, X,
    Pencil, Folder, FolderOpen,
    ChevronDown, ChevronRight,
    LayoutGrid, Library as LibraryIcon,
    Sparkles, User, Zap, History,
    Calendar, Box, RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useChatSessions } from '@/hooks/useFirebase';
import Logo from './Logo';
import { groupSessionsByDate, DateGroup } from '@/lib/utils/dateGrouping';

interface SidebarProps {
    activeSessionId?: string;
    onNewChat: () => void;
    onSelectSession: (sessionId: string) => void;
    onOpenSettings: () => void;
    onClose?: () => void;
    onCollapse?: () => void;
    isSubscribed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeSessionId,
    onNewChat,
    onSelectSession,
    onOpenSettings,
    onClose,
    onCollapse,
    isSubscribed = false
}) => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const { sessions, loading, error, deleteSession, refreshSessions } = useChatSessions();
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Collapsible sections state
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        'Older': false // Default expanded for visibility
    });

    // Auto-refresh sessions (REMOVED Polling to prevent flicker/race conditions)
    // Initial load is handled by the hook itself.
    // Manual refresh button added to UI.

    // Group and Filter sessions
    const groupedSessions = useMemo(() => {
        const filtered = sessions.filter(session =>
            session.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort by updated_at desc
        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime();
            const dateB = new Date(b.updated_at || b.created_at).getTime();
            return dateB - dateA;
        });

        return groupSessionsByDate(sorted);
    }, [sessions, searchTerm]);

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this chat?')) {
            await deleteSession(sessionId);
            setTimeout(() => refreshSessions(), 500);
        }
    };

    // User initials
    const getUserInitials = () => {
        if (user?.fullName) {
            const names = user.fullName.split(' ');
            return names.length >= 2
                ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
                : user.fullName.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] border-r border-[#1f1f1f] w-full">
            {/* 1. Header Section */}
            <div className="p-3 space-y-3">
                {/* Brand / Logo Area */}
                <div className="flex items-center justify-between px-2 pt-1 pb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                            <div className="relative w-7 h-7 bg-[#111] rounded-lg flex items-center justify-center border border-white/10">
                                <Logo size={18} />
                            </div>
                        </div>
                        <span className="text-sm font-bold tracking-wide text-gray-100 font-display">
                            NEVRA
                        </span>
                    </div>
                    {/* Manual Refresh Button */}
                    <button
                        onClick={() => refreshSessions()}
                        className={`p-1.5 rounded-md hover:bg-[#121212] text-gray-500 hover:text-white transition-all ${loading ? 'animate-spin text-purple-500' : ''}`}
                        title="Refresh History"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                {/* Primary Action - New Chat */}
                <button
                    onClick={onNewChat}
                    className="group relative w-full flex items-center justify-between px-3 py-2.5 bg-white text-black hover:bg-gray-100 rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    <div className="flex items-center gap-2.5">
                        <Plus size={16} className="text-black/70" />
                        <span className="text-sm font-semibold">New Chat</span>
                    </div>
                    <div className="bg-black/10 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles size={12} className="text-black/60" />
                    </div>
                </button>

                {/* Search */}
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#121212] border border-[#1f1f1f] group-focus-within:border-purple-500/50 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                </div>
            </div>

            {/* 2. Navigation Section (Optional Quick Links) */}
            <div className="px-3 pb-2 flex flex-col gap-0.5">
                {[
                    { icon: LayoutGrid, label: 'Workflows', path: '/workflows' },
                    { icon: Box, label: 'Agents', path: '/agents' }
                ].map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#121212] rounded-lg transition-colors group"
                    >
                        <item.icon size={15} className="group-hover:text-purple-400 transition-colors" />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#1f1f1f] to-transparent mx-4 my-1"></div>

            {/* 3. Scrollable History Section */}
            <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0 custom-scrollbar">
                {/* Error State */}
                {error && (
                    <div className="m-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                        {error}
                        <button onClick={() => refreshSessions()} className="ml-2 underline hover:text-red-300">Retry</button>
                    </div>
                )}

                {loading && sessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 opacity-50">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-gray-500">Syncing history...</span>
                    </div>
                )}

                {!loading && Object.entries(groupedSessions).map(([group, groupSessions]) => {
                    const sessionsList = groupSessions as typeof sessions;
                    if (sessionsList.length === 0) return null;

                    const isCollapsed = collapsedSections[group];

                    return (
                        <div key={group} className="mb-4">
                            <button
                                onClick={() => toggleSection(group)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors group mb-1"
                            >
                                <div className="flex items-center gap-2">
                                    <span>{group}</span>
                                    <span className="bg-[#1f1f1f] text-gray-400 py-0.5 px-1.5 rounded text-[9px]">{sessionsList.length}</span>
                                </div>
                                {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                            </button>

                            {!isCollapsed && (
                                <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {sessionsList.map((session) => (
                                        <div
                                            key={session.id}
                                            onClick={() => onSelectSession(session.id)}
                                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent ${activeSessionId === session.id
                                                ? 'bg-[#121212] text-white border-[#1f1f1f] shadow-sm'
                                                : 'text-gray-400 hover:bg-[#121212] hover:text-gray-200'
                                                }`}
                                        >
                                            <div className={`shrink-0 transition-colors ${activeSessionId === session.id ? 'text-purple-400' : 'text-gray-600 group-hover:text-gray-500'}`}>
                                                {session.mode === 'builder' ? <Zap size={14} /> : <MessageSquare size={14} />}
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                <span className="text-xs font-medium truncate leading-tight">
                                                    {session.title || 'Untitled Chat'}
                                                </span>
                                            </div>

                                            {/* Hover Actions */}
                                            <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center bg-[#121212] pl-2 shadow-[-10px_0_10px_#121212]">
                                                <button
                                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            {/* Active Indicator */}
                                            {activeSessionId === session.id && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-purple-500 rounded-r-full shadow-[0_0_8px_rgba(168,85,247,0.4)]"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {!loading && sessions.length === 0 && (
                    <div className="text-center py-12 px-6">
                        <div className="w-12 h-12 bg-[#121212] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#1f1f1f]">
                            <History size={20} className="text-gray-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-300 mb-1">No history yet</h3>
                        <p className="text-xs text-gray-500">Start your first conversation to see it here.</p>
                    </div>
                )}
            </div>

            {/* 4. Footer / User Profile */}
            <div className="p-3 bg-[#050505] border-t border-[#1f1f1f]">
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 ${showUserMenu
                            ? 'bg-[#121212] border-[#2f2f2f]'
                            : 'bg-transparent border-transparent hover:bg-[#121212] hover:border-[#1f1f1f]'
                            }`}
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt="User" className="w-full h-full rounded-lg object-cover" />
                                ) : getUserInitials()}
                            </div>
                            {isSubscribed && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-[#050505] flex items-center justify-center">
                                    <Zap size={6} className="text-black fill-current" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                            <div className="text-xs font-semibold text-gray-200 truncate">
                                {user?.fullName || 'Guest User'}
                            </div>
                            <div className="text-[10px] font-medium text-gray-500">
                                {isSubscribed ? 'Pro Plan' : 'Free Plan'}
                            </div>
                        </div>

                        <Settings size={14} className="text-gray-500" />
                    </button>

                    {/* Popover Menu */}
                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute bottom-full left-0 w-full mb-3 bg-[#121212] border border-[#2f2f2f] rounded-xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="p-1">
                                    <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-[#1f1f1f] rounded-lg transition-colors text-left">
                                        <Settings size={14} className="text-gray-500" />
                                        Settings
                                    </button>
                                    <Link to="/pricing" className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-[#1f1f1f] rounded-lg transition-colors text-left">
                                        <CreditCard size={14} className="text-gray-500" />
                                        Subscription
                                    </Link>
                                    <div className="h-px bg-[#1f1f1f] my-1"></div>
                                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                                        <LogOut size={14} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

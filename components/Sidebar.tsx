import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    MessageSquare, Search, Settings,
    CreditCard, LogOut, SquarePen,
    MoreHorizontal, Trash2, X,
    ChevronDown, ChevronRight,
    Sparkles, User, Zap, History,
    Calendar, Box, RefreshCw,
    Share2, Database, FolderOpen, Bot,
    Home, HelpCircle, Clock, Check, PanelLeft, LayoutGrid, Keyboard, FileText,
    Plus, Code, Folder
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@/lib/authContext';
import { useChatSessions, useSubscription } from '@/hooks/useSupabase';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useUI } from './UIContext';
import Logo from './Logo';
import { groupSessionsByDate, DateGroup } from '@/lib/utils/dateGrouping';
import SubscriptionPopup from './SubscriptionPopup';
import ShareModal from './ShareModal';

interface SidebarProps {
    activeSessionId?: string;
    onNewChat?: () => void;
    onSelectSession?: (sessionId: string) => void;
    onOpenSettings?: () => void;
    onOpenShortcuts?: () => void;
    onClose?: () => void;
    onCollapse?: () => void;
    isSubscribed?: boolean;
    isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeSessionId: propActiveSessionId,
    onNewChat: propOnNewChat,
    onSelectSession: propOnSelectSession,
    onOpenSettings: propOnOpenSettings,
    onOpenShortcuts: propOnOpenShortcuts,
    onClose,
    onCollapse: propOnCollapse,
    isSubscribed = false,
    isCollapsed: propIsCollapsed
}) => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { sessions, loading, error, deleteSession, refreshSessions } = useChatSessions();
    const { isPro, tier } = useSubscription();
    const { isInstallable, installApp } = usePWAInstall();
    const { setSettingsOpen, setShortcutBrowserOpen } = useUI();

    // Internal vs External collapse state
    const [isInternalCollapsed, setIsInternalCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });
    
    const actuallyCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : isInternalCollapsed;

    const handleToggleCollapse = () => {
        if (propOnCollapse) {
            propOnCollapse();
        } else {
            const newState = !isInternalCollapsed;
            setIsInternalCollapsed(newState);
            localStorage.setItem('sidebar_collapsed', String(newState));
        }
    };

    const actuallySubscribed = isPro || isSubscribed;
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [showPricing, setShowPricing] = useState(false);
    const [showShare, setShowShare] = useState(false);

    const handleOpenSettings = () => {
        if (propOnOpenSettings) propOnOpenSettings();
        else setSettingsOpen(true);
    };

    const handleOpenShortcuts = () => {
        if (propOnOpenShortcuts) propOnOpenShortcuts();
        else setShortcutBrowserOpen(true);
    };

    const handleNewChat = () => {
        if (propOnNewChat) propOnNewChat();
        else navigate('/');
    };

    const handleSelectSession = (id: string) => {
        if (propOnSelectSession) propOnSelectSession(id);
        else navigate(`/chat/${id}`);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        {
            type: 'plan' as const,
            icon: Sparkles,
            label: 'Noir Pro',
            description: 'Our smartest model & more',
            action: () => setShowPricing(true),
            isPro: true,
            showUpgrade: !actuallySubscribed
        },
        {
            type: 'plan' as const,
            icon: Zap,
            label: 'Noir Free',
            description: 'Great for everyday tasks',
            action: () => { },
            isActive: !isSubscribed
        },
        { type: 'divider' as const },
        { type: 'button' as const, icon: Home, label: 'Home', action: () => navigate('/'), active: location.pathname === '/' },
        { type: 'button' as const, icon: LayoutGrid, label: 'Gallery', action: () => navigate('/gallery'), active: location.pathname === '/gallery' },
        { type: 'button' as const, icon: FolderOpen, label: 'Projects', action: () => navigate('/projects'), active: location.pathname === '/projects' },
        { type: 'button' as const, icon: Code, label: 'Skills', action: () => navigate('/skills'), active: location.pathname === '/skills' },
        { type: 'divider' as const },
        { type: 'button' as const, icon: Share2, label: 'Share with Friend', action: () => setShowShare(true) },
        ...(isInstallable ? [{ type: 'button' as const, icon: Box, label: 'Install App', action: installApp }] : []),
        { type: 'button' as const, icon: CreditCard, label: 'Pricing', action: () => setShowPricing(true) },
        { type: 'button' as const, icon: Keyboard, label: 'Keyboard Shortcuts', action: handleOpenShortcuts },
        { type: 'button' as const, icon: Settings, label: 'Settings', action: handleOpenSettings },
        { type: 'button' as const, icon: LogOut, label: 'Sign Out', action: () => signOut() },
    ];

    const groupedSessions = useMemo(() => {
        const filtered = sessions.filter(session =>
            (session.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
        );
        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime();
            const dateB = new Date(b.updated_at || b.created_at).getTime();
            return dateB - dateA;
        });
        const grouped = groupSessionsByDate(sorted as any);
        return Object.entries(grouped).map(([label, sessions]) => ({
            label,
            sessions
        }));
    }, [sessions, searchTerm]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this chat?')) {
            await deleteSession(id);
            if (id === propActiveSessionId) {
                navigate('/');
            }
        }
    };

    const getUserInitials = () => {
        if (!user?.fullName) return 'U';
        return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (actuallyCollapsed) {
        return (
            <div className="w-16 h-full flex flex-col bg-[#FAFAFA] border-r border-zinc-200 transition-all duration-300">
                <div className="p-4 flex flex-col items-center gap-4">
                    <button onClick={handleToggleCollapse} className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors">
                        <PanelLeft size={20} strokeWidth={1.5} />
                    </button>
                    <button onClick={handleNewChat} className="p-2 bg-white shadow-sm border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-900 transition-all">
                        <Plus size={20} strokeWidth={1.5} />
                    </button>
                    <div className="w-8 h-px bg-zinc-200 my-2" />
                    <button onClick={() => navigate('/')} className={`p-2 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-white shadow-sm border border-zinc-200 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
                        <Home size={20} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => navigate('/gallery')} className={`p-2 rounded-lg transition-colors ${location.pathname === '/gallery' ? 'bg-white shadow-sm border border-zinc-200 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
                        <LayoutGrid size={20} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => navigate('/projects')} className={`p-2 rounded-lg transition-colors ${location.pathname === '/projects' ? 'bg-white shadow-sm border border-zinc-200 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
                        <FolderOpen size={20} strokeWidth={1.5} />
                    </button>
                </div>
                <div className="mt-auto p-4 flex flex-col items-center gap-4">
                    <button onClick={handleOpenSettings} className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600">
                        <Settings size={20} strokeWidth={1.5} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[10px] font-medium" onClick={() => setShowUserMenu(!showUserMenu)}>
                        {getUserInitials()}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[280px] h-full flex flex-col bg-[#FAFAFA] border-r border-zinc-200 relative animate-in slide-in-from-left duration-300">
            {/* 1. Header */}
            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <Logo size={24} />
                        <span className="font-semibold text-sm tracking-tight text-zinc-900">Noir AI</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleToggleCollapse}
                            className="p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all"
                            title="Collapse sidebar"
                        >
                            <PanelLeft size={16} strokeWidth={1.5} />
                        </button>
                        {onClose && (
                            <button onClick={onClose} className="md:hidden p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-400">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 w-full px-3 py-2 bg-white shadow-sm border border-zinc-200 hover:border-zinc-300 hover:shadow-md rounded-xl text-zinc-900 transition-all duration-200 group"
                >
                    <div className="p-1 rounded-md bg-zinc-900 text-white group-hover:scale-110 transition-transform">
                        <Plus size={14} />
                    </div>
                    <span className="text-sm font-medium">New Chat</span>
                </button>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all"
                    />
                </div>
            </div>

            {/* 2. Menu Items & History */}
            <div className="flex-1 overflow-y-auto px-2 space-y-6 scrollbar-thin">
                {/* Navigation Menu */}
                <div className="space-y-0.5">
                    {menuItems.filter(item => item.type === 'button').slice(0, 4).map((item, idx) => (
                        <button
                            key={idx}
                            onClick={item.action}
                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all ${
                                item.active 
                                ? 'bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900 font-medium' 
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'
                            }`}
                        >
                            <item.icon size={16} strokeWidth={item.active ? 2 : 1.5} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Chat History */}
                {groupedSessions.map((group) => (
                    group.sessions.length > 0 && (
                        <div key={group.label} className="space-y-1">
                            <h3 className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Clock size={10} />
                                {group.label}
                            </h3>
                            <div className="space-y-0.5">
                                {group.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => handleSelectSession(session.id)}
                                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                                            propActiveSessionId === session.id
                                                ? 'bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900'
                                                : 'text-zinc-500 hover:bg-white/50 hover:text-zinc-900'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-colors ${propActiveSessionId === session.id ? 'bg-zinc-100 text-zinc-900' : 'bg-transparent text-zinc-400 group-hover:text-zinc-600'}`}>
                                            <MessageSquare size={14} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium truncate">
                                                {session.title || 'Untitled Chat'}
                                            </div>
                                        </div>

                                        <div className={`absolute right-2 opacity-0 group-hover:opacity-100 flex items-center transition-opacity ${propActiveSessionId === session.id ? 'opacity-100' : ''}`}>
                                            <button
                                                onClick={(e) => handleDeleteSession(e, session.id)}
                                                className="p-1 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-md transition-colors"
                                            >
                                                <Trash2 size={13} strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {sessions.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <p className="text-zinc-500 text-sm">No chat history yet.</p>
                    </div>
                )}
            </div>

            {/* 3. Footer / User Profile */}
            <div className="p-3 border-t border-zinc-200 bg-[#FAFAFA]">
                <div
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 cursor-pointer transition-all duration-200 group"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white text-xs font-medium shadow-sm ring-2 ring-white">
                        {getUserInitials()}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium text-sm text-zinc-900 truncate group-hover:text-black">
                            {user?.fullName || 'User'}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate group-hover:text-zinc-600">
                            {actuallySubscribed ? 'Pro Plan' : 'Free Plan'}
                        </div>
                    </div>
                    <Settings
                        size={16}
                        strokeWidth={1.5}
                        className="text-zinc-400 group-hover:text-zinc-600 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSettings();
                        }}
                    />
                </div>

                {showUserMenu && (
                    <div className="absolute bottom-16 left-3 w-[260px] bg-white rounded-xl shadow-xl border border-zinc-200 p-1.5 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <div className="px-2 py-1.5 border-b border-zinc-100 mb-1">
                            <p className="text-xs font-semibold text-zinc-900">{user?.primaryEmailAddress?.emailAddress}</p>
                        </div>
                        <button
                            onClick={handleOpenSettings}
                            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
                        >
                            <Settings size={14} strokeWidth={1.5} />
                            Settings
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={14} strokeWidth={1.5} />
                            Sign out
                        </button>
                    </div>
                )}
            </div>

            <SubscriptionPopup
                isOpen={showPricing}
                onClose={() => setShowPricing(false)}
                tokensUsed={0}
                tokensLimit={100}
                title="Pricing Plans"
                description="Choose the plan that's right for you."
            />
            <ShareModal
                isOpen={showShare}
                onClose={() => setShowShare(false)}
            />
        </div>
    );
};

export default Sidebar;

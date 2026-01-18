import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    MessageSquare, Search, Settings,
    CreditCard, LogOut, SquarePen,
    MoreHorizontal, Trash2, X,
    ChevronDown, ChevronRight,
    Sparkles, User, Zap, History,
    Calendar, Box, RefreshCw,
    Share2, Database, FolderOpen, Bot,
    Home, HelpCircle, Clock, Check, PanelLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@/lib/authContext';
import { useChatSessions, useSubscription } from '@/hooks/useSupabase';
import Logo from './Logo';
import { groupSessionsByDate, DateGroup } from '@/lib/utils/dateGrouping';
import SubscriptionPopup from './SubscriptionPopup';
import ShareModal from './ShareModal';

interface SidebarProps {
    activeSessionId?: string;
    onNewChat: () => void;
    onSelectSession: (sessionId: string) => void;
    onOpenSettings: () => void;
    onClose?: () => void;
    onCollapse?: () => void;
    isSubscribed?: boolean;
    isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeSessionId,
    onNewChat,
    onSelectSession,
    onOpenSettings,
    onClose,
    onCollapse,
    isSubscribed = false,
    isCollapsed = false
}) => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { sessions, loading, error, deleteSession, refreshSessions } = useChatSessions();
    const { isPro, tier } = useSubscription();

    // Override isSubscribed prop with actual tier from backend
    const actuallySubscribed = isPro || isSubscribed;
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [showPricing, setShowPricing] = useState(false);
    const [showShare, setShowShare] = useState(false);

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
            label: 'Nevra Pro',
            description: 'Our smartest model & more',
            action: () => setShowPricing(true),
            isPro: true,
            showUpgrade: !actuallySubscribed
        },
        {
            type: 'plan' as const,
            icon: Zap,
            label: 'Nevra Free',
            description: 'Great for everyday tasks',
            action: () => { },
            isActive: !isSubscribed
        },
        { type: 'divider' as const },
        { type: 'button' as const, icon: Home, label: 'Home', action: () => navigate('/') },
        { type: 'button' as const, icon: Share2, label: 'Share with Friend', action: () => setShowShare(true) },
        { type: 'button' as const, icon: CreditCard, label: 'Pricing', action: () => setShowPricing(true) },
        { type: 'button' as const, icon: Settings, label: 'Settings', action: onOpenSettings },
        { type: 'button' as const, icon: LogOut, label: 'Sign Out', action: () => signOut() },
    ];

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

        return groupSessionsByDate(sorted as any);
    }, [sessions, searchTerm]);

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

    const getUserInitials = () => {
        if (user?.fullName) {
            const names = user.fullName.split(' ');
            return names.length >= 2
                ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
                : user.fullName.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Render Mini Sidebar (Rail Mode)
    if (isCollapsed) {
        return (
            <div className="flex flex-col h-full bg-[#FAFAFA] border-r border-zinc-200 w-[60px] items-center py-4 gap-6 shrink-0 z-20">
                {/* Logo / Home */}
                <div className="flex flex-col items-center gap-3">
                    <button onClick={onNewChat} className="p-2 hover:bg-zinc-200 rounded-lg transition-colors group relative" title="New Chat">
                        <Logo size={24} className="text-zinc-900" />
                    </button>
                    <button
                        onClick={onCollapse}
                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors"
                        title="Expand Sidebar"
                    >
                        <PanelLeft size={20} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Main Navigation Icons */}
                <div className="flex flex-col gap-4 w-full items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                        title="Home"
                    >
                        <Home size={20} strokeWidth={1.5} />
                    </button>

                    <button
                        onClick={() => setShowShare(true)}
                        className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                        title="Share with Friend"
                    >
                        <Share2 size={20} strokeWidth={1.5} />
                    </button>

                    <button
                        onClick={() => setShowPricing(true)}
                        className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                        title="Pricing"
                    >
                        <CreditCard size={20} strokeWidth={1.5} />
                    </button>

                    <button
                        onClick={onClose} // Expand sidebar for History
                        className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                        title="History"
                    >
                        <History size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex-1" />

                {/* Footer Icons */}
                <div className="flex flex-col gap-4 w-full items-center mb-2">
                    <button className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors" title="Help">
                        <div className="w-5 h-5 rounded-full border border-zinc-400 flex items-center justify-center font-serif italic text-xs">?</div>
                    </button>

                    <button onClick={onOpenSettings} className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors" title="Settings">
                        <Settings size={20} strokeWidth={1.5} />
                    </button>

                    <div
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="relative cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs">
                            {getUserInitials()}
                        </div>

                        {/* Mini User Menu */}
                        {showUserMenu && (
                            <div className="absolute bottom-0 left-10 w-48 bg-white rounded-xl shadow-xl border border-zinc-200 p-1.5 z-50 animate-in slide-in-from-left-2 fade-in duration-200">
                                <div className="px-2 py-1.5 border-b border-zinc-100 mb-1">
                                    <p className="text-xs font-semibold text-zinc-900 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                                </div>
                                <button
                                    onClick={onOpenSettings}
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
                </div>

                {/* Modals for Rail Mode */}
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
    }

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] border-r border-zinc-200 w-full font-sans">
            {/* 1. Header Section */}
            <div className="px-4 py-3 space-y-4">
                {/* Brand / Logo Area with Dropdown */}
                <div className="flex items-center justify-between px-1 mb-2 relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 hover:bg-zinc-100 -ml-2 p-2 rounded-lg transition-colors group"
                    >
                        <div className="w-8 h-8 flex items-center justify-center bg-black rounded-xl shadow-lg shadow-black/20 group-hover:scale-105 transition-transform">
                            <Logo size={18} className="text-white" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-zinc-900 font-display">
                            Nevra {isSubscribed && <span className="text-purple-600">Pro</span>}
                        </span>
                        <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={onCollapse}
                            className="hidden md:flex p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                            title="Collapse Sidebar"
                        >
                            <PanelLeft size={18} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Close Sidebar"
                        >
                            <X size={18} />
                        </button>

                        <button onClick={onNewChat} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors" title="New Chat">
                            <SquarePen size={18} strokeWidth={1.5} />
                        </button>
                    </div>

                    {/* Dropdown Menu - ChatGPT Style */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-left transition-all duration-200 animation-fade-in">
                            <div className="p-2 space-y-0.5">
                                {menuItems.map((item, index) => {
                                    if (item.type === 'divider') {
                                        return <div key={index} className="h-px bg-zinc-100 my-1 mx-2" />;
                                    }

                                    if (item.type === 'plan') {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (item.action) item.action();
                                                    setShowDropdown(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border ${item.isActive
                                                    ? 'bg-white border-zinc-200 shadow-sm'
                                                    : 'border-transparent hover:bg-zinc-50'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${item.isPro
                                                    ? 'bg-zinc-900 border-zinc-800 text-white'
                                                    : 'bg-white border-zinc-200 text-zinc-900'
                                                    }`}>
                                                    <Icon size={16} strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-zinc-900">{item.label}</span>
                                                        {item.showUpgrade && (
                                                            <span className="text-xs px-2.5 py-1 bg-white border border-zinc-200 text-zinc-900 rounded-full font-medium shadow-sm hover:bg-zinc-50">
                                                                Upgrade
                                                            </span>
                                                        )}
                                                        {item.isActive && (
                                                            <Check size={16} className="text-zinc-900" strokeWidth={2.5} />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 truncate">{item.description}</div>
                                                </div>
                                            </button>
                                        );
                                    }

                                    // Regular Menu Item
                                    if (item.type === 'button') {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (item.action) item.action();
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
                                            >
                                                <Icon size={16} strokeWidth={1.5} />
                                                {item.label}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    )}


                </div>

                {/* Mobile Navigation Toolbar */}
                <div className="flex md:hidden items-center justify-between px-2 mb-3 pb-2 border-b border-zinc-50">
                    <button onClick={() => navigate('/')} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors" title="Home">
                        <Home size={18} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setShowShare(true)} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors" title="Share">
                        <Share2 size={18} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setShowPricing(true)} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors" title="Pro Plan">
                        <Zap size={18} strokeWidth={1.5} />
                    </button>
                    <button onClick={onOpenSettings} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors" title="Settings">
                        <Settings size={18} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Search Input (Minimalist) */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={15} strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-300 focus:bg-white rounded-lg text-sm text-zinc-700 placeholder-zinc-400 outline-none transition-all duration-200"
                    />
                </div>
            </div>

            {/* 2. Scrollable Sessions List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
                {/* ... (Previous session list code remains the same) ... */}
                {Object.entries(groupedSessions).map(([groupName, groupMessages]) => (
                    groupMessages.length > 0 && (
                        <div key={groupName} className="space-y-1">
                            <h3 className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                                {groupName}
                            </h3>
                            <div className="space-y-[2px]">
                                {groupMessages.map(session => (
                                    <div
                                        key={session.id}
                                        onClick={() => onSelectSession(session.id)}
                                        className={`
                                            group relative flex items-center gap-3 px-3 py-2 text-sm rounded-lg active:scale-[0.99] transition-all duration-150 cursor-pointer
                                            ${activeSessionId === session.id
                                                ? 'bg-zinc-100 text-zinc-900 font-medium'
                                                : 'text-zinc-600 hover:bg-zinc-100/50 hover:text-zinc-900'
                                            }
                                        `}
                                    >
                                        <div className="relative flex-1 min-w-0">
                                            <div className="truncate pr-6">
                                                {session.title || 'Untitled Chat'}
                                            </div>
                                        </div>

                                        {/* Hover Actions */}
                                        <div className={`absolute right-2 opacity-0 group-hover:opacity-100 flex items-center transition-opacity ${activeSessionId === session.id ? 'opacity-100' : ''}`}>
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
                            onOpenSettings();
                        }}
                    />
                </div>

                {/* Popover Menu for Sign Out */}
                {showUserMenu && (
                    <div className="absolute bottom-16 left-3 w-[260px] bg-white rounded-xl shadow-xl border border-zinc-200 p-1.5 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <div className="px-2 py-1.5 border-b border-zinc-100 mb-1">
                            <p className="text-xs font-semibold text-zinc-900">{user?.primaryEmailAddress?.emailAddress}</p>
                        </div>
                        <button
                            onClick={onOpenSettings}
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

            {/* Modals */}
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

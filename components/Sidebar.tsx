import React, { useMemo, useState } from 'react';
import {
    Bot,
    ChevronDown,
    Code2,
    FileText,
    FolderOpen,
    GalleryHorizontalEnd,
    Home,
    LayoutTemplate,
    LogOut,
    MessageSquare,
    MoreHorizontal,
    PanelLeft,
    Pin,
    PinOff,
    Plus,
    Search,
    Settings,
    Sparkles,
    Trash2,
    X,
    CreditCard,
    Pencil,
    Plug,
    SquareTerminal,
    Brain,
    Wand2,
    Rocket,
    Repeat2,
    PenLine,
    BarChart3,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@/lib/authContext';
import { useChatSessions, useSubscription } from '@/hooks/useSupabase';
import { updateChatSession } from '@/lib/supabaseDatabase';
import { useUI } from './UIContext';
import Logo from './Logo';
import SubscriptionPopup from './SubscriptionPopup';
import ConnectorsModal from './chat/ConnectorsModal';

type GlassToolMode = 'chat' | 'search' | 'agents' | 'builder' | 'code' | 'omni' | 'documents';

interface SidebarProps {
    activeSessionId?: string;
    onNewChat?: () => void;
    onSelectSession?: (sessionId: string) => void;
    onOpenSettings?: () => void;
    onClose?: () => void;
    onCollapse?: () => void;
    isCollapsed?: boolean;
    activeToolMode?: GlassToolMode;
    onToolModeSelect?: (mode: GlassToolMode) => void;
}

const toolItems = [
    {
        label: 'Glass Chat',
        description: 'Unified AI conversation workspace',
        icon: MessageSquare,
        path: '/chat',
        mode: 'chat' as GlassToolMode,
        state: { mode: 'tutor', glassMode: 'chat', autoSend: false },
    },
    {
        label: 'Glass Search',
        description: 'Deep research with sources',
        icon: Search,
        path: '/chat',
        mode: 'search' as GlassToolMode,
        state: { mode: 'tutor', glassMode: 'search', enableWebSearch: true, reasoning: true, autoSend: false },
    },
    {
        label: 'Glass Build',
        description: 'Prompt-to-app and UI builder',
        icon: LayoutTemplate,
        path: '/chat',
        mode: 'builder' as GlassToolMode,
        state: { mode: 'tutor', glassMode: 'builder', autoSend: false },
    },
    {
        label: 'Glass Code',
        description: 'Coding assistant and debugger',
        icon: Code2,
        path: '/chat',
        mode: 'code' as GlassToolMode,
        state: { mode: 'tutor', glassMode: 'code', autoSend: false },
    },
    {
        label: 'Glass Omni',
        description: 'End-to-end AI SaaS workflow',
        icon: Sparkles,
        path: '/chat',
        mode: 'omni' as GlassToolMode,
        state: { mode: 'tutor', glassMode: 'omni', enableWebSearch: true, reasoning: true, autoSend: false },
    },
];

const resourceItems = [
    { label: 'Skills Library', description: 'View and manage auto-selected skills', icon: SquareTerminal, action: 'skills' },
    { label: 'Connectors', description: 'Connect external data sources', icon: Plug, action: 'connectors' },
    { label: 'Styles', description: 'Default response style preferences', icon: Wand2, action: 'styles' },
];

const Sidebar: React.FC<SidebarProps> = ({
    activeSessionId,
    onNewChat,
    onSelectSession,
    onOpenSettings,
    onClose,
    onCollapse,
    isCollapsed,
    activeToolMode,
    onToolModeSelect,
}) => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const { sessions, loading, deleteSession, refreshSessions } = useChatSessions();
    const { isPro } = useSubscription();
    const { setSettingsOpen } = useUI();
    const navigate = useNavigate();
    const location = useLocation();

    const [query, setQuery] = useState('');
    const [toolsOpen, setToolsOpen] = useState(() => localStorage.getItem('useglass-tools-open') !== 'false');
    const [pricingOpen, setPricingOpen] = useState(false);
    const [connectorsOpen, setConnectorsOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const collapsed = !!isCollapsed;
    const currentSessionId = activeSessionId || location.pathname.split('/chat/')[1];

    const filteredSessions = useMemo(() => {
        return sessions
            .filter((session) => (session.title || 'Untitled Chat').toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => {
                const aPinned = Boolean((a as any).metadata?.pinned);
                const bPinned = Boolean((b as any).metadata?.pinned);
                if (aPinned !== bPinned) return aPinned ? -1 : 1;
                return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
            });
    }, [sessions, query]);

    const pinnedSessions = filteredSessions.filter((session) => Boolean((session as any).metadata?.pinned));
    const recentSessions = filteredSessions.filter((session) => !Boolean((session as any).metadata?.pinned)).slice(0, 12);

    const openSettings = () => {
        if (onOpenSettings) onOpenSettings();
        else setSettingsOpen(true);
    };

    const startNewChat = () => {
        if (onNewChat) onNewChat();
        else navigate('/chat');
    };

    const selectSession = (sessionId: string) => {
        if (onSelectSession) onSelectSession(sessionId);
        else navigate(`/chat/${sessionId}`);
    };

    const toggleTools = () => {
        const next = !toolsOpen;
        setToolsOpen(next);
        localStorage.setItem('useglass-tools-open', String(next));
    };

    const updateMetadata = async (session: any, updates: Record<string, unknown>) => {
        await updateChatSession(session.id, {
            metadata: {
                ...(session.metadata || {}),
                ...updates,
            },
        } as any);
        refreshSessions();
    };

    const renameSession = async (session: any) => {
        const title = window.prompt('Rename chat', session.title || 'Untitled Chat');
        if (!title || title.trim() === session.title) return;
        await updateChatSession(session.id, { title: title.trim() } as any);
        refreshSessions();
    };

    const removeSession = async (sessionId: string) => {
        if (!window.confirm('Delete this chat?')) return;
        await deleteSession(sessionId);
        if (sessionId === currentSessionId) navigate('/chat');
    };

    const mainItems = [
        { label: 'Home', icon: Home, path: '/' },
        { label: 'Projects', icon: FolderOpen, path: '/projects' },
        { label: 'Documents', icon: FileText, path: '/documents' },
        { label: 'Gallery', icon: GalleryHorizontalEnd, path: '/gallery' },
        { label: 'Pricing', icon: CreditCard, action: () => setPricingOpen(true), active: location.pathname === '/pricing' },
        { label: 'Settings', icon: Settings, action: openSettings },
    ];

    const renderSession = (session: any) => {
        const isActive = currentSessionId === session.id;
        const isPinned = Boolean(session.metadata?.pinned);

        return (
            <div
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition-all ${
                    isActive
                        ? 'bg-white/90 shadow-sm ring-1 ring-zinc-200 text-zinc-950'
                        : 'text-zinc-600 hover:bg-white/70 hover:text-zinc-950'
                }`}
            >
                <MessageSquare size={15} strokeWidth={1.7} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{session.title || 'Untitled Chat'}</span>
                {isPinned && <Pin size={12} className="text-blue-500 shrink-0" />}
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(openMenuId === session.id ? null : session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1 hover:bg-zinc-100 text-zinc-400"
                    title="Chat actions"
                >
                    <MoreHorizontal size={14} />
                </button>
                {openMenuId === session.id && (
                    <div className="absolute right-2 top-9 z-50 w-40 rounded-2xl border border-zinc-200 bg-white p-1 shadow-xl">
                        <button onClick={(event) => { event.stopPropagation(); renameSession(session); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50">
                            <Pencil size={13} /> Rename
                        </button>
                        <button onClick={(event) => { event.stopPropagation(); updateMetadata(session, { pinned: !isPinned }); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50">
                            {isPinned ? <PinOff size={13} /> : <Pin size={13} />} {isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={(event) => { event.stopPropagation(); removeSession(session.id); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                            <Trash2 size={13} /> Delete
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (collapsed) {
        const railMainItems = [
            { label: 'Home', icon: Home, action: () => navigate('/') },
            { label: 'New Chat', icon: Plus, action: startNewChat },
            { label: 'Search Chats', icon: Search, action: onCollapse },
            { label: 'Projects', icon: FolderOpen, action: () => navigate('/projects') },
            { label: 'Documents', icon: FileText, action: () => navigate('/documents') },
        ];
        return (
            <aside className="flex h-full w-12 shrink-0 flex-col items-center border-r border-zinc-200/80 bg-white/85 py-3 backdrop-blur-xl">
                <button onClick={onCollapse} className="mb-6 rounded-xl p-2 text-zinc-700 hover:bg-zinc-100" title="Open sidebar">
                    <PanelLeft size={17} />
                </button>

                <div className="flex flex-col items-center gap-3">
                    {railMainItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button key={item.label} onClick={item.action} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100" title={item.label}>
                                <Icon size={17} strokeWidth={1.7} />
                            </button>
                        );
                    })}
                </div>

                <div className="mt-auto flex flex-col items-center gap-3">
                    <button onClick={openSettings} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100" title="Settings">
                        <Settings size={17} strokeWidth={1.7} />
                    </button>
                    <button onClick={() => signOut()} className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white" title="Account">
                        {(user?.firstName || user?.fullName || 'U').slice(0, 1).toUpperCase()}
                    </button>
                </div>
                <ConnectorsModal isOpen={connectorsOpen} onClose={() => setConnectorsOpen(false)} />
            </aside>
        );
    }

    return (
        <aside className="relative flex h-full w-[304px] shrink-0 flex-col border-r border-white/70 bg-white/75 backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(180,210,255,0.28),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(245,248,255,0.42))]" />
            <div className="relative flex h-full flex-col">
                <div className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                        <div onClick={() => navigate('/')} className="flex cursor-pointer items-center gap-2">
                            <Logo size={28} />
                            <div>
                                <div className="text-sm font-semibold tracking-tight text-zinc-950">UseGlass AI</div>
                                <div className="text-[11px] text-zinc-500">{isPro ? 'Pro workspace' : 'Free workspace'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {onCollapse && (
                                <button onClick={onCollapse} className="rounded-xl p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-700">
                                    <PanelLeft size={16} />
                                </button>
                            )}
                            {onClose && (
                                <button onClick={onClose} className="rounded-xl p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-700 md:hidden">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <button onClick={startNewChat} className="flex w-full items-center gap-2 rounded-2xl bg-zinc-950 px-3 py-2.5 text-sm font-medium text-white shadow-lg shadow-zinc-900/10 transition hover:-translate-y-0.5">
                        <Plus size={16} /> New Chat
                    </button>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search conversation..."
                            className="w-full rounded-2xl border border-white/80 bg-white/70 py-2 pl-9 pr-3 text-xs outline-none ring-1 ring-zinc-200/60 transition focus:border-blue-200 focus:ring-blue-200"
                        />
                    </div>
                </div>

                <div className="relative flex-1 overflow-y-auto px-3 pb-4">
                    <nav className="space-y-1">
                        {mainItems.map((item) => {
                            const Icon = item.icon;
                            const active = item.active || (item.path && location.pathname === item.path);
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => item.action ? item.action() : navigate(item.path!)}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
                                        active ? 'bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-950' : 'text-zinc-600 hover:bg-white/70 hover:text-zinc-950'
                                    }`}
                                >
                                    <Icon size={16} strokeWidth={1.7} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="my-4 h-px bg-zinc-200/70" />

                    <section className="mb-4">
                        <button onClick={toggleTools} className="mb-2 flex w-full items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            <span>Tools</span>
                            <ChevronDown size={13} className={toolsOpen ? 'rotate-180 transition' : 'transition'} />
                        </button>
                        {toolsOpen && (
                            <div className="space-y-1">
                                {toolItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = activeToolMode === item.mode;
                                    return (
                                        <button
                                            key={item.label}
                                            onClick={() => {
                                                onToolModeSelect?.(item.mode);
                                                navigate(item.path, { state: item.state });
                                            }}
                                            className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2 text-left transition ${active ? 'bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-950' : 'text-zinc-600 hover:bg-white/70 hover:text-zinc-950'}`}
                                        >
                                            <Icon size={16} strokeWidth={1.7} className="mt-0.5 shrink-0" />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium">{item.label}</span>
                                                <span className="block text-[11px] leading-4 text-zinc-400">{item.description}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="mb-4">
                        <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Resources</h3>
                        <div className="space-y-1">
                            {resourceItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button key={item.label} onClick={() => {
                                        if (item.action === 'connectors') setConnectorsOpen(true);
                                        else if (item.action === 'skills') navigate('/skills');
                                        else navigate('/settings', { state: { section: 'ai-preferences' } });
                                    }} className="flex w-full items-start gap-3 rounded-2xl px-3 py-2 text-left text-zinc-600 transition hover:bg-white/70 hover:text-zinc-950" title={item.description}>
                                        <Icon size={16} strokeWidth={1.7} className="mt-0.5 shrink-0" />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium">{item.label}</span>
                                            <span className="block text-[11px] leading-4 text-zinc-400">{item.description}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="my-4 h-px bg-zinc-200/70" />

                    {pinnedSessions.length > 0 && (
                        <section className="mb-4">
                            <h3 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Pinned</h3>
                            <div className="space-y-1">{pinnedSessions.map(renderSession)}</div>
                        </section>
                    )}

                    <section>
                        <h3 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Recent</h3>
                        <div className="space-y-1">
                            {loading ? (
                                <div className="px-3 py-3 text-xs text-zinc-400">Loading chats...</div>
                            ) : recentSessions.length > 0 ? (
                                recentSessions.map(renderSession)
                            ) : (
                                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/50 px-3 py-4 text-center text-xs text-zinc-500">
                                    No conversations yet.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="relative border-t border-white/70 p-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-2 ring-1 ring-zinc-200/70">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-950 text-xs font-semibold text-white">
                            {(user?.firstName || user?.fullName || 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-zinc-950">{user?.fullName || 'UseGlass User'}</div>
                            <div className="truncate text-[11px] text-zinc-500">{user?.primaryEmailAddress?.emailAddress || 'Transparent workspace'}</div>
                        </div>
                        <button onClick={() => signOut()} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500" title="Sign out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <SubscriptionPopup
                isOpen={pricingOpen}
                onClose={() => setPricingOpen(false)}
                tokensUsed={0}
                tokensLimit={100}
                title="UseGlass AI Plans"
                description="Choose the workspace tier that fits how you create."
            />
            <ConnectorsModal isOpen={connectorsOpen} onClose={() => setConnectorsOpen(false)} />
        </aside>
    );
};

export default Sidebar;

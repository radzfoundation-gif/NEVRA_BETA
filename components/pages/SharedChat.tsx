import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChatSession, getSessionMessages, getUser } from '@/lib/supabaseDatabase';
import { ChatSession, Message, User } from '@/lib/supabase';
import Logo from '@/components/Logo';
import { Bot, User as UserIcon, Calendar, Share, Copy, Check, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import DynamicBackground from '@/components/ui/DynamicBackground';

const SharedChat: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<ChatSession | null>(null);
    const [creator, setCreator] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchChat = async () => {
            if (!id) return;

            try {
                setLoading(true);
                // Supabase RLS policies should allow fetching if is_shared is true
                const [sessionData, messagesData] = await Promise.all([
                    getChatSession(id),
                    getSessionMessages(id)
                ]);

                if (sessionData && (sessionData.is_shared || sessionData.is_shared === undefined)) {
                    // is_shared might be undefined if strict checking is not returned by getChatSession if not in interface yet fully?
                    // But we know we added it.
                    // If fetching failed due to RLS, sessionData would be null.
                    setSession(sessionData);
                    setMessages(messagesData);

                    // Fetch creator info
                    if (sessionData.user_id) {
                        const userData = await getUser(sessionData.user_id);
                        setCreator(userData);
                    }
                } else {
                    setError("Chat not found or not shared.");
                }
            } catch (err) {
                console.error("Error fetching shared chat:", err);
                setError("Failed to load chat.");
            } finally {
                setLoading(false);
            }
        };

        fetchChat();
    }, [id]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative z-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-4 relative z-50">
                <h1 className="text-2xl font-bold mb-2">Error</h1>
                <p className="text-zinc-400 mb-6">{error || "Chat not found"}</p>
                <Link to="/" className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors">
                    Go Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 relative overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <DynamicBackground />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 border-b border-white/10 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shadow-sm">
                <Link to="/" className="flex items-center gap-2">
                    <Logo size={24} />
                    <span className="text-base md:text-lg font-bold tracking-tight">NEVRA</span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link to="/" className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-black text-xs md:text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors">
                        Try Nevra
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 pt-20 md:pt-24 pb-20 px-3 md:px-4 max-w-3xl md:max-w-4xl mx-auto">
                <div className="mb-6 md:mb-8 text-left border-b border-white/10 pb-6 glass-panel p-4 md:p-6 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/5">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-xl md:text-3xl font-bold text-white leading-tight">{session.title || "Untitled Chat"}</h1>
                            <div className="flex items-center gap-3 text-zinc-400 text-xs md:text-sm flex-wrap">
                                <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md border border-white/5">
                                    <Calendar size={12} className="md:w-3.5 md:h-3.5" />
                                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md border border-white/5">
                                    <Share size={12} className="md:w-3.5 md:h-3.5" />
                                    <span>Shared Chat</span>
                                </div>
                            </div>
                        </div>

                        {/* Creator Info */}
                        {creator && (
                            <div className="flex items-center gap-3 bg-white/5 p-2 md:p-3 rounded-xl border border-white/10 shrink-0 self-start">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-[1px]">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                        {creator.avatar_url ? (
                                            <img src={creator.avatar_url} alt={creator.full_name || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white font-bold text-xs md:text-sm">
                                                {creator.full_name ? creator.full_name[0].toUpperCase() : 'U'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest font-semibold">Shared by</span>
                                    <span className="text-xs md:text-sm font-medium text-white">{creator.full_name || 'Anonymous User'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6 md:space-y-8 min-h-[50vh]">
                    {messages.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500">
                            <Info size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No messages in this conversation yet.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={cn("flex gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                {/* Avatar */}
                                <div className={cn(
                                    "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 border shadow-lg mt-1",
                                    msg.role === 'ai'
                                        ? "bg-black border-zinc-800 text-zinc-400"
                                        : "bg-white text-black border-white"
                                )}>
                                    {msg.role === 'ai' ? <Bot size={14} className="md:w-4 md:h-4" /> : <UserIcon size={14} className="md:w-4 md:h-4" />}
                                </div>

                                {/* Message Bubble */}
                                <div className={cn(
                                    "relative max-w-[90%] md:max-w-[85%] rounded-2xl px-4 py-3 md:px-6 md:py-5 text-sm md:text-base leading-relaxed overflow-hidden shadow-lg",
                                    msg.role === 'user'
                                        ? "bg-zinc-800 text-white border border-zinc-700 rounded-tr-sm"
                                        : "bg-[#09090b] text-white border border-white/10 rounded-tl-sm shadow-xl"
                                )}>
                                    {msg.role === 'ai' ? (
                                        <div className="prose prose-sm md:prose-base prose-invert max-w-none text-white
                                        [&_*]:text-white
                                        prose-p:leading-relaxed prose-p:text-white
                                        prose-headings:text-white prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4
                                        prose-strong:text-white prose-strong:font-bold
                                        prose-ul:my-2 prose-ol:my-2
                                        prose-li:my-0.5 prose-li:text-white
                                        prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:my-3
                                        prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-white prose-code:before:content-none prose-code:after:content-none
                                        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                                        prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-500/10 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:text-white prose-blockquote:rounded-r-lg
                                        prose-hr:border-white/10 prose-hr:my-4
                                    ">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeRaw, rehypeKatex]}
                                                components={{
                                                    code({ node, inline, className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !inline && match ? (
                                                            <div className="relative group rounded-lg overflow-hidden my-3 md:my-4 border border-white/10 bg-[#0a0a0a]">
                                                                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                                                                    <span className="text-[10px] md:text-xs text-zinc-400 font-mono uppercase">{match[1]}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            copyToClipboard(String(children));
                                                                            setCopiedId(msg.id + match[1]);
                                                                            setTimeout(() => setCopiedId(null), 2000);
                                                                        }}
                                                                        className="text-zinc-500 hover:text-white transition-colors"
                                                                    >
                                                                        {copiedId === msg.id + match[1] ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                                    </button>
                                                                </div>
                                                                <div className="overflow-x-auto">
                                                                    <SyntaxHighlighter
                                                                        style={vscDarkPlus}
                                                                        language={match[1]}
                                                                        PreTag="div"
                                                                        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                                                                        {...props}
                                                                    >
                                                                        {String(children).replace(/\n$/, '')}
                                                                    </SyntaxHighlighter>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    )}

                                    {/* Images */}
                                    {msg.images && msg.images.length > 0 && (
                                        <div className="mt-3 md:mt-4 flex flex-wrap gap-2">
                                            {msg.images.map((img, i) => (
                                                <img key={i} src={img} alt="Attached" className="max-w-full rounded-xl max-h-60 md:max-h-80 object-cover border border-white/10 shadow-lg" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-12 md:mt-16 pt-8 border-t border-white/10 text-center pb-8 md:pb-10">
                    <p className="text-zinc-400 mb-6 text-base md:text-lg">Want to experience this conversation yourself?</p>
                    <Link to="/" className="inline-flex h-10 md:h-12 items-center justify-center rounded-full bg-white px-6 md:px-8 text-sm md:text-base font-medium text-black transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        Create Your Own Chat
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default SharedChat;

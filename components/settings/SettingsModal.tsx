import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, Check, CreditCard, Zap, Layout, Database, Github, Figma, Cloud, Book, Beaker, Link } from 'lucide-react';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import McpSettings from './McpSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isSubscribed?: boolean;
    tokensUsed?: number;
}

type SettingsTab = 'general' | 'subscription' | 'applications' | 'connectors' | 'cloud' | 'knowledge' | 'experimental';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isSubscribed: propIsSubscribed, tokensUsed: propTokensUsed }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const { tokensUsed: hookTokensUsed, credits: hookCredits, isSubscribed: hookIsSubscribed } = useTokenLimit();

    // Use props if available (source of truth from Home), otherwise fallback to hook
    const isSubscribed = propIsSubscribed !== undefined ? propIsSubscribed : hookIsSubscribed;
    const tokensUsed = propTokensUsed !== undefined ? propTokensUsed : hookTokensUsed;
    const tokensRemaining = typeof hookCredits === 'number' ? hookCredits : 999999;

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: 'General', icon: Layout },
        { id: 'subscription', label: 'Subscription & Tokens', icon: CreditCard },
        { id: 'connectors', label: 'Connectors (MCP)', icon: Link },
        { id: 'applications', label: 'Applications', icon: Layout }, // Using Layout as placeholder for Grid/Apps icon
        { id: 'cloud', label: 'Cloud', icon: Cloud },
        { id: 'knowledge', label: 'Knowledge', icon: Book },
        { id: 'experimental', label: 'Experimental features', icon: Beaker },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="w-full max-w-5xl h-[90vh] md:h-[80vh] bg-white border border-zinc-200 rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Sidebar */}
                <div className="w-full md:w-64 bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col shrink-0">
                    <div className="p-4 md:p-6 md:pb-2 flex justify-between items-center md:block">
                        <h2 className="text-sm font-medium text-zinc-500 px-2 mb-0 md:mb-2">Personal Settings</h2>
                        <button onClick={onClose} className="md:hidden text-zinc-400">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-x-auto md:overflow-y-auto px-2 md:px-4 pb-2 md:pb-0 flex md:flex-col gap-1 scrollbar-none">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as SettingsTab)}
                                className={`whitespace-nowrap flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id
                                    ? 'bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900'
                                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-white min-h-0">
                    {/* Header */}
                    <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 shrink-0">
                        <h1 className="text-xl font-semibold text-zinc-900">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h1>
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 hover:bg-zinc-100 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-3xl">

                            {/* General Tab */}
                            {activeTab === 'general' && (
                                <div className="space-y-8">
                                    <section>
                                        <h3 className="text-sm font-medium text-zinc-500 mb-4">Appearance and notifications</h3>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-zinc-900 font-medium mb-1">Theme</div>
                                                    <div className="text-sm text-zinc-500">Change the interface to light, dark or your default system preference.</div>
                                                </div>
                                                <div className="relative">
                                                    <select className="bg-white border border-zinc-200 text-zinc-900 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-purple-500 appearance-none min-w-[120px]">
                                                        <option>Light</option>
                                                        <option>Dark</option>
                                                        <option>System</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-zinc-900 font-medium mb-1">Display token usage in chat</div>
                                                    <div className="text-sm text-zinc-500">When activated, your token consumption will be shown above the prompt field at all times.</div>
                                                </div>
                                                <ToggleSwitch defaultChecked={false} />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-zinc-900 font-medium mb-1">Sound notification</div>
                                                    <div className="text-sm text-zinc-500">Play a chime when Bolt finishes responding. This only works in your active browser tab.</div>
                                                </div>
                                                <ToggleSwitch defaultChecked={true} />
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-medium text-zinc-500 mb-4">Code</h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-zinc-900 font-medium mb-1">Editor line wrapping</div>
                                                <div className="text-sm text-zinc-500">When enabled, long lines of code will visually wrap to the next line within the editor, preventing horizontal scrolling.</div>
                                            </div>
                                            <ToggleSwitch defaultChecked={true} />
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* Subscription & Tokens Tab */}
                            {activeTab === 'subscription' && (
                                <div className="space-y-8">
                                    {/* Join NOIR AI Pro Banner - Top Center */}
                                    {!isSubscribed && (
                                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-center shadow-xl">
                                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white mb-4">
                                                <Zap size={14} className="text-yellow-300" />
                                                PREMIUM PLAN
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-2">Join Noir Pro</h2>
                                            <p className="text-white/90 mb-6 max-w-xl mx-auto">
                                                Unlock unlimited AI tokens, access to all premium models, priority support, and exclusive features
                                            </p>
                                            <div className="flex items-center justify-center gap-4">
                                                <a
                                                    href="/pricing"
                                                    className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                                >
                                                    Upgrade Now
                                                </a>
                                                <a
                                                    href="/pricing"
                                                    className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/30"
                                                >
                                                    View Plans
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-medium text-zinc-900 mb-1">Subscription & Tokens</h3>
                                                <p className="text-sm text-zinc-500">Your next token refill of <span className="text-zinc-900 font-medium">1M tokens</span> is due on <span className="text-zinc-900 font-medium underline decoration-dotted">January 1, 2026</span>.</p>
                                            </div>
                                            <a
                                                href="/pricing"
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 transition-colors"
                                            >
                                                <CreditCard size={14} /> Manage billing
                                            </a>
                                        </div>

                                        <div className="mb-6">
                                            <div className="text-sm text-zinc-500 mb-2">Current token balance</div>
                                            <div className="text-4xl font-bold text-zinc-900 mb-2">{isSubscribed ? 'Unlimited' : `${tokensRemaining} / 150`}</div>
                                            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: isSubscribed ? '100%' : `${(tokensRemaining / 150) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-zinc-500">
                                                <span>{isSubscribed ? 'Unlimited' : `${tokensRemaining} tokens available`}</span>
                                                <span>Daily limit: {isSubscribed ? 'Unlimited' : '150 tokens'}</span>
                                            </div>

                                        </div>
                                    </div>

                                    {!isSubscribed && (
                                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden">
                                            <div className="p-6 border-b border-zinc-200">
                                                <h3 className="text-xl font-bold text-zinc-900 mb-1">Upgrade to Noir Pro</h3>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold text-zinc-900">Rp 45,000</span>
                                                    <span className="text-zinc-500">per month</span>
                                                </div>
                                                <div className="text-sm text-zinc-500">billed monthly (≈ $3 USD)</div>
                                            </div>

                                            <div className="p-6 grid md:grid-cols-2 gap-8">
                                                <div>
                                                    <div className="text-sm font-medium text-zinc-500 mb-3">Features</div>
                                                    <div className="text-sm text-zinc-500 mb-6">Current plan: Free</div>
                                                    <a
                                                        href="/pricing"
                                                        className="block text-center w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
                                                    >
                                                        Upgrade to Pro
                                                    </a>
                                                </div>

                                                <div>
                                                    <div className="text-sm font-medium text-zinc-900 mb-4">You get:</div>
                                                    <ul className="space-y-3">
                                                        {[
                                                            'Unlimited AI Tokens',
                                                            'All Premium AI Models',
                                                            'Priority Support',
                                                            'Unlimited Chat History',
                                                            'Advanced Code Generation',
                                                            'Export Projects',
                                                            'No Daily Limits',
                                                        ].map((feature, i) => (
                                                            <li key={i} className="flex items-start gap-3 text-sm text-zinc-600">
                                                                <Check size={16} className="text-purple-500 shrink-0 mt-0.5" />
                                                                {feature}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Applications Tab */}
                            {activeTab === 'applications' && (
                                <div className="space-y-4">
                                    <IntegrationCard
                                        icon={<Database className="text-green-500" size={24} />}
                                        name="Supabase"
                                        description="Integrate Supabase to enable authentication or sync your app with a robust and scalable database effortlessly."
                                    />
                                    <IntegrationCard
                                        icon={<Cloud className="text-blue-500" size={24} />}
                                        name="Netlify"
                                        description="Deploy your app seamlessly with your own Netlify account. Use custom domains, optimize performance, and take advantage of powerful deployment tools."
                                    />
                                    <IntegrationCard
                                        icon={<Figma className="text-purple-500" size={24} />}
                                        name="Figma"
                                        description="Integrate Figma to import your designs as code ready to be analyzed by Bolt."
                                    />
                                    <IntegrationCard
                                        icon={<Github className="text-black" size={24} />}
                                        name="GitHub"
                                        description="To revoke the GitHub Authorization visit github.com/settings/apps/authorizations, look for the 'Bolt (by StackBlitz)' application, and click 'Revoke'."
                                    />
                                </div>
                            )}

                            {/* Connectors (MCP) Tab */}
                            {activeTab === 'connectors' && (
                                <McpSettings />
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToggleSwitch = ({ defaultChecked }: { defaultChecked: boolean }) => {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <button
            onClick={() => setChecked(!checked)}
            className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-zinc-200'}`}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
};

const IntegrationCard = ({ icon, name, description }: { icon: React.ReactNode, name: string, description: string }) => (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0 border border-zinc-200">
            {icon}
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-zinc-900">{name}</h3>
                <button className="px-4 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 transition-colors">
                    Connect
                </button>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
        </div>
    </div>
);

// Helper for ChevronDown since it wasn't imported
const ChevronDown = ({ size, className }: { size: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export default SettingsModal;

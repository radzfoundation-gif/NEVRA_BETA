import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, Check, CreditCard, Zap, Layout, Database, Github, Figma, Cloud, Book, Beaker } from 'lucide-react';
import { useTokenLimit } from '@/hooks/useTokenLimit';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'subscription' | 'applications' | 'cloud' | 'knowledge' | 'experimental';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const { tokensUsed, tokensRemaining, isSubscribed } = useTokenLimit();

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: 'General', icon: Layout },
        { id: 'subscription', label: 'Subscription & Tokens', icon: CreditCard },
        { id: 'applications', label: 'Applications', icon: Layout }, // Using Layout as placeholder for Grid/Apps icon
        { id: 'cloud', label: 'Cloud', icon: Cloud },
        { id: 'knowledge', label: 'Knowledge', icon: Book },
        { id: 'experimental', label: 'Experimental features', icon: Beaker },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-5xl h-[90vh] md:h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Sidebar */}
                <div className="w-full md:w-64 bg-[#0a0a0a] border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0">
                    <div className="p-4 md:p-6 md:pb-2 flex justify-between items-center md:block">
                        <h2 className="text-sm font-medium text-gray-400 px-2 mb-0 md:mb-2">Personal Settings</h2>
                        <button onClick={onClose} className="md:hidden text-gray-400">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-x-auto md:overflow-y-auto px-2 md:px-4 pb-2 md:pb-0 flex md:flex-col gap-1 scrollbar-none">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as SettingsTab)}
                                className={`whitespace-nowrap flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-[#0a0a0a] min-h-0">
                    {/* Header */}
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 shrink-0">
                        <h1 className="text-xl font-semibold text-white">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h1>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
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
                                        <h3 className="text-sm font-medium text-gray-400 mb-4">Appearance and notifications</h3>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-white font-medium mb-1">Theme</div>
                                                    <div className="text-sm text-gray-500">Change the interface to light, dark or your default system preference.</div>
                                                </div>
                                                <div className="relative">
                                                    <select className="bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-purple-500 appearance-none min-w-[120px]">
                                                        <option>Dark</option>
                                                        <option>Light</option>
                                                        <option>System</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-white font-medium mb-1">Display token usage in chat</div>
                                                    <div className="text-sm text-gray-500">When activated, your token consumption will be shown above the prompt field at all times.</div>
                                                </div>
                                                <ToggleSwitch defaultChecked={false} />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-white font-medium mb-1">Sound notification</div>
                                                    <div className="text-sm text-gray-500">Play a chime when Bolt finishes responding. This only works in your active browser tab.</div>
                                                </div>
                                                <ToggleSwitch defaultChecked={true} />
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-medium text-gray-400 mb-4">Code</h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-white font-medium mb-1">Editor line wrapping</div>
                                                <div className="text-sm text-gray-500">When enabled, long lines of code will visually wrap to the next line within the editor, preventing horizontal scrolling.</div>
                                            </div>
                                            <ToggleSwitch defaultChecked={true} />
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* Subscription & Tokens Tab */}
                            {activeTab === 'subscription' && (
                                <div className="space-y-8">
                                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-medium text-white mb-1">Subscription & Tokens</h3>
                                                <p className="text-sm text-gray-400">Your next token refill of <span className="text-white font-medium">1M tokens</span> is due on <span className="text-white font-medium underline decoration-dotted">January 1, 2026</span>.</p>
                                            </div>
                                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
                                                <CreditCard size={14} /> Manage billing
                                            </button>
                                        </div>

                                        <div className="mb-6">
                                            <div className="text-sm text-gray-400 mb-2">Current token balance</div>
                                            <div className="text-4xl font-bold text-white mb-2">{isSubscribed ? 'Unlimited' : `${tokensRemaining} / 50`}</div>
                                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: isSubscribed ? '100%' : `${(tokensRemaining / 50) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                                <span>{isSubscribed ? 'Unlimited' : `${tokensRemaining} tokens available`}</span>
                                                <span>Daily limit: {isSubscribed ? 'Unlimited' : '50 tokens'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
                                        <div className="p-6 border-b border-white/10">
                                            <h3 className="text-xl font-bold text-white mb-1">Upgrade to Pro</h3>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold text-white">$25</span>
                                                <span className="text-gray-400">per month</span>
                                            </div>
                                            <div className="text-sm text-gray-400">billed monthly</div>
                                        </div>

                                        <div className="p-6 grid md:grid-cols-2 gap-8">
                                            <div>
                                                <div className="text-sm font-medium text-gray-400 mb-3">Monthly tokens</div>
                                                <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold">b</div>
                                                        10M / month
                                                    </div>
                                                    <ChevronDown size={14} className="text-gray-500" />
                                                </div>
                                                <div className="text-sm text-gray-500 mb-6">Your current plan: Free</div>
                                                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors">
                                                    Upgrade
                                                </button>
                                            </div>

                                            <div>
                                                <div className="text-sm font-medium text-white mb-4">You get:</div>
                                                <ul className="space-y-3">
                                                    {[
                                                        'Public and private projects',
                                                        'No daily token limit',
                                                        'Start at 10M tokens per month',
                                                        'No bolt branding on websites',
                                                        '100MB file upload limit',
                                                        'Website hosting',
                                                        'Up to 1M web requests',
                                                        'Unused tokens roll over to next month',
                                                        'Custom domain support'
                                                    ].map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Applications Tab */}
                            {activeTab === 'applications' && (
                                <div className="space-y-4">
                                    <IntegrationCard
                                        icon={<Database className="text-green-400" size={24} />}
                                        name="Supabase"
                                        description="Integrate Supabase to enable authentication or sync your app with a robust and scalable database effortlessly."
                                    />
                                    <IntegrationCard
                                        icon={<Cloud className="text-blue-400" size={24} />}
                                        name="Netlify"
                                        description="Deploy your app seamlessly with your own Netlify account. Use custom domains, optimize performance, and take advantage of powerful deployment tools."
                                    />
                                    <IntegrationCard
                                        icon={<Figma className="text-purple-400" size={24} />}
                                        name="Figma"
                                        description="Integrate Figma to import your designs as code ready to be analyzed by Bolt."
                                    />
                                    <IntegrationCard
                                        icon={<Github className="text-white" size={24} />}
                                        name="GitHub"
                                        description="To revoke the GitHub Authorization visit github.com/settings/apps/authorizations, look for the 'Bolt (by StackBlitz)' application, and click 'Revoke'."
                                    />
                                </div>
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
            className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
};

const IntegrationCard = ({ icon, name, description }: { icon: React.ReactNode, name: string, description: string }) => (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
            {icon}
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white">{name}</h3>
                <button className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
                    Connect
                </button>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
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

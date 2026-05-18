import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Bot,
    CheckCircle2,
    Code2,
    Copy,
    FileSearch,
    LayoutTemplate,
    Loader2,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import Sidebar from '../Sidebar';
import { cn } from '@/lib/utils';

type GlassTool = 'search' | 'agents' | 'builder' | 'code';

interface GlassToolPageProps {
    tool: GlassTool;
}

const toolConfig = {
    search: {
        eyebrow: 'Glass Search',
        title: 'Deep research with sources, confidence, and clean synthesis.',
        description: 'Ask research-heavy questions, collect source cards, and turn findings into concise, cited answers.',
        icon: FileSearch,
        mode: 'tutor',
        prompt: 'Research this topic deeply and answer with a quick summary, confidence level, source cards, and sources used: ',
        actions: ['Market research', 'Academic summary', 'Compare sources', 'Explain current topic'],
    },
    agents: {
        eyebrow: 'Glass Agents',
        title: 'Run focused AI workflows with planning, working, review, and final output.',
        description: 'Choose an agent profile for research, coding, UI, business analysis, content, SaaS planning, or debugging.',
        icon: Bot,
        mode: 'tutor',
        prompt: 'Act as a UseGlass AI autonomous agent. Plan, work, review, and produce a final output for: ',
        actions: ['Research Agent', 'Coding Agent', 'UI Builder Agent', 'Business Analyst Agent', 'SaaS Planner Agent', 'Debugging Agent'],
    },
    builder: {
        eyebrow: 'Glass Builder',
        title: 'Prompt-to-app and UI builder using the existing UseGlass workspace.',
        description: 'Generate landing pages, dashboards, auth screens, pricing pages, components, and improved designs.',
        icon: LayoutTemplate,
        mode: 'builder',
        prompt: 'Build a polished React UI with preview-ready code for: ',
        actions: ['Landing page', 'Dashboard', 'Auth page', 'Pricing page', 'Component', 'Improve design'],
    },
    code: {
        eyebrow: 'Glass Code',
        title: 'Coding assistant and debugger for real engineering tasks.',
        description: 'Generate, explain, debug, refactor, convert code, create API routes, and fix pasted terminal logs.',
        icon: Code2,
        mode: 'tutor',
        prompt: 'Act as Glass Code. Analyze, debug, and provide clean code with tests for: ',
        actions: ['Debug error log', 'Refactor code', 'Explain code', 'Generate API route', 'Convert code', 'Suggest tests'],
    },
} satisfies Record<GlassTool, {
    eyebrow: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    mode: 'builder' | 'tutor';
    prompt: string;
    actions: string[];
}>;

const agentStatuses = ['planning', 'working', 'reviewing', 'done'] as const;

const GlassToolPage: React.FC<GlassToolPageProps> = ({ tool }) => {
    const navigate = useNavigate();
    const config = toolConfig[tool];
    const Icon = config.icon;
    const [input, setInput] = useState('');
    const [runningAgent, setRunningAgent] = useState<string | null>(null);
    const [agentStatusIndex, setAgentStatusIndex] = useState(0);
    const [agentOutput, setAgentOutput] = useState('');

    const examples = useMemo(() => config.actions, [config.actions]);

    const startChat = (prompt?: string) => {
        const finalPrompt = prompt || `${config.prompt}${input}`.trim();
        navigate('/chat', {
            state: {
                initialPrompt: finalPrompt,
                mode: config.mode,
                autoSend: Boolean(finalPrompt),
                reasoning: tool === 'search' || tool === 'agents',
                enableWebSearch: tool === 'search',
                glassMode: tool,
            },
        });
    };

    const runAgent = (agentName: string) => {
        setRunningAgent(agentName);
        setAgentOutput('');
        setAgentStatusIndex(0);
        const timers = [650, 1300, 1950, 2600].map((delay, index) =>
            window.setTimeout(() => {
                setAgentStatusIndex(index);
                if (index === agentStatuses.length - 1) {
                    const output = `${agentName} ready. UseGlass AI will run a structured workflow with planning, execution, review, and final deliverable.`;
                    setAgentOutput(output);
                }
            }, delay)
        );
        return () => timers.forEach(window.clearTimeout);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_42%,#eef6ff_100%)]">
            <Sidebar />
            <main className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(140,190,255,0.25),transparent_32%),radial-gradient(circle_at_85%_5%,rgba(220,235,255,0.55),transparent_30%)]" />
                <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-5 py-8 md:px-10">
                    <section className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
                        <div>
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm backdrop-blur-xl">
                                <Icon size={16} className="text-blue-600" />
                                {config.eyebrow}
                            </div>
                            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
                                {config.title}
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">{config.description}</p>
                        </div>
                        <div className="rounded-[28px] border border-white/80 bg-white/65 p-5 shadow-2xl shadow-blue-900/5 backdrop-blur-2xl">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <div className="font-semibold text-zinc-950">Start in workspace</div>
                                    <div className="text-sm text-zinc-500">Uses existing chat, builder, and streaming flow.</div>
                                </div>
                            </div>
                            <textarea
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Describe what you want UseGlass AI to do..."
                                className="min-h-32 w-full resize-none rounded-3xl border border-zinc-200 bg-white/75 p-4 text-sm outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
                            />
                            <button
                                onClick={() => startChat()}
                                disabled={!input.trim()}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-zinc-200"
                            >
                                Run with UseGlass AI <ArrowRight size={16} />
                            </button>
                        </div>
                    </section>

                    <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {examples.map((example) => (
                            <button
                                key={example}
                                onClick={() => tool === 'agents' ? runAgent(example) : startChat(`${config.prompt}${example}`)}
                                className={cn(
                                    'rounded-[24px] border border-white/80 bg-white/60 p-5 text-left shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5',
                                    runningAgent === example && 'ring-2 ring-blue-200'
                                )}
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    {tool === 'agents' && runningAgent === example && agentStatuses[agentStatusIndex] !== 'done'
                                        ? <Loader2 size={18} className="animate-spin" />
                                        : tool === 'agents' && runningAgent === example
                                            ? <CheckCircle2 size={18} />
                                            : <Icon size={18} />}
                                </div>
                                <div className="font-semibold text-zinc-950">{example}</div>
                                <div className="mt-1 text-sm leading-6 text-zinc-500">
                                    {tool === 'agents' && runningAgent === example
                                        ? `Status: ${agentStatuses[agentStatusIndex]}`
                                        : 'Open a guided UseGlass workflow.'}
                                </div>
                            </button>
                        ))}
                    </section>

                    {agentOutput && (
                        <section className="mt-8 rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-2xl">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="font-semibold text-zinc-950">Agent output</div>
                                <button
                                    onClick={() => navigator.clipboard?.writeText(agentOutput)}
                                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-950"
                                >
                                    <Copy size={13} /> Copy
                                </button>
                            </div>
                            <p className="text-sm leading-6 text-zinc-600">{agentOutput}</p>
                        </section>
                    )}

                    <section className="mt-10 rounded-[28px] border border-white/80 bg-white/50 p-5 backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                            <MessageSquare size={18} className="mt-1 text-blue-600" />
                            <div>
                                <div className="font-semibold text-zinc-950">V1 note</div>
                                <p className="mt-1 text-sm leading-6 text-zinc-600">
                                    This workspace is active as a guided shell and delegates generation to the existing UseGlass AI chat/backend. Deeper persistence and automation can build on the new Firestore migration.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default GlassToolPage;

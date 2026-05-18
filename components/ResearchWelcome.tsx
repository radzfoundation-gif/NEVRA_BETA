import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowUp, Link as LinkIcon, Layers, Plus, Paperclip, ChevronDown, Check, Sparkles, LayoutGrid, Mic, Youtube, FileText, X, Loader2, Wrench, AlertTriangle, Image as ImageIcon, PenTool, Code, LineChart, Hammer, GraduationCap, AudioLines, Lightbulb, ChevronRight, Target, BookOpen, PenLine, CircleDashed, Brain, Search, Palette, Folder, Github, Plug, SquareTerminal, Wand2, Camera, Play, MessageSquare, Bot, LayoutTemplate, Code2, Calendar, Mail, Database, Slack, MessageCircle, Zap } from 'lucide-react';
import ModelSelector, { ModelType } from './ui/ModelSelector';
import { cn, getApiUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AlertModal from './ui/AlertModal';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import SubscriptionPopup from './SubscriptionPopup';
import VoiceDictationModal from './chat/VoiceDictationModal';
import { useUser } from '@/lib/authContext';
import { getSkills } from '@/lib/skillsApi';
import { getModelDisplayName } from '@/lib/ai';
import { routeGlassIntent } from '@/lib/glassAutoRouter';

const TOOL_GROUPS = [
    [
        { id: 'upload_file', label: 'Add files or photos', icon: Paperclip },
        { id: 'camera', label: 'Take a screenshot', icon: Camera },
        { id: 'project', label: 'Add to project', icon: Folder, hasChevron: true },
        { id: 'github', label: 'Add from GitHub', icon: Github },
    ],
    [
        { id: 'skills', label: 'Skills', icon: SquareTerminal, hasChevron: true },
    ],
    [
        { id: 'web', label: 'Web search', icon: Globe },
        { id: 'styles', label: 'Use style', icon: Wand2 },
    ]
];

export type WorkflowModeId = 'think' | 'research' | 'create' | 'build' | 'code' | 'analyze' | 'launch' | 'automate';
export type GlassStyleId = 'normal' | 'calm-teacher' | 'professional' | 'concise' | 'deep-thinker' | 'creative-writer' | 'startup-founder' | 'senior-engineer' | 'critical-reviewer' | 'friendly-assistant' | 'research-analyst' | 'minimal' | 'motivator';

export const WORKFLOW_MODES: Array<{ id: WorkflowModeId; label: string; flow: string; description: string; suggestions: string[] }> = [
    { id: 'think', label: 'Think Mode', flow: 'Understand → Plan → Structure → Recommend', description: 'Memahami tujuan, membuat rencana, roadmap, dan next action.', suggestions: ['Buat rencana produk dari ide ini', 'Pecah masalah ini menjadi langkah-langkah', 'Buat roadmap belajar saya', 'Bantu validasi ide startup ini'] },
    { id: 'research', label: 'Research Mode', flow: 'Search → Compare → Verify → Summarize', description: 'Riset topik, kompetitor, pasar, produk, dan sumber informasi.', suggestions: ['Riset tren AI workspace', 'Bandingkan produk kompetitor', 'Buat market research untuk ide saya', 'Cari peluang dan risiko pasar'] },
    { id: 'create', label: 'Create Mode', flow: 'Understand tone → Generate draft → Improve → Finalize', description: 'Writing, copywriting, storytelling, artikel, script, dan branding.', suggestions: ['Buat copywriting landing page', 'Tulis artikel dari outline ini', 'Buat script video pendek', 'Buat caption promosi'] },
    { id: 'build', label: 'Build Mode', flow: 'Plan structure → Generate layout → Improve UX → Finalize', description: 'Membuat UI, layout, halaman web, product structure, dan app flow.', suggestions: ['Buat landing page glassmorphism', 'Buat dashboard AI workspace', 'Buat pricing page SaaS', 'Buat UI prompt input modern'] },
    { id: 'code', label: 'Code Mode', flow: 'Analyze problem → Detect issue → Generate fix → Review solution', description: 'Generate, debug, explain, refactor, convert, fix, dan review code.', suggestions: ['Fix error terminal ini', 'Buat komponen UI', 'Jelaskan kode ini', 'Refactor kode ini'] },
    { id: 'analyze', label: 'Analyze Mode', flow: 'Inspect → Critique → Improve → Validate', description: 'Review output, audit kualitas, risiko, dan kritik konstruktif.', suggestions: ['Review PRD ini', 'Cari kelemahan ide saya', 'Audit UX halaman ini', 'Kritik landing page saya'] },
    { id: 'launch', label: 'Launch Mode', flow: 'Prepare → Optimize → Launch → Monitor', description: 'Checklist launch, GTM, monetization, deployment, dan marketing plan.', suggestions: ['Buat launch checklist', 'Buat GTM strategy', 'Buat pricing strategy', 'Buat plan promosi 7 hari'] },
    { id: 'automate', label: 'Automate Mode', flow: 'Plan workflow → Execute steps → Monitor progress → Generate result', description: 'Automation, multi-step task, SOP, orchestration, dan chained tasks.', suggestions: ['Buat workflow otomatis', 'Buat SOP kerja harian', 'Buat task chain untuk konten', 'Buat sistem follow-up user'] },
];

export const GLASS_STYLES: Array<{ id: GlassStyleId; label: string; prompt: string; description: string }> = [
    { id: 'normal', label: 'Normal', description: 'Seimbang, natural, jelas.', prompt: 'Use a balanced, natural, clear style.' },
    { id: 'calm-teacher', label: 'Calm Teacher', description: 'Sabar, sederhana, step-by-step.', prompt: 'Use simple language, explain step by step, add light analogies, avoid unexplained technical terms.' },
    { id: 'professional', label: 'Professional', description: 'Formal, rapi, cocok bisnis.', prompt: 'Use formal, polished, structured business-ready language.' },
    { id: 'concise', label: 'Concise', description: 'Pendek dan langsung.', prompt: 'Be brief, direct, use minimal bullets, avoid rambling.' },
    { id: 'deep-thinker', label: 'Deep Thinker', description: 'Analisis mendalam.', prompt: 'Provide deep analysis, options, risks, tradeoffs, and recommendations.' },
    { id: 'creative-writer', label: 'Creative Writer', description: 'Kreatif untuk branding/copy.', prompt: 'Use creative wording, strong copywriting, multiple idea angles, and vivid phrasing.' },
    { id: 'startup-founder', label: 'Startup Founder', description: 'Produk, growth, MVP, launch.', prompt: 'Think like a startup founder: focus on MVP, positioning, growth, monetization, pricing, and launch.' },
    { id: 'senior-engineer', label: 'Senior Engineer', description: 'Teknis dan maintainable.', prompt: 'Use senior engineering judgment: architecture, debugging, best practices, maintainability, scalability, and edge cases.' },
    { id: 'critical-reviewer', label: 'Critical Reviewer', description: 'Cari kelemahan dan solusi.', prompt: 'Review critically, identify weaknesses and risks, then give sharp actionable fixes.' },
    { id: 'friendly-assistant', label: 'Friendly Assistant', description: 'Santai dan mudah dicerna.', prompt: 'Use a relaxed, friendly, easy-to-understand tone.' },
    { id: 'research-analyst', label: 'Research Analyst', description: 'Objektif, terstruktur, data-driven.', prompt: 'Be objective, structured, evidence-oriented, insight-driven, and clear about confidence.' },
    { id: 'minimal', label: 'Minimal', description: 'Sangat singkat.', prompt: 'Answer with only the core points, extremely short.' },
    { id: 'motivator', label: 'Motivator', description: 'Supportive dan actionable.', prompt: 'Be supportive, encouraging, and actionable while staying practical.' },
];

const WRITING_STYLES = GLASS_STYLES;


// Custom Shark Icon for Deep Research
const SharkIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
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
        <path d="M2 12c0 0 5-3 8-3s5 2 7 2 4-2 7-2c0 0-2 6-7 6s-5-2-7-2-4 1-6 1c0 0 2-2 5-2" />
        <path d="M11 9c0 0 0-5 3-7 0 0 0 5-3 7" />
    </svg>
);

type GlassWelcomeMode = 'chat' | 'search' | 'agents' | 'builder' | 'code' | 'omni' | 'documents';

export interface GlassSkill {
    id: string;
    name: string;
    description: string;
    category: string;
    instructions: string;
    bestFor: string;
    examples: string[];
}

export interface GlassConnector {
    id: string;
    name: string;
    description: string;
    category: string;
    status: 'connected' | 'disconnected' | 'coming soon';
    capabilities: string[];
    permissions: string;
    examples: string[];
    icon: React.ElementType;
}

export const BUILT_IN_GLASS_SKILLS: GlassSkill[] = [
    { id: 'prd-writer', name: 'PRD Writer', category: 'Product', description: 'Turns ideas into clear product requirement documents.', bestFor: 'Product specs, feature scope, acceptance criteria', instructions: 'Act as a senior product manager. Produce structured PRDs with goals, users, requirements, edge cases, and acceptance criteria.', examples: ['Buat PRD untuk fitur AI workspace', 'Tulis acceptance criteria untuk billing'] },
    { id: 'saas-planner', name: 'SaaS Planner', category: 'Business', description: 'Plans SaaS products from idea to launch.', bestFor: 'MVP planning, roadmap, pricing, launch strategy', instructions: 'Act as a SaaS strategist. Break work into market, product, growth, monetization, risks, and milestones.', examples: ['Buat roadmap SaaS AI', 'Rancang MVP untuk UseGlass AI'] },
    { id: 'ui-reviewer', name: 'UI Reviewer', category: 'Design', description: 'Reviews UI for clarity, hierarchy, accessibility, and polish.', bestFor: 'Landing pages, dashboards, app screens', instructions: 'Act as a senior UI/UX reviewer. Give prioritized critique and actionable improvements.', examples: ['Review layout landing page ini', 'Perbaiki hierarchy dashboard'] },
    { id: 'code-debugger', name: 'Code Debugger', category: 'Code', description: 'Finds root causes and gives safe code fixes.', bestFor: 'Build errors, runtime bugs, refactors', instructions: 'Act as a debugging engineer. Identify root cause, explain why, provide minimal fix, and list verification steps.', examples: ['Fix npm run build error', 'Debug React crash setelah login'] },
    { id: 'academic-writer', name: 'Academic Writer', category: 'Writing', description: 'Writes clear academic answers with structure and citations guidance.', bestFor: 'Essays, discussion posts, research summaries', instructions: 'Act as an academic writing assistant. Use formal structure, balanced claims, and cite-needed notes without fabricating sources.', examples: ['Buat jawaban diskusi kuliah', 'Ringkas paper secara akademik'] },
    { id: 'brand-copywriter', name: 'Brand Copywriter', category: 'Marketing', description: 'Creates sharp brand messaging and conversion copy.', bestFor: 'Hero copy, landing pages, ads, positioning', instructions: 'Act as a brand copywriter. Write concise, differentiated copy with clear value proposition and CTA.', examples: ['Buat hero copy UseGlass AI', 'Tulis tagline SaaS AI'] },
    { id: 'prompt-engineer', name: 'Prompt Engineer', category: 'AI', description: 'Improves prompts into reliable reusable instructions.', bestFor: 'Prompt templates, agents, system prompts', instructions: 'Act as a prompt engineer. Rewrite prompts with goal, context, task, constraints, output format, and evaluation criteria.', examples: ['Improve prompt riset kompetitor', 'Buat prompt agent planner'] },
    { id: 'business-analyst', name: 'Business Analyst', category: 'Business', description: 'Analyzes markets, competitors, users, and business risks.', bestFor: 'Competitive research, market insight, SWOT', instructions: 'Act as a business analyst. Structure answers with assumptions, analysis, risks, opportunities, and recommendations.', examples: ['Riset kompetitor UseGlass AI', 'Buat SWOT ide startup saya'] },
    { id: 'study-assistant', name: 'Study Assistant', category: 'Learning', description: 'Turns topics into simple explanations and study plans.', bestFor: 'Learning plans, summaries, quizzes', instructions: 'Act as a patient tutor. Explain simply, use examples, check understanding, and create practice tasks.', examples: ['Buat rencana belajar React', 'Jelaskan konsep database'] },
    { id: 'content-creator', name: 'Content Creator', category: 'Content', description: 'Plans and writes content across channels.', bestFor: 'Social posts, scripts, content calendars', instructions: 'Act as a content strategist. Produce hooks, outlines, drafts, and repurposing plans.', examples: ['Buat workflow konten 7 hari', 'Tulis thread launch produk'] },
];

export const GLASS_CONNECTORS: GlassConnector[] = [
    { id: 'google-drive', name: 'Google Drive', category: 'Files', status: 'coming soon', icon: Folder, description: 'Read and search Drive files when connected.', capabilities: ['search', 'read', 'sync'], permissions: 'Requires file read permission after OAuth setup.', examples: ['Cari dokumen PRD terakhir', 'Ringkas file proposal'] },
    { id: 'github', name: 'GitHub', category: 'Code', status: 'disconnected', icon: Github, description: 'Use repository context for code tasks.', capabilities: ['search', 'read'], permissions: 'Repository access required. Writes disabled until explicitly connected.', examples: ['Cek penyebab error build repo saya', 'Review PR ini'] },
    { id: 'gmail', name: 'Gmail', category: 'Email', status: 'coming soon', icon: Mail, description: 'Search and summarize email context.', capabilities: ['search', 'read'], permissions: 'Email read permission required.', examples: ['Ringkas email klien minggu ini'] },
    { id: 'google-calendar', name: 'Google Calendar', category: 'Calendar', status: 'coming soon', icon: Calendar, description: 'Use schedule context for planning.', capabilities: ['read', 'sync'], permissions: 'Calendar read permission required.', examples: ['Buat jadwal kerja minggu ini'] },
    { id: 'notion', name: 'Notion', category: 'Docs', status: 'coming soon', icon: FileText, description: 'Search Notion pages and notes.', capabilities: ['search', 'read', 'sync'], permissions: 'Workspace page permission required.', examples: ['Cari catatan roadmap'] },
    { id: 'slack', name: 'Slack', category: 'Team', status: 'coming soon', icon: Slack, description: 'Summarize channel context.', capabilities: ['search', 'read'], permissions: 'Workspace channel permission required.', examples: ['Ringkas diskusi channel produk'] },
    { id: 'discord', name: 'Discord', category: 'Community', status: 'coming soon', icon: MessageCircle, description: 'Read community discussion context.', capabilities: ['search', 'read'], permissions: 'Server permission required.', examples: ['Ringkas feedback komunitas'] },
    { id: 'firebase-firestore', name: 'Firebase Firestore', category: 'Database', status: 'coming soon', icon: Database, description: 'Inspect database context when connected.', capabilities: ['read', 'deep research'], permissions: 'Database read credentials required.', examples: ['Analisis schema database'] },
    { id: 'web-search', name: 'Web Search', category: 'Research', status: 'connected', icon: Globe, description: 'Use web context for research answers.', capabilities: ['search', 'read', 'deep research'], permissions: 'Uses public web search only.', examples: ['Riset tren AI SaaS terbaru'] },
    { id: 'local-documents', name: 'Local Documents', category: 'Files', status: 'disconnected', icon: FileText, description: 'Use uploaded local documents as context.', capabilities: ['read', 'sync'], permissions: 'Only files uploaded in this session are used.', examples: ['Ringkas dokumen yang saya upload'] },
];

interface ResearchWelcomeProps {
    mode?: GlassWelcomeMode;
    onModeChange?: (mode: GlassWelcomeMode) => void;
    onSearch: (query: string, attachments?: AttachmentData[], model?: ModelType, reasoning?: boolean, featureType?: string) => void;
    initialQuery?: string;
    className?: string;
    hasApiKey?: boolean;
    userName?: string;
    isWebSearchEnabled?: boolean;
    onToggleWebSearch?: (enabled: boolean) => void;
    compact?: boolean;
    activeSkillId?: string | null;
    onSkillChange?: (skillId: string | null) => void;
    activeConnectorId?: string | null;
    onConnectorChange?: (connectorId: string | null) => void;
    activeWorkflowMode?: WorkflowModeId;
    onWorkflowModeChange?: (mode: WorkflowModeId) => void;
    activeGlassStyle?: GlassStyleId;
    onGlassStyleChange?: (style: GlassStyleId) => void;
    activeCanvasType?: 'web' | 'document' | 'code' | 'presentation' | 'general' | null;
}

interface AttachmentData {
    type: 'file' | 'audio' | 'youtube' | 'url';
    name: string;
    content: string;
    mimeType?: string;
}

export function ResearchWelcome({
    onSearch,
    initialQuery = '',
    className,
    hasApiKey = true,
    userName,
    isWebSearchEnabled = false,
    onToggleWebSearch,
    onModeChange,
    mode = 'chat',
    compact = false,
    activeSkillId = null,
    onSkillChange,
    activeConnectorId = null,
    onConnectorChange,
    activeWorkflowMode: controlledWorkflowMode,
    onWorkflowModeChange,
    activeGlassStyle: controlledGlassStyle,
    onGlassStyleChange,
    activeCanvasType = null
}: ResearchWelcomeProps) {

    const modeConfig = {
        chat: {
            eyebrow: 'Glass Chat',
            title: 'Start thinking with UseGlass AI',
            description: 'Ask anything, choose a mode, and turn ideas into useful outputs.',
            placeholder: 'Ask UseGlass AI anything...',
            icon: MessageSquare,
            reasoning: false,
            web: false,
        },
        search: {
            eyebrow: 'Glass Search',
            title: 'Research deeply with sources',
            description: 'Ask a research question and get summaries, comparisons, source cards, and next questions.',
            placeholder: 'Research competitor AI tools, market trends, papers, or products...',
            icon: Search,
            reasoning: true,
            web: true,
        },
        agents: {
            eyebrow: 'Glass Agents',
            title: 'Run an AI agent workflow',
            description: 'Describe the task. The agent will plan, work, review, and return a final deliverable.',
            placeholder: 'Ask an agent to research, code, plan, write, debug, or study...',
            icon: Bot,
            reasoning: true,
            web: false,
        },
        builder: {
            eyebrow: 'Glass Builder',
            title: 'Build UI from a prompt',
            description: 'Describe a landing page, dashboard, auth page, component, or SaaS screen.',
            placeholder: 'Create a glassmorphism SaaS landing page for...',
            icon: LayoutTemplate,
            reasoning: false,
            web: false,
        },
        code: {
            eyebrow: 'Glass Code',
            title: 'Generate, debug, and explain code',
            description: 'Paste a task, code snippet, or terminal error and get a fix with explanation.',
            placeholder: 'Paste an error log or ask for code generation...',
            icon: Code2,
            reasoning: false,
            web: false,
        },
        omni: {
            eyebrow: 'Glass Omni',
            title: 'Build a full AI workflow',
            description: 'Combine chat, research, planning, builder, code, and agents in one guided flow.',
            placeholder: 'Create an end-to-end workflow for building an AI SaaS...',
            icon: Sparkles,
            reasoning: true,
            web: true,
        },
        documents: {
            eyebrow: 'Glass Documents',
            title: 'Chat with documents',
            description: 'Upload, summarize, extract notes, and ask questions about your files.',
            placeholder: 'Summarize this document or extract action items...',
            icon: FileText,
            reasoning: true,
            web: false,
        },
    }[mode];
    const ModeIcon = modeConfig.icon;
    const [localWorkflowMode, setLocalWorkflowMode] = useState<WorkflowModeId>('think');
    const activeWorkflowMode = controlledWorkflowMode || localWorkflowMode;
    const setActiveWorkflowMode = (nextMode: WorkflowModeId) => { setLocalWorkflowMode(nextMode); onWorkflowModeChange?.(nextMode); };
    const [showWorkflowMenu, setShowWorkflowMenu] = useState(false);
    const [showCanvasHint, setShowCanvasHint] = useState(false);


    const modeOptions: Array<{ id: GlassWelcomeMode; label: string; icon: React.ElementType; color: string }> = [
        { id: 'chat', label: 'Glass Chat', icon: MessageSquare, color: 'bg-zinc-950 text-white border-zinc-900' },
        { id: 'search', label: 'Glass Search', icon: Search, color: 'bg-blue-50 text-blue-700 border-blue-100' },
        { id: 'agents', label: 'Glass Agents', icon: Bot, color: 'bg-violet-50 text-violet-700 border-violet-100' },
        { id: 'builder', label: 'Glass Builder', icon: LayoutTemplate, color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
        { id: 'code', label: 'Glass Code', icon: Code2, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        { id: 'omni', label: 'Glass Omni', icon: Sparkles, color: 'bg-orange-50 text-orange-700 border-orange-100' },
    ];
    const activeModeOption = modeOptions.find(option => option.id === mode) || modeOptions[0];
    const ActiveModeIcon = activeModeOption.icon;
    const modeDescriptions: Record<GlassWelcomeMode, string> = {
        chat: 'Unified AI conversation workspace',
        search: 'Deep research with sources',
        agents: 'Autonomous AI workflow agents',
        builder: 'Prompt-to-app and UI builder',
        code: 'Coding assistant and debugger',
        omni: 'End-to-end AI SaaS workflow',
        documents: 'Document workspace',
    };

    const activeSkill = BUILT_IN_GLASS_SKILLS.find(skill => skill.id === activeSkillId || skill.name === activeSkillId) || null;
    const activeConnector = GLASS_CONNECTORS.find(connector => connector.id === activeConnectorId || connector.name === activeConnectorId) || null;
    const activeWorkflow = WORKFLOW_MODES.find(item => item.id === activeWorkflowMode) || WORKFLOW_MODES[0];

    const modeSuggestions: Record<GlassWelcomeMode, Array<{ label: string; query: string; icon: React.ReactNode }>> = {
        chat: [
            { label: 'Jelaskan sesuatu dengan sederhana', query: 'Jelaskan sesuatu dengan sederhana: ', icon: <MessageSquare size={16} /> },
            { label: 'Bantu saya brainstorming ide', query: 'Bantu saya brainstorming ide untuk ', icon: <Lightbulb size={16} /> },
            { label: 'Tulis ulang teks ini lebih profesional', query: 'Tulis ulang teks ini agar lebih profesional: ', icon: <PenLine size={16} /> },
            { label: 'Buat rencana belajar', query: 'Buat rencana belajar untuk ', icon: <GraduationCap size={16} /> },
        ],
        search: [
            { label: 'Riset tren AI SaaS terbaru', query: 'Riset tren AI SaaS terbaru dan rangkum insight pentingnya.', icon: <Search size={16} /> },
            { label: 'Bandingkan beberapa produk AI', query: 'Bandingkan beberapa produk AI berikut: ', icon: <Layers size={16} /> },
            { label: 'Cari insight pasar untuk ide startup', query: 'Cari insight pasar untuk ide startup: ', icon: <LineChart size={16} /> },
            { label: 'Buat ringkasan riset kompetitor', query: 'Buat ringkasan riset kompetitor untuk ', icon: <BookOpen size={16} /> },
        ],
        agents: [
            { label: 'Jalankan Research Agent untuk ide saya', query: 'Jalankan Research Agent untuk ide saya: ', icon: <Bot size={16} /> },
            { label: 'Jalankan SaaS Planner Agent', query: 'Jalankan SaaS Planner Agent untuk ', icon: <Target size={16} /> },
            { label: 'Buat workflow konten 7 hari', query: 'Buat workflow konten 7 hari untuk ', icon: <PenTool size={16} /> },
            { label: 'Analisis masalah bisnis saya', query: 'Analisis masalah bisnis saya dan buat rencana aksi: ', icon: <Brain size={16} /> },
        ],
        builder: [
            { label: 'Buat landing page glassmorphism', query: 'Buat landing page glassmorphism untuk ', icon: <LayoutTemplate size={16} /> },
            { label: 'Buat dashboard AI agent', query: 'Buat dashboard AI agent dengan ', icon: <LayoutGrid size={16} /> },
            { label: 'Buat pricing page SaaS', query: 'Buat pricing page SaaS untuk ', icon: <FileText size={16} /> },
            { label: 'Buat login page modern', query: 'Buat login page modern dengan style ', icon: <Palette size={16} /> },
        ],
        code: [
            { label: 'Debug error kode saya', query: 'Debug error kode saya berikut: ', icon: <Wrench size={16} /> },
            { label: 'Buat komponen UI', query: 'Buat komponen UI untuk ', icon: <Code2 size={16} /> },
            { label: 'Jelaskan kode ini', query: 'Jelaskan kode ini dengan sederhana: ', icon: <BookOpen size={16} /> },
            { label: 'Refactor kode ini agar lebih bersih', query: 'Refactor kode ini agar lebih bersih: ', icon: <Sparkles size={16} /> },
        ],
        omni: [
            { label: 'Buat workflow membangun SaaS AI', query: 'Buat workflow membangun SaaS AI dari ide sampai launch.', icon: <Sparkles size={16} /> },
            { label: 'Dari ide sampai landing page', query: 'Bantu saya dari ide sampai landing page untuk ', icon: <LayoutTemplate size={16} /> },
            { label: 'Riset, rancang, dan buat rencana produk', query: 'Riset, rancang, dan buat rencana produk untuk ', icon: <Brain size={16} /> },
            { label: 'Buat roadmap produk dari nol', query: 'Buat roadmap produk dari nol untuk ', icon: <Target size={16} /> },
        ],
        documents: [
            { label: 'Ringkas dokumen', query: 'Ringkas dokumen ini: ', icon: <FileText size={16} /> },
            { label: 'Extract action items', query: 'Extract action items dari dokumen ini: ', icon: <Check size={16} /> },
            { label: 'Buat Q&A dokumen', query: 'Buat Q&A dari dokumen ini: ', icon: <BookOpen size={16} /> },
            { label: 'Buat catatan dokumen', query: 'Buat catatan ringkas dari dokumen ini: ', icon: <PenLine size={16} /> },
        ],
    };

    const [query, setQuery] = useState(initialQuery);

    // Sync query if initialQuery changes (e.g., from localStorage after mount)
    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    const [isFocused, setIsFocused] = useState(false);
    const [attachments, setAttachments] = useState<AttachmentData[]>([]);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showModeToolsMenu, setShowModeToolsMenu] = useState(false);
    const [autoPilot, setAutoPilot] = useState(true);
    const [showAIToolsMenu, setShowAIToolsMenu] = useState(false);
    const [showYouTubeInput, setShowYouTubeInput] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
    const [showDictation, setShowDictation] = useState(false);

    const { user } = useUser();
    const [showStyleSubmenu, setShowStyleSubmenu] = useState(false);
    const [showSkillSubmenu, setShowSkillSubmenu] = useState(false);
    const [userSkills, setUserSkills] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
    const [localActiveStyle, setLocalActiveStyle] = useState<GlassStyleId>('normal');
    const activeStyle = controlledGlassStyle || localActiveStyle;
    const setActiveStyle = (styleId: GlassStyleId) => { setLocalActiveStyle(styleId); onGlassStyleChange?.(styleId); };
    const toolsMenuRef = useRef<HTMLDivElement>(null);

    // Load skills from Firestore
    useEffect(() => {
        if (!user?.id) return;
        getSkills(user.id)
            .then(data => setUserSkills(data.map(s => ({ id: s.id, name: s.name, enabled: s.enabled }))))
            .catch(() => { });
    }, [user?.id]);

    // Close tools menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setShowToolsMenu(false);
                setShowStyleSubmenu(false);
                setShowSkillSubmenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle tool selection from + dropdown
    const handleToolSelect = (toolId: string) => {
        if (navigator.vibrate) navigator.vibrate(50);

        switch (toolId) {
            case 'upload_file':
                setShowToolsMenu(false);
                fileInputRef.current?.click();
                break;
            case 'camera':
                setShowToolsMenu(false);
                setAlertConfig({
                    isOpen: true,
                    title: 'Screenshots',
                    message: 'Fitur tangkapan layar langsung akan segera hadir di UseGlass!',
                    type: 'development'
                });
                break;
            case 'project':
                setShowToolsMenu(false);
                setAlertConfig({
                    isOpen: true,
                    title: 'Projects',
                    message: 'UseGlass Workspace akan segera hadir! Nantikan fitur kolaborasi proyek yang lebih canggih.',
                    type: 'development'
                });
                break;
            case 'github':
                setShowToolsMenu(false);
                setAlertConfig({
                    isOpen: true,
                    title: 'GitHub Integration',
                    message: 'Hubungkan repositori GitHub Anda langsung ke UseGlass untuk analisis kode yang lebih mendalam.',
                    type: 'development'
                });
                break;
            case 'skills':
                setShowSkillSubmenu(prev => !prev);
                setShowStyleSubmenu(false);
                break;
            case 'styles':
                setShowStyleSubmenu(prev => !prev);
                setShowSkillSubmenu(false);
                break;
            case 'web':
                setShowToolsMenu(false);
                onToggleWebSearch && onToggleWebSearch(!isWebSearchEnabled);
                break;
        }
    };

    const handleSelectStyle = (styleId: string) => {
        const style = WRITING_STYLES.find(s => s.id === styleId);
        if (!style) return;
        setActiveStyle(styleId as GlassStyleId);
        setShowStyleSubmenu(false);
        setShowToolsMenu(false);
    };


    // Model Selector State
    const [selectedModel, setSelectedModel] = useState<ModelType>('sonnet');
    const [withReasoning, setWithReasoning] = useState(modeConfig.reasoning);

    useEffect(() => {
        setWithReasoning(modeConfig.reasoning);
        if (modeConfig.web && onToggleWebSearch) onToggleWebSearch(true);
    }, [mode, modeConfig.reasoning, modeConfig.web, onToggleWebSearch]);

    // Usage limits hook
    const { checkFeatureLimit, incrementFeatureUsage, isSubscribed, credits, softLimitReached, tokensUsed, maxCredits } = useTokenLimit();

    // Check convert limit before processing
    const checkConvertLimit = async (): Promise<boolean> => {
        const { exceeded } = await checkFeatureLimit('convert');
        if (exceeded) {
            setShowSubscriptionPopup(true);
            return false;
        }
        return true;
    };

    // Process transcription directly with AI and send to ChatInterface
    const processWithAI = () => {
        // This function is no longer used since we directly add attachments
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const apiUrl = getApiUrl();
    const navigate = useNavigate();

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuery(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
    };

    const [showImageGenInput, setShowImageGenInput] = useState(false);
    const [imageGenPrompt, setImageGenPrompt] = useState('');
    const [showVideoGenInput, setShowVideoGenInput] = useState(false);
    const [videoGenPrompt, setVideoGenPrompt] = useState('');
    const [showKnowledgeInput, setShowKnowledgeInput] = useState(false);
    const [knowledgeText, setKnowledgeText] = useState('');
    const [knowledgeTitle, setKnowledgeTitle] = useState('');

    // Feature Prompt Modal State
    const [selectedFeature, setSelectedFeature] = useState<{ label: string; icon: React.ReactNode; query: string; options?: { title: string; prompt: string }[] } | null>(null);
    const [featurePrompt, setFeaturePrompt] = useState('');

    const [greeting, setGreeting] = useState("What shall we think through?");

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'info' | 'development' | 'upgrade';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'development'
    });

    useEffect(() => {
        const phrases = [
            "What shall we think through?",
            "How can I help you today?",
            "What's on your mind?",
            "Let's explore something new.",
            "Ready to brainstorm?",
            "What are we working on?",
            "Let's build something great."
        ];
        setGreeting(phrases[Math.floor(Math.random() * phrases.length)]);
    }, []);

    const handleFeatureSelect = (feature: any) => {
        setSelectedFeature(feature);
        setFeaturePrompt('');
    };

    const handleFeatureSubmit = () => {
        if (!selectedFeature || !featurePrompt.trim()) return;

        // Construct the full query based on the feature template
        const fullQuery = `${selectedFeature.query} ${featurePrompt}`;

        // Close modal
        setSelectedFeature(null);

        // Send to streaming flow
        onSearch(fullQuery, [], undefined, undefined, selectedFeature.label);
    };

    // Guard media routing so UI phrases like "animasi hover" stay in Build Mode.
    const isWebBuildRequest = (text: string): boolean => {
        const lowerText = ` ${text.toLowerCase()} `;
        const webKeywords = [
            'landing page', 'website', 'web page', 'web app', ' web ', 'situs',
            'dashboard', 'admin panel', 'ui', 'component', 'komponen', 'halaman',
            'navbar', 'sidebar', 'hero section', 'card', 'bento grid', 'tailwind',
            'glassmorphism', 'pricing page', 'login page', 'auth page', 'frontend',
            'react', 'next.js', 'nextjs', 'html', 'css', 'jsx', 'tsx'
        ];
        return webKeywords.some(keyword => lowerText.includes(keyword));
    };

    // Detect if query is an image generation request
    const isImageRequest = (text: string): boolean => {
        if (isWebBuildRequest(text)) return false;
        const imageKeywords = [
            'buatkan gambar', 'buat gambar', 'generate image', 'create image',
            'gambarkan', 'draw', 'ilustrasi', 'illustration', 'make an image',
            'buat foto', 'generate a picture', 'make a picture'
        ];
        const lowerText = text.toLowerCase();
        return imageKeywords.some(keyword => lowerText.includes(keyword));
    };

    // Detect if query is a video generation request
    const isVideoRequest = (text: string): boolean => {
        if (isWebBuildRequest(text)) return false;
        const lowerText = text.toLowerCase();
        const explicitVideoPattern = /\b(buat|buatkan|bikin|bikinin|generate|ganerate|create|make|render)\b[\s\S]{0,40}\b(video|klip|clip|film|reel|short)\b/i;
        if (explicitVideoPattern.test(lowerText)) return true;
        const videoKeywords = [
            'buatkan video', 'buat video', 'generate video', 'create video',
            'bikin video', 'make a video', 'video animasi', 'animasi video',
            'animated video'
        ];
        return videoKeywords.some(keyword => lowerText.includes(keyword));
    };

    // Handle image generation via SumoPod gpt-image-1
    const handleImageGeneration = async (prompt: string) => {
        setIsProcessing(true);
        setProcessingMessage('Generating image with AI...');

        try {
            const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
            if (!apiKey) throw new Error('SumoPod API Key not configured');

            const response = await fetch('https://api.sumopod.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-image-1',
                    prompt,
                    n: 1,
                    size: '1024x1024',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;
                if (imageUrl) {
                    navigate('/chat', {
                        state: {
                            initialPrompt: prompt,
                            generatedImage: imageUrl.startsWith('http') ? imageUrl : `data:image/png;base64,${imageUrl}`
                        }
                    });
                    incrementFeatureUsage('convert');
                } else {
                    setAlertConfig({
                        isOpen: true,
                        title: 'Image Generation',
                        message: 'Maaf, tidak ada gambar yang dihasilkan. Sila coba lagi dengan prompt yang berbeda.',
                        type: 'info'
                    });
                }
            } else {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                setAlertConfig({
                    isOpen: true,
                    title: 'Generation Failed',
                    message: error.error?.message || error.error || 'Gagal menghasilkan gambar. Sila periksa koneksi atau kredit Anda.',
                    type: 'info'
                });
            }
        } catch (error) {
            
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    // Handle video generation
    const handleVideoGeneration = async (prompt: string) => {
        setIsProcessing(true);
        setProcessingMessage('Generating video with AI (this may take a minute)...');

        try {
            const response = await fetch(`${apiUrl}/api/generate-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, userId: user?.id }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.videoUrl) {
                    navigate('/chat', {
                        state: {
                            initialPrompt: prompt,
                            generatedVideo: data.videoUrl
                        }
                    });
                    incrementFeatureUsage('convert');
                } else {
                    setAlertConfig({
                        isOpen: true,
                        title: 'Video Generation',
                        message: 'Maaf, video sedang diproses atau gagal. Sila coba lagi nanti.',
                        type: 'info'
                    });
                }
            } else {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                setAlertConfig({
                    isOpen: true,
                    title: 'Generation Failed',
                    message: error.error || 'Gagal menghasilkan video. Sila periksa koneksi atau paket langganan Anda.',
                    type: 'info'
                });
            }
        } catch (error) {
            
            alert('Failed to generate video. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (query.trim()) {
                // Check if this is an image/video generation request
                if (isImageRequest(query)) {
                    handleImageGeneration(query);
                } else if (isVideoRequest(query)) {
                    handleVideoGeneration(query);
                } else {
                    const routingResult = routeGlassIntent(query, { webSearchConnected: true });
                    navigate('/chat', {
                        state: {
                            initialPrompt: query,
                            initialAttachments: attachments,
                            model: selectedModel,
                            reasoning: withReasoning || routingResult.selectedTool === 'search' || routingResult.selectedTool === 'omni',
                            glassMode: routingResult.selectedTool,
                            workflowMode: routingResult.selectedWorkflowMode,
                            glassStyle: routingResult.selectedStyle,
                            activeSkillId: routingResult.selectedSkill,
                            activeConnectorId: routingResult.selectedConnector === 'Web Search' ? 'web-search' : null,
                            canvasType: routingResult.canvasType,
                            routingResult,
                            autoMode: true,
                            autoSend: true
                        }
                    });
                }
            }
        }
    };

    // Time-based Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // File Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Check limit for non-image files (convert feature)
        if (!checkConvertLimit()) return;

        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            setIsProcessing(true);
            setProcessingMessage(`Processing ${file.name}...`);

            try {
                if (file.type === 'application/pdf') {
                    // Read PDF as base64 and send to SumoPod for text extraction
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
                    if (!apiKey) throw new Error('SumoPod API Key not configured');

                    const response = await fetch('https://api.sumopod.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: 'seed-2-0-pro-free',
                            messages: [{
                                role: 'user',
                                content: [
                                    { type: 'file', file: { filename: file.name, file_data: `data:application/pdf;base64,${base64}` } },
                                    { type: 'text', text: 'Extract all readable text content from this PDF document. Return only the extracted text, maintaining the original structure and formatting as much as possible.' }
                                ]
                            }],
                            max_tokens: 4096,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const extractedText = data.choices?.[0]?.message?.content || 'PDF content extracted';
                        setAttachments(prev => [...prev, {
                            type: 'file',
                            name: file.name,
                            content: extractedText,
                            mimeType: 'application/pdf'
                        }]);
                        incrementFeatureUsage('convert');
                    } else {
                        const errData = await response.json().catch(() => ({}));
                        alert(`PDF extraction failed: ${errData.error?.message || 'Unknown error'}`);
                    }
                } else if (file.type.startsWith('image/')) {
                    // Convert image to base64
                    const reader = new FileReader();
                    reader.onload = () => {
                        setAttachments(prev => [...prev, {
                            type: 'file',
                            name: file.name,
                            content: reader.result as string,
                            mimeType: file.type
                        }]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Text files
                    const text = await file.text();
                    setAttachments(prev => [...prev, {
                        type: 'file',
                        name: file.name,
                        content: text,
                        mimeType: file.type
                    }]);
                }
            } catch (error) {
                
            } finally {
                setIsProcessing(false);
                setProcessingMessage('');
            }
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Audio Upload Handler — SumoPod whisper-1
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!checkConvertLimit()) return;

        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setProcessingMessage('Transcribing audio with Whisper...');

        try {
            const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
            if (!apiKey) throw new Error('SumoPod API Key not configured');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.sumopod.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setAttachments(prev => [...prev, {
                    type: 'audio',
                    name: file.name,
                    content: data.text || 'Audio transcribed',
                }]);
                incrementFeatureUsage('convert');
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`Transcription failed: ${errData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            
            alert('Audio transcription failed. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
            if (audioInputRef.current) audioInputRef.current.value = '';
        }
    };

    // YouTube Transcript Handler — SumoPod seed-2-0-pro-free
    const handleYouTubeSubmit = async () => {
        if (!checkConvertLimit()) return;
        if (!youtubeUrl.trim()) return;

        setIsProcessing(true);
        setProcessingMessage('Analyzing YouTube video...');

        try {
            const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
            if (!apiKey) throw new Error('SumoPod API Key not configured');

            const response = await fetch('https://api.sumopod.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'seed-2-0-pro-free',
                    messages: [{
                        role: 'user',
                        content: `Please analyze and summarize this YouTube video. Provide key points and a detailed transcript/summary of the content: ${youtubeUrl}`
                    }],
                    max_tokens: 4096,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const summary = data.choices?.[0]?.message?.content || 'Could not analyze video';
                setAttachments(prev => [...prev, {
                    type: 'youtube',
                    name: `YouTube: ${youtubeUrl}`,
                    content: summary,
                }]);
                setYoutubeUrl('');
                setShowYouTubeInput(false);
                incrementFeatureUsage('convert');
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`YouTube analysis failed: ${errData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            
            alert('Failed to analyze YouTube video. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    // URL Content Handler — SumoPod seed-2-0-pro-free
    const handleUrlSubmit = async () => {
        if (!checkConvertLimit()) return;
        if (!urlInput.trim()) return;

        setIsProcessing(true);
        setProcessingMessage('Analyzing webpage content...');

        try {
            const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
            if (!apiKey) throw new Error('SumoPod API Key not configured');

            const response = await fetch('https://api.sumopod.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'seed-2-0-pro-free',
                    messages: [{
                        role: 'user',
                        content: `Please fetch, read, and extract the main text content from this webpage URL. Provide a clean, well-formatted version of the page content: ${urlInput}`
                    }],
                    max_tokens: 4096,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || 'Could not extract content';
                setAttachments(prev => [...prev, {
                    type: 'url',
                    name: urlInput,
                    content,
                }]);
                setUrlInput('');
                setShowUrlInput(false);
                incrementFeatureUsage('convert');
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`URL analysis failed: ${errData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            
            alert('Failed to analyze webpage. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    // Remove attachment
    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Handle Knowledge Base Embedding
    const handleEmbedDocument = async (text: string, title: string) => {
        setIsProcessing(true);
        setProcessingMessage('Embedding document to Knowledge Base...');
        try {
            // Mock user ID - in real app get from auth
            const userId = 'user_123';
            const response = await fetch(`${apiUrl}/api/embed-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, text, title })
            });
            const data = await response.json();
            if (response.ok) {
                setAlertConfig({
                    isOpen: true,
                    title: 'Knowledge Success',
                    message: `Berhasil menambahkan ${data.chunksProcessed} bagian informasi ke dalam basis pengetahuan Anda.`,
                    type: 'info'
                });
            } else {
                setAlertConfig({
                    isOpen: true,
                    title: 'Upload Failed',
                    message: 'Gagal mengupload dokumen: ' + data.error,
                    type: 'info'
                });
            }
        } catch (e) {
            
            alert('Error embedding document');
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    const suggestions = modeSuggestions[mode] || modeSuggestions.chat;

    return (
        <div className={cn(
            "w-full min-h-full flex flex-col items-center justify-center px-3 py-4 pt-10 md:p-6 md:pt-16 relative max-w-3xl mx-auto",
            className
        )}>
            {/* Hidden File Inputs */}
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.doc,.docx,image/*" onChange={handleFileUpload} className="hidden" multiple />
            <input ref={audioInputRef} type="file" accept="audio/*" capture="user" onChange={handleAudioUpload} className="hidden" />

            {/* Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-sm w-full relative overflow-hidden">
                            {/* Animated Background Mesh */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none" />

                            {/* Animated Waveform for Audio */}
                            {processingMessage.toLowerCase().includes('transcribing') || processingMessage.toLowerCase().includes('audio') ? (
                                <div className="flex items-end justify-center gap-1 h-20 mb-6">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 bg-gradient-to-t from-purple-600 via-indigo-500 to-blue-400 rounded-full"
                                            animate={{
                                                height: [12, 48 + Math.sin(i * 0.5) * 20, 12],
                                                scaleY: [1, 1.2, 1],
                                            }}
                                            transition={{
                                                duration: 0.6 + (i % 3) * 0.1,
                                                repeat: Infinity,
                                                delay: i * 0.08,
                                                ease: [0.4, 0, 0.2, 1]
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-25" />
                                    <div className="relative w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                    </div>
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">Processing</h3>
                            <p className="text-zinc-500 font-medium animate-pulse">{processingMessage}</p>

                            {/* Progress Indicator Line */}
                            <motion.div
                                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* YouTube Input Modal */}
            <AnimatePresence>
                {showYouTubeInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowYouTubeInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                    <Youtube className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">YouTube to Text</h3>
                                    <p className="text-xs text-zinc-500">Paste a YouTube video URL</p>
                                </div>
                            </div>
                            <input
                                type="url"
                                value={youtubeUrl}
                                onChange={e => setYoutubeUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowYouTubeInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleYouTubeSubmit}
                                    disabled={!youtubeUrl.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Extract Transcript
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Generation Input Modal */}
            <AnimatePresence>
                {showImageGenInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowImageGenInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-pink-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">Generate Image</h3>
                                    <p className="text-xs text-zinc-500">Describe the image you want to create</p>
                                </div>
                            </div>
                            <textarea
                                value={imageGenPrompt}
                                onChange={e => setImageGenPrompt(e.target.value)}
                                placeholder="A futuristic city with flying cars at sunset..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4 min-h-[100px] resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowImageGenInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowImageGenInput(false);
                                        handleImageGeneration(imageGenPrompt);
                                    }}
                                    disabled={!imageGenPrompt.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Generate
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Generation Input Modal */}
            <AnimatePresence>
                {showVideoGenInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowVideoGenInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Play className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">Generate Video</h3>
                                    <p className="text-xs text-zinc-500">Describe the video you want to create</p>
                                </div>
                            </div>
                            <textarea
                                value={videoGenPrompt}
                                onChange={e => setVideoGenPrompt(e.target.value)}
                                placeholder="A cinematic drone shot of a tropical island at sunset..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4 min-h-[100px] resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowVideoGenInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowVideoGenInput(false);
                                        handleVideoGeneration(videoGenPrompt);
                                    }}
                                    disabled={!videoGenPrompt.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Generate
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Knowledge Base Input Modal */}
            <AnimatePresence>
                {showKnowledgeInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowKnowledgeInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-lg"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">Add to Knowledge Base</h3>
                                    <p className="text-xs text-zinc-500">Embed text for semantic search (RAG)</p>
                                </div>
                            </div>

                            <input
                                type="text"
                                value={knowledgeTitle}
                                onChange={e => setKnowledgeTitle(e.target.value)}
                                placeholder="Document Title (Optional)"
                                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-3"
                            />

                            <textarea
                                value={knowledgeText}
                                onChange={e => setKnowledgeText(e.target.value)}
                                placeholder="Paste the text content you want to embed here..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4 min-h-[150px] resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowKnowledgeInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowKnowledgeInput(false);
                                        handleEmbedDocument(knowledgeText, knowledgeTitle || "User Note");
                                    }}
                                    disabled={!knowledgeText.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Embed Document
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feature Prompt Modal Removed - Replaced with Inline Dropdown */}

            {/* URL Input Modal */}
            <AnimatePresence>
                {showUrlInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowUrlInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <LinkIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">URL to Text</h3>
                                    <p className="text-xs text-zinc-500">Paste any webpage URL</p>
                                </div>
                            </div>
                            <input
                                type="url"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                placeholder="https://example.com/article"
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none mb-4"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowUrlInput(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUrlSubmit}
                                    disabled={!urlInput.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Fetch Content
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center Content Group */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center w-full z-10 font-sans"
            >
                {/* Brand */}
                {!compact && (
                    <div className="mb-8 flex items-center justify-center gap-3 text-center">
                        <span className="flex h-14 w-14 items-center justify-center overflow-visible bg-transparent">
                            <img src="/useglass-logo.png" alt="UseGlass AI" className="h-14 w-14 object-contain" />
                        </span>
                        <span className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 md:text-5xl">UseGlass</span>
                    </div>
                )}

                {/* Main Input Card — Clean Layout */}
                <div className={cn(
                    "w-full max-w-[760px] bg-[#f4f4f3] transition-all duration-200 relative",
                    attachments.length > 0 || query.length > 80 || query.includes('\n') ? "rounded-[28px]" : "rounded-[999px]",
                    isFocused
                        ? "shadow-[0_10px_30px_-22px_rgba(20,20,19,0.55)] ring-1 ring-stone-200/70"
                        : "shadow-[0_4px_18px_-16px_rgba(20,20,19,0.35)] ring-1 ring-transparent"
                )}>


                    {/* Web Search & Deep Research Indicators */}
                    <AnimatePresence mode="wait">
                        {false && (mode !== 'chat' || activeWorkflowMode !== 'think' || activeStyle !== 'normal' || !!activeSkill || !!activeConnector || !!activeCanvasType || isWebSearchEnabled || withReasoning) && (
                        <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto px-4 pt-2">
                            {mode !== 'chat' && <button
                                type="button"
                                onClick={() => onModeChange?.('chat')}
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
                                    activeModeOption.color
                                )}
                                title="Reset to Glass Chat"
                            >
                                <ActiveModeIcon size={12} />
                                {activeModeOption.label}
                                {mode !== 'chat' && <X size={12} className="ml-1 opacity-70" />}
                            </button>}
                            {activeStyle !== 'normal' && <button
                                type="button"
                                onClick={() => setShowModeToolsMenu(true)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
                                title={activeWorkflow.flow}
                            >
                                <Brain size={12} />
                                {activeWorkflow.label}
                            </button>}
                            {activeWorkflowMode !== 'think' && <button
                                type="button"
                                onClick={() => setShowModeToolsMenu(true)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
                                title={(GLASS_STYLES.find(s => s.id === activeStyle) || GLASS_STYLES[0]).description}
                            >
                                <Wand2 size={12} />
                                {(GLASS_STYLES.find(s => s.id === activeStyle) || GLASS_STYLES[0]).label}
                            </button>}
                            {activeCanvasType && (
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                                    <LayoutTemplate size={12} />
                                    Canvas: {activeCanvasType}
                                </span>
                            )}                            {activeSkill && (
                                <button
                                    type="button"
                                    onClick={() => onSkillChange?.(null)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
                                    title={activeSkill.instructions}
                                >
                                    <SquareTerminal size={12} />
                                    Skill: {activeSkill.name}
                                    <X size={12} className="ml-1" />
                                </button>
                            )}
                            {activeConnector && (
                                <button
                                    type="button"
                                    onClick={() => onConnectorChange?.(null)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                                    title={activeConnector.permissions}
                                >
                                    {React.createElement(activeConnector.icon, { size: 12 })}
                                    Connector: {activeConnector.name}
                                    <X size={12} className="ml-1" />
                                </button>
                            )}
                            {isWebSearchEnabled && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md text-xs font-medium">
                                        <Globe size={12} />
                                        Web Search On
                                        <button onClick={() => onToggleWebSearch && onToggleWebSearch(false)} className="ml-1 hover:text-stone-800">
                                            <X size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {withReasoning && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 border border-purple-100/50 rounded-md text-xs font-medium">
                                        <SharkIcon size={12} />
                                        Deep Research On
                                        <button onClick={() => setWithReasoning(false)} className="ml-1 hover:text-purple-800">
                                            <X size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                        )}
                    </AnimatePresence>

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-3 px-3 pt-3">
                            {attachments.map((att, i) => (
                                <div key={i} className={cn("relative shrink-0", att.mimeType?.startsWith('image/') ? "rounded-xl border border-zinc-200 bg-white p-1 shadow-sm" : "flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm")}>
                                    {att.mimeType?.startsWith('image/') ? (
                                        <img src={att.content} alt={att.name} className="h-28 w-28 rounded-lg object-cover" />
                                    ) : (
                                        <>
                                            {att.type === 'youtube' && <Youtube size={14} className="text-stone-500" />}
                                            {att.type === 'audio' && <Mic size={14} className="text-stone-500" />}
                                            {att.type === 'url' && <LinkIcon size={14} className="text-stone-500" />}
                                            {att.type === 'file' && <FileText size={14} className="text-stone-500" />}
                                            <span className="max-w-[100px] truncate font-medium text-stone-700 sm:max-w-[150px]">{att.name}</span>
                                        </>
                                    )}
                                    <button onClick={() => removeAttachment(i)} className={cn(att.mimeType?.startsWith('image/') ? "absolute -right-2 -top-2 z-10 rounded-full bg-zinc-950 p-1.5 text-white shadow-md transition-all hover:bg-zinc-700" : "text-stone-400 hover:text-red-500")}>
                                        <X size={att.mimeType?.startsWith('image/') ? 12 : 14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Text Area */}
                    <div className={cn(
                        attachments.length > 0 || query.length > 80 || query.includes('\n')
                            ? "px-4 pt-4 pb-1 sm:px-6 sm:pt-4 sm:pb-1"
                            : "flex h-[58px] items-center pl-12 pr-24 sm:pl-16 sm:pr-44"
                    )}>
                        <textarea
                            value={query}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="What do you want to know?"
                            autoCapitalize="sentences"
                            autoCorrect="on"
                            spellCheck="true"
                            enterKeyHint="send"
                            className="block h-[22px] max-h-44 min-h-[22px] w-full resize-none overflow-y-auto border-none bg-transparent py-0 text-[16px] font-medium leading-[22px] text-stone-800 placeholder-stone-500 focus:outline-none break-words scrollbar-none"
                            style={{ height: '22px' }}
                        />
                    </div>

                    {/* Bottom Bar — Clean Layout */}
                    <div className={cn(
                        "pointer-events-none flex items-center justify-between px-4",
                        attachments.length > 0 || query.length > 80 || query.includes('\n')
                            ? "pb-3 pt-1"
                            : "absolute inset-x-0 bottom-1/2 translate-y-1/2"
                    )}>
                        {/* Left: attachments and tool mode buttons */}
                        <div className="pointer-events-auto flex items-center gap-1 relative" ref={toolsMenuRef}>
                            <button
                                onClick={() => { setShowToolsMenu(!showToolsMenu); setShowModeToolsMenu(false); }}
                                className={cn(
                                    "w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-all [touch-action:manipulation]",
                                    showToolsMenu ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 active:bg-white/90 hover:text-stone-900 hover:bg-white/80"
                                )}
                                title="Attach menu"
                            >
                                <Plus size={20} strokeWidth={1.9} />
                            </button>

                            {false && showModeToolsMenu && (
                                <div className="absolute left-0 top-full mt-3 z-[80] sm:left-[-8px]">
                                    <div className="w-[92vw] max-w-[360px] sm:w-[360px] max-h-[42vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-stone-200 rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.16)] animate-in fade-in slide-in-from-top-2 duration-150 py-2">
                                        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Advanced overrides</div>
                                        <div className="mx-3 mb-2 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] leading-4 text-sky-700">
                                            Auto Mode aktif. Override hanya kalau mau paksa mode tertentu.
                                        </div>
                                        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Tool override</div>
                                        <div className="flex flex-col gap-1 px-1.5">
                                            {modeOptions.map((toolMode) => {
                                                const ToolIcon = toolMode.icon;
                                                const selected = toolMode.id === mode;
                                                return (
                                                    <button key={toolMode.id} onClick={() => { onModeChange?.(toolMode.id); setWithReasoning(toolMode.id === 'search' || toolMode.id === 'agents' || toolMode.id === 'omni' || toolMode.id === 'documents'); if ((toolMode.id === 'search' || toolMode.id === 'omni') && onToggleWebSearch) onToggleWebSearch(true); setShowModeToolsMenu(false); }} className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition", selected ? "bg-stone-950 text-white" : "text-stone-700 hover:bg-stone-50")}>
                                                        <ToolIcon size={16} className="mt-0.5 shrink-0" strokeWidth={1.8} />
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-semibold">{toolMode.label}</span>
                                                            <span className={cn("block text-[11px] leading-4", selected ? "text-white/70" : "text-stone-500")}>{modeDescriptions[toolMode.id]}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="my-2 h-px bg-stone-100 mx-3" />
                                        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-sky-600">Workflow Modes</div>
                                        <div className="flex flex-col gap-1 px-1.5">
                                            {WORKFLOW_MODES.map((workflow) => {
                                                const selected = workflow.id === activeWorkflowMode;
                                                return (
                                                    <button key={workflow.id} onClick={() => { setActiveWorkflowMode(workflow.id); setShowModeToolsMenu(false); }} className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition", selected ? "bg-sky-50 text-sky-800 ring-1 ring-sky-100" : "text-stone-700 hover:bg-stone-50")} title={workflow.flow}>
                                                        <Brain size={16} className="mt-0.5 shrink-0" />
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-semibold">{workflow.label}</span>
                                                            <span className="block text-[11px] leading-4 text-stone-500">{workflow.description}</span>
                                                            <span className="mt-1 block text-[10px] text-stone-400">{workflow.flow}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="my-2 h-px bg-stone-100 mx-3" />
                                        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-orange-600">Glass Styles</div>
                                        <div className="flex flex-col gap-1 px-1.5">
                                            {GLASS_STYLES.map((style) => {
                                                const selected = style.id === activeStyle;
                                                return (
                                                    <button key={style.id} onClick={() => { setActiveStyle(style.id); setShowModeToolsMenu(false); }} className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition", selected ? "bg-orange-50 text-orange-800 ring-1 ring-orange-100" : "text-stone-700 hover:bg-stone-50")} title={style.prompt}>
                                                        <Wand2 size={16} className="mt-0.5 shrink-0" />
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-semibold">{style.label}</span>
                                                            <span className="block text-[11px] leading-4 text-stone-500">{style.description}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                            <button type="button" onClick={() => setAlertConfig({ isOpen: true, title: 'My Styles', message: 'Create My Style is coming soon. For now, use built-in Glass Styles or keep a local style instruction in your prompt.', type: 'development' })} className="mx-1.5 rounded-xl border border-dashed border-stone-200 px-3 py-2 text-left text-xs text-stone-500 hover:bg-stone-50">
                                                Create My Style <span className="ml-1 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px]">Coming soon</span>
                                            </button>
                                        </div>

                                        <div className="my-2 h-px bg-stone-100 mx-3" />
                                        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-violet-500">Skill override</div>
                                        <div className="flex flex-col gap-1 px-1.5">
                                            {BUILT_IN_GLASS_SKILLS.map((skill) => {
                                                const selected = skill.id === activeSkillId;
                                                return (
                                                    <button key={skill.id} onClick={() => { onSkillChange?.(selected ? null : skill.id); setShowModeToolsMenu(false); }} className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition", selected ? "bg-violet-50 text-violet-800 ring-1 ring-violet-100" : "text-stone-700 hover:bg-stone-50")} title={skill.instructions}>
                                                        <SquareTerminal size={16} className="mt-0.5 shrink-0" />
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-semibold">{skill.name}</span>
                                                            <span className="block text-[11px] leading-4 text-stone-500">{skill.description}</span>
                                                            <span className="mt-1 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">{skill.category}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="my-2 h-px bg-stone-100 mx-3" />
                                        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Connector override</div>
                                        <div className="flex flex-col gap-1 px-1.5">
                                            {GLASS_CONNECTORS.map((connector) => {
                                                const ConnectorIcon = connector.icon;
                                                const selected = connector.id === activeConnectorId;
                                                return (
                                                    <button key={connector.id} onClick={() => { onConnectorChange?.(selected ? null : connector.id); setShowModeToolsMenu(false); }} className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition", selected ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "text-stone-700 hover:bg-stone-50")} title={connector.permissions}>
                                                        <ConnectorIcon size={16} className="mt-0.5 shrink-0" />
                                                        <span className="min-w-0">
                                                            <span className="flex items-center gap-2 text-sm font-semibold">{connector.name}<span className={cn("rounded-full px-1.5 py-0.5 text-[9px] uppercase", connector.status === 'connected' ? "bg-emerald-100 text-emerald-700" : connector.status === 'coming soon' ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500")}>{connector.status}</span></span>
                                                            <span className="block text-[11px] leading-4 text-stone-500">{connector.description}</span>
                                                            <span className="mt-1 block text-[10px] text-stone-400">{connector.capabilities.join(', ')}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showToolsMenu && (
                                <div className="absolute bottom-full left-0 mb-3 z-50">
                                    <div className="w-[85vw] max-w-[224px] sm:w-56 bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 py-1.5">
                                        <button type="button" onClick={() => setAutoPilot((value) => !value)} className="mx-1.5 mb-1 flex w-[calc(100%-12px)] items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] text-stone-700 transition-colors hover:bg-stone-50">
                                            <span>Auto Pilot</span>
                                            <span className={cn("relative h-4 w-7 rounded-full transition-colors duration-300", autoPilot ? "bg-blue-500" : "bg-stone-200")}>
                                                <span className={cn("absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-300", autoPilot && "translate-x-3")} />
                                            </span>
                                        </button>
                                        {softLimitReached && (
                                            <div className="mx-1.5 mb-1 flex w-[calc(100%-12px)] items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-stone-500">
                                                <AlertTriangle size={14} /> {credits} credits left
                                            </div>
                                        )}
                                        <div className="mx-3 mb-1 h-px bg-stone-100" />
                                        {TOOL_GROUPS.map((group, groupIdx) => (
                                            <React.Fragment key={groupIdx}>
                                                <div className="flex flex-col">
                                                    {group.map((tool) => {
                                                        const Icon = tool.icon;
                                                        const isWebActive = tool.id === 'web' && isWebSearchEnabled;
                                                        const isStyleActive = tool.id === 'styles' && !!activeStyle;
                                                        const isActive = isWebActive || isStyleActive;
                                                        return (
                                                            <button key={tool.id} onClick={() => handleToolSelect(tool.id)} className={cn("w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-colors mx-1.5 rounded-lg text-left", (tool.id === 'styles' && showStyleSubmenu) || (tool.id === 'skills' && showSkillSubmenu) ? "bg-stone-100" : "hover:bg-stone-50")} style={{ width: 'calc(100% - 12px)' }}>
                                                                <div className={cn("flex justify-center items-center w-5", isActive ? "text-blue-500" : "text-stone-700")}><Icon size={16} strokeWidth={1.8} /></div>
                                                                <span className={cn("flex-1", isActive ? "text-blue-600 font-medium" : "text-stone-700")}>{tool.label}</span>
                                                                {tool.id === 'styles' || tool.id === 'skills' || (tool as any).hasChevron ? <ChevronRight size={14} className="text-stone-400 ml-auto" strokeWidth={2} /> : isWebActive ? <Check size={16} className="text-blue-500 ml-auto" strokeWidth={2.5} /> : null}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {groupIdx < TOOL_GROUPS.length - 1 && <div className="h-px bg-stone-100 my-1.5 mx-3" />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Right: Model Name, Voice, Send */}
                        <div className="pointer-events-auto flex items-center gap-1.5">
                            {/* Model Name Label */}
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                                disabled={isProcessing}
                                withReasoning={withReasoning}
                                onReasoningToggle={() => setWithReasoning(!withReasoning)}
                                isSubscribed={isSubscribed}
                            >
                                <button className="flex items-center gap-1.5 px-2 py-1.5 text-stone-500 hover:text-stone-800 transition-colors text-[13px] font-semibold">
                                    {query.trim() ? (
                                        <Zap size={16} className="text-zinc-950" fill="currentColor" strokeWidth={2.2} />
                                    ) : <span>
                                        {(() => {
                                            const names: Record<string, string> = {
                                                'sonnet': 'Storm',
                                                'sonar': 'Storm',
                                                'opus': 'Pro',
                                                'philos': 'Glass Philos',
                                                'haiku': 'Haiku',
                                                'thinking': 'Thinking',
                                            };
                                            const name = names[selectedModel] ?? getModelDisplayName(selectedModel);
                                            return (
                                                <span className="flex items-center gap-1">
                                                    {name}
                                                    {selectedModel === 'philos' && (
                                                        <span className="px-1.5 py-0.5 rounded-full border border-stone-200 text-stone-400 text-[9px] font-medium bg-stone-50">
                                                            Soon
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        })()}
                                    </span>}
                                    {!query.trim() && <ChevronDown size={12} strokeWidth={2.5} />}
                                </button>
                            </ModelSelector>

                            {/* Voice / Send Button */}
                            <motion.button
                                onClick={() => {
                                    if (query.trim() || attachments.length > 0) {
                                        if (isImageRequest(query)) handleImageGeneration(query);
                                        else if (isVideoRequest(query)) handleVideoGeneration(query);
                                        else {
                                            const routingResult = routeGlassIntent(query, { webSearchConnected: true });
                                            navigate('/chat', { state: { initialPrompt: query, initialAttachments: attachments, model: selectedModel, reasoning: withReasoning || routingResult.selectedTool === 'search' || routingResult.selectedTool === 'omni', glassMode: routingResult.selectedTool, workflowMode: routingResult.selectedWorkflowMode, glassStyle: routingResult.selectedStyle, activeSkillId: routingResult.selectedSkill, activeConnectorId: routingResult.selectedConnector === 'Web Search' ? 'web-search' : null, canvasType: routingResult.canvasType, routingResult, autoMode: true, autoSend: true } });
                                        }
                                    } else {
                                        setShowDictation(true);
                                    }
                                }}
                                disabled={isProcessing}
                                whileTap={{ scale: 0.92 }}
                                className="flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 [touch-action:manipulation]"
                                title={query.trim() || attachments.length > 0 ? "Send prompt" : "Voice input"}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {query.trim() || attachments.length > 0 ? (
                                        <motion.span key="send" initial={{ opacity: 0, scale: 0.65, rotate: -45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.65, rotate: 45 }} transition={{ type: 'spring', stiffness: 420, damping: 24 }}>
                                            <ArrowUp size={18} strokeWidth={2.5} />
                                        </motion.span>
                                    ) : (
                                        <motion.span key="voice" initial={{ opacity: 0, scale: 0.65, rotate: 45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.65, rotate: -45 }} transition={{ type: 'spring', stiffness: 420, damping: 24 }}>
                                            <AudioLines size={18} strokeWidth={1.8} />
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>

                            {/* Send Button - Only visible when typing or attachments added */}
                            <AnimatePresence>
                                {false && (query.trim() || attachments.length > 0) && (
                                    <motion.button
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        onClick={() => {
                                            if (isImageRequest(query)) handleImageGeneration(query);
                                            else if (isVideoRequest(query)) handleVideoGeneration(query);
                                            else {
                                                const routingResult = routeGlassIntent(query, { webSearchConnected: true });
                                                navigate('/chat', { state: { initialPrompt: query, initialAttachments: attachments, model: selectedModel, reasoning: withReasoning || routingResult.selectedTool === 'search' || routingResult.selectedTool === 'omni', glassMode: routingResult.selectedTool, workflowMode: routingResult.selectedWorkflowMode, glassStyle: routingResult.selectedStyle, activeSkillId: routingResult.selectedSkill, activeConnectorId: routingResult.selectedConnector === 'Web Search' ? 'web-search' : null, canvasType: routingResult.canvasType, routingResult, autoMode: true, autoSend: true } });
                                            }
                                        }}
                                        disabled={isProcessing}
                                        className={cn(
                                            "w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                            isProcessing
                                                ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                                                : "bg-[#E5694A] hover:bg-[#D55839] text-white"
                                        )}
                                    >
                                        <ArrowUp size={16} strokeWidth={2.5} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Suggestions Pills */}
                {!compact && <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 mt-3 md:mt-4 max-w-3xl">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (suggestion.action) suggestion.action();
                                setSelectedFeature(selectedFeature?.label === suggestion.label ? null : suggestion as any);
                                setFeaturePrompt('');
                            }}
                            className={cn(
                                "flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-full border text-[12px] md:text-[13px] font-medium transition-colors shadow-sm",
                                selectedFeature?.label === suggestion.label
                                    ? "bg-stone-100 border-stone-300 text-stone-800"
                                    : "bg-white border-stone-200 hover:bg-stone-50 text-stone-600"
                            )}
                        >
                            {suggestion.icon}
                            {suggestion.label}
                        </button>
                    ))}
                </div>}

                {/* Feature Options Dropdown */}
                <AnimatePresence>
                    {selectedFeature && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-3xl mt-3 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                                <div className="flex items-center gap-2 text-stone-700 text-sm font-medium">
                                    {selectedFeature.icon}
                                    {selectedFeature.label}
                                </div>
                                <button onClick={() => setSelectedFeature(null)} className="text-stone-400 hover:text-stone-600 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex flex-col">
                                {(selectedFeature.options || [
                                    { title: selectedFeature.query || selectedFeature.label, prompt: selectedFeature.query || selectedFeature.label },
                                    { title: `Buat versi lengkap: ${selectedFeature.label}`, prompt: `${selectedFeature.query || selectedFeature.label} secara lengkap dan terstruktur.` },
                                    { title: `Buat outline untuk: ${selectedFeature.label}`, prompt: `Buat outline untuk ${selectedFeature.query || selectedFeature.label}.` },
                                    { title: `Berikan contoh praktis: ${selectedFeature.label}`, prompt: `Berikan contoh praktis untuk ${selectedFeature.query || selectedFeature.label}.` },
                                    { title: `Buat langkah berikutnya: ${selectedFeature.label}`, prompt: `Buat langkah berikutnya untuk ${selectedFeature.query || selectedFeature.label}.` },
                                ]).map((opt: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setQuery(opt.prompt);
                                            setSelectedFeature(null);
                                        }}
                                        className="text-left px-4 py-3 text-[14px] text-stone-600 hover:bg-stone-50 border-b border-stone-100 last:border-0 flex items-center justify-between group transition-colors"
                                    >
                                        <span>{opt.title}</span>
                                        <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>


            {/* Loading Overlay removed - using the one at line ~447 with improved audio waveform animation */}

            {/* Subscription Popup */}
            <SubscriptionPopup
                isOpen={showSubscriptionPopup}
                onClose={() => setShowSubscriptionPopup(false)}
                tokensUsed={tokensUsed}
                tokensLimit={maxCredits}
            />

            <VoiceDictationModal
                isOpen={showDictation}
                onClose={() => setShowDictation(false)}
                onInsert={(text) => {
                    setQuery((prev) => prev ? prev + ' ' + text : text);
                }}
            />

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

        </div>
    );
}








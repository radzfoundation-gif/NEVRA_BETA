import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Plus, X, FileText, Camera, Image as ImageIcon,
    ArrowUp, Globe, Paperclip, ChevronDown, Mic,
    Code2, Target, Sparkles, PenLine, BookOpen, AudioLines, Search, Square, Wrench, Check, Brain, Palette, Folder, Github, Plug, SquareTerminal, ChevronRight, Wand2, Play, MessageSquare, Bot, LayoutTemplate, AlertTriangle, Zap
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

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
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import { FREE_TOKEN_LIMIT } from '@/lib/tokenLimit';
import { ParsedDocument } from '@/lib/documentParser';
import { AppMode } from '@/lib/modeDetector';
import { BUILT_IN_GLASS_SKILLS, GLASS_CONNECTORS, WORKFLOW_MODES, GLASS_STYLES, WorkflowModeId, GlassStyleId } from '@/components/ResearchWelcome';
import ModelSelector, { ModelType } from '@/components/ui/ModelSelector';
import VoiceDictationModal from './VoiceDictationModal';
import FileUploadButton from './FileUploadButton';
import AlertModal from '@/components/ui/AlertModal';
import { getSkills, UserSkill } from '@/lib/skillsApi';
import { useUser } from '@/lib/authContext';
import { getModelDisplayName } from '@/lib/ai';
import type { GlassRoutingResult } from '@/lib/glassAutoRouter';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type GlassToolMode = 'chat' | 'search' | 'agents' | 'builder' | 'code' | 'omni' | 'documents';

interface ChatInputProps {
    input: string;
    setInput: (value: string | ((prev: string) => string)) => void;
    handleSend: (deepDive?: boolean) => void;
    handleStop?: () => void;
    isTyping: boolean;
    attachedImages: string[];
    removeImage: (index: number) => void;
    appMode: AppMode;
    isMobile: boolean;
    isSubscribed: boolean;
    tokensUsed: number;
    enableWebSearch: boolean;
    setEnableWebSearch: (enabled: boolean) => void;
    setShowQuiz: (show: boolean) => void;
    setShowNotes: (show: boolean) => void;
    setShowDashboard: (show: boolean) => void;
    setShowFlashcards: (show: boolean) => void;
    setShowVoiceCall: (show: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    documentInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleCameraCapture: () => void;
    setUploadedDocument: (doc: ParsedDocument | null) => void;
    setShowDocumentViewer: (show: boolean) => void;
    uploadedDocument: ParsedDocument | null;
    messagesLength: number;
    deepDiveRemaining?: number;
    toggleCanvas?: () => void;
    // New Props for Controlled State
    selectedModel: ModelType;
    onModelChange: (model: ModelType) => void;
    withReasoning: boolean;
    setWithReasoning: (enabled: boolean) => void;
    comparisonMode?: boolean;
    onComparisonModeToggle?: (enabled: boolean) => void;
    // New Props for File Upload
    attachedFiles?: File[];
    onFilesSelected?: (files: File[]) => void;
    removeFile?: (index: number) => void;
    // Deep Research
    deepResearchMode?: boolean;
    onToggleDeepResearch?: (enabled: boolean) => void;
    // Feature callbacks
    onOpenGitHub?: () => void;
    onOpenConnectors?: () => void;
    onAddToProject?: () => void;
    // Style — controlled from parent
    activeStyle: string | null;
    onStyleChange: (style: string | null) => void;
    activeToolMode?: GlassToolMode;
    onToolModeChange?: (mode: GlassToolMode) => void;
    activeSkillId?: string | null;
    onSkillChange?: (skillId: string | null) => void;
    activeConnectorId?: string | null;
    onConnectorChange?: (connectorId: string | null) => void;
    activeWorkflowMode?: WorkflowModeId;
    onWorkflowModeChange?: (mode: WorkflowModeId) => void;
    activeCanvasType?: 'web' | 'document' | 'code' | 'presentation' | 'general' | null;
    routingResult?: GlassRoutingResult | null;
    lowCredits?: boolean;
    creditBalance?: number;
}

// Tool groups for the segmented + dropdown
const TOOL_GROUPS = [
    [
        { id: 'upload_file', label: 'Add files or photos', icon: Paperclip },
        { id: 'camera', label: 'Take a screenshot', icon: Camera },
        { id: 'image_gen', label: 'Generate Image', icon: ImageIcon, hasChevron: true },
        { id: 'video_gen', label: 'Generate Video', icon: Play, hasChevron: true },
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

// Quick action pills
const QUICK_ACTIONS = [
    { id: 'code', label: 'Code', icon: Code2 },
    { id: 'strategize', label: 'Strategize', icon: Target },
    { id: 'create', label: 'Create', icon: Sparkles },
    { id: 'write', label: 'Write', icon: PenLine },
    { id: 'learn', label: 'Learn', icon: BookOpen },
];

/** Short labels for bundled model presets; OpenRouter slugs fall back via getModelDisplayName. */
const SHORT_MODEL_LABELS: Record<string, string> = {
    'sonar': 'Storm',
    'sonnet': 'Storm',
    'opus': 'Pro',
    'haiku': 'Haiku',
    'philos': 'Glass Philos',
    'thinking': 'Thinking',
};

const ChatInput: React.FC<ChatInputProps> = ({
    input,
    setInput,
    handleSend,
    handleStop,
    isTyping,
    attachedImages,
    removeImage,
    appMode,
    isMobile,
    isSubscribed,
    tokensUsed,
    enableWebSearch,
    setEnableWebSearch,
    setShowQuiz,
    setShowNotes,
    setShowDashboard,
    setShowFlashcards,
    setShowVoiceCall,
    fileInputRef,
    documentInputRef,
    handleFileChange,
    handleCameraCapture,
    setUploadedDocument,
    setShowDocumentViewer,
    uploadedDocument,
    messagesLength,
    deepDiveRemaining = 2,
    toggleCanvas,
    selectedModel,
    onModelChange,
    withReasoning,
    setWithReasoning,
    comparisonMode,
    onComparisonModeToggle,
    attachedFiles = [],
    onFilesSelected,
    removeFile,
    deepResearchMode = false,
    onToggleDeepResearch,
    activeStyle,
    onStyleChange,
    activeToolMode = 'chat',
    onToolModeChange,
    activeSkillId = null,
    onSkillChange,
    activeConnectorId = null,
    onConnectorChange,
    activeWorkflowMode = 'think',
    onWorkflowModeChange,
    activeCanvasType = null,
    routingResult = null,
    lowCredits = false,
    creditBalance = 0,
}) => {

    const toolModeConfig: Record<GlassToolMode, { label: string; icon: React.ElementType; placeholder: string; color: string }> = {
        chat: { label: 'Glass Chat', icon: MessageSquare, placeholder: 'How can I help you today?', color: 'bg-zinc-950 text-white border-zinc-900' },
        search: { label: 'Glass Search', icon: Search, placeholder: 'Ask a research question...', color: 'bg-blue-50 text-blue-700 border-blue-100' },
        agents: { label: 'Glass Agents', icon: Bot, placeholder: 'Describe the agent task...', color: 'bg-violet-50 text-violet-700 border-violet-100' },
        builder: { label: 'Glass Builder', icon: LayoutTemplate, placeholder: 'Describe the UI or page to build...', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
        code: { label: 'Glass Code', icon: Code2, placeholder: 'Paste code, error logs, or coding task...', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        omni: { label: 'Glass Omni', icon: Sparkles, placeholder: 'Describe the full workflow you want...', color: 'bg-orange-50 text-orange-700 border-orange-100' },
        documents: { label: 'Glass Documents', icon: FileText, placeholder: 'Ask about a document...', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    };
    const activeTool = toolModeConfig[activeToolMode] || toolModeConfig.chat;
    const ActiveToolIcon = activeTool.icon;
    const activeSkill = BUILT_IN_GLASS_SKILLS.find(skill => skill.id === activeSkillId || skill.name === activeSkillId) || null;
    const activeConnector = GLASS_CONNECTORS.find(connector => connector.id === activeConnectorId || connector.name === activeConnectorId) || null;
    const activeWorkflow = WORKFLOW_MODES.find(workflow => workflow.id === activeWorkflowMode) || WORKFLOW_MODES[0];
    const activeGlassStyleConfig = GLASS_STYLES.find(style => style.id === activeStyle) || GLASS_STYLES[0];

    const { credits } = useTokenLimit();
    const { settings, isLoaded: settingsLoaded } = useSettings();
    const navigate = useNavigate();
    const { user } = useUser();
    const [showDictation, setShowDictation] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [autoPilot, setAutoPilot] = useState(true);
    const [showStyleSubmenu, setShowStyleSubmenu] = useState(false);
    const [showSkillSubmenu, setShowSkillSubmenu] = useState(false);
    const [showVisualSubmenu, setShowVisualSubmenu] = useState<'image' | 'video' | null>(null);
    const [userSkills, setUserSkills] = useState<Array<{id: string; name: string; enabled: boolean; system_prompt: string}>>([]);

    // Load skills from Supabase
    useEffect(() => {
        if (!user?.id) return;
        getSkills(user.id)
            .then(data => setUserSkills(data.map(s => ({ id: s.id, name: s.name, enabled: s.enabled, system_prompt: s.system_prompt }))))
            .catch(() => {});
    }, [user?.id]);

    const [isFocused, setIsFocused] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const combinedInputRef = useRef<HTMLInputElement>(null);
    const toolsMenuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // GlassSync handles model routing automatically - no manual deep dive model check needed
    const isDeepDiveModel = false;

    // Close tools menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setShowToolsMenu(false);
                setShowStyleSubmenu(false);
                setShowSkillSubmenu(false);
                setShowVisualSubmenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-collapse when input is cleared
    useEffect(() => {
        if (!input && textareaRef.current) {
            textareaRef.current.style.height = '28px';
        }
    }, [input]);

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
                cameraInputRef.current?.click();
                break;
            case 'image_gen':
                setShowVisualSubmenu(showVisualSubmenu === 'image' ? null : 'image');
                setShowSkillSubmenu(false);
                setShowStyleSubmenu(false);
                break;
            case 'video_gen':
                setShowVisualSubmenu(showVisualSubmenu === 'video' ? null : 'video');
                setShowSkillSubmenu(false);
                setShowStyleSubmenu(false);
                break;
            case 'project':
                setShowToolsMenu(false);
                setAlertConfig({ isOpen: true, title: 'Projects', message: 'UseGlass Workspace akan segera hadir! Nantikan fitur kolaborasi proyek yang lebih canggih.', type: 'development' });
                break;
            case 'github':
                setShowToolsMenu(false);
                setAlertConfig({ isOpen: true, title: 'GitHub Integration', message: 'Hubungkan repositori GitHub Anda langsung ke UseGlass untuk analisis kode yang lebih mendalam.', type: 'development' });
                break;
            case 'skills':
                setShowSkillSubmenu(prev => !prev);
                setShowStyleSubmenu(false);
                setShowVisualSubmenu(null);
                break;
            case 'styles':
                setShowStyleSubmenu(prev => !prev);
                setShowSkillSubmenu(false);
                setShowVisualSubmenu(null);
                break;
            case 'web':
                setShowToolsMenu(false);
                setEnableWebSearch(!enableWebSearch);
                break;
        }
    };

    const WRITING_STYLES = [
        { id: 'normal', label: 'Normal', prompt: '' },
        { id: 'learning', label: 'Learning', prompt: 'Explain in a clear, educational way with examples.' },
        { id: 'concise', label: 'Concise', prompt: 'Be brief and to the point. No fluff.' },
        { id: 'explanatory', label: 'Explanatory', prompt: 'Explain thoroughly with context and reasoning.' },
        { id: 'formal', label: 'Formal', prompt: 'Use formal, professional language.' },
    ];

    const handleSelectStyle = (styleId: string) => {
        const style = WRITING_STYLES.find(s => s.id === styleId);
        if (!style) return;
        onStyleChange(styleId === 'normal' ? null : styleId);
        setShowStyleSubmenu(false);
        setShowToolsMenu(false);
    };

    // Handle quick action pills
    const handleQuickAction = (actionId: string) => {
        const prompts: Record<string, string> = {
            code: 'Help me write code for ',
            strategize: 'Help me create a strategy for ',
            create: 'Help me create ',
            write: 'Help me write ',
            learn: 'Teach me about ',
        };
        setInput(prompts[actionId] || '');
        textareaRef.current?.focus();
    };

    // Hidden inputs for file upload
    const renderHiddenInputs = () => (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*,.pdf,.docx,.txt,.md,.csv,.doc,.zip"
                onChange={handleFileChange}
            />
            <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
            />
            <input
                type="file"
                ref={documentInputRef}
                className="hidden"
                accept=".pdf,.docx,.txt,.md,.csv,.doc"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                        const { parseDocument } = await import('@/lib/documentParser');
                        const parsed = await parseDocument(file);
                        setUploadedDocument(parsed);
                        setShowDocumentViewer(true);
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        setAlertConfig({
                            isOpen: true,
                            title: 'Parsing Error',
                            message: `Maaf, terjadi kesalahan saat membaca dokumen tersebut: ${errorMessage}`,
                            type: 'info'
                        });
                    }
                    if (documentInputRef.current) documentInputRef.current.value = '';
                }}
            />
            {/* Combined Input for Upload Files menu item */}
            <input
                type="file"
                ref={combinedInputRef}
                className="hidden"
                multiple
                accept="image/*,.pdf,.docx,.txt,.md,.csv,.doc,.zip"
                onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    
                    const zipFiles = files.filter(f => f.name.endsWith('.zip') || f.type === 'application/zip' || f.type === 'application/x-zip-compressed');
                    const images = files.filter(f => f.type.startsWith('image/'));
                    const docs = files.filter(f => !f.type.startsWith('image/') && !zipFiles.includes(f));

                    if (zipFiles.length > 0 && user?.id) {
                        try {
                            const JSZip = (await import('jszip')).default;
                            for (const file of zipFiles) {
                                const zip = await JSZip.loadAsync(file);
                                const metadataFile = zip.file('metadata.json') || zip.file('skill.json') || zip.file('manifest.json');
                                
                                let skillData: any = null;
                                if (metadataFile) {
                                    const metadataStr = await metadataFile.async('string');
                                    skillData = JSON.parse(metadataStr);
                                } else {
                                    // Try to infer from files if no metadata
                                    const textFiles = Object.values(zip.files).filter(f => !f.dir && (f.name.endsWith('.txt') || f.name.endsWith('.md')));
                                    if (textFiles.length > 0) {
                                        const content = await textFiles[0].async('string');
                                        skillData = {
                                            name: file.name.replace('.zip', ''),
                                            description: 'Imported from ZIP',
                                            systemPrompt: content
                                        };
                                    }
                                }

                                if (skillData && skillData.name && skillData.systemPrompt) {
                                    const { createSkill } = await import('@/lib/skillsApi');
                                    await createSkill(user.id, {
                                        name: skillData.name,
                                        description: skillData.description || 'Imported Skill',
                                        systemPrompt: skillData.systemPrompt
                                    });
                                    setAlertConfig({
                                        isOpen: true,
                                        title: 'Skill Imported',
                                        message: `Successfully imported skill: ${skillData.name}`,
                                        type: 'info'
                                    });
                                    // Refresh skills
                                    getSkills(user.id).then(data => setUserSkills(data.map(s => ({ id: s.id, name: s.name, enabled: s.enabled, system_prompt: s.system_prompt }))));
                                } else {
                                    setAlertConfig({
                                        isOpen: true,
                                        title: 'Import Failed',
                                        message: `Could not find valid skill data in ${file.name}. Ensure it contains a metadata.json or text file.`,
                                        type: 'info'
                                    });
                                }
                            }
                        } catch (error) {
                            // Error extracting zip - handled with user alert
                            setAlertConfig({
                                isOpen: true,
                                title: 'Import Error',
                                message: 'Failed to process ZIP file.',
                                type: 'info'
                            });
                        }
                    }

                    if (images.length) {
                        handleFileChange({ target: { files: images } } as unknown as React.ChangeEvent<HTMLInputElement>);
                    }
                    if (docs.length && onFilesSelected) {
                        onFilesSelected(docs as any);
                    }
                    if (combinedInputRef.current) combinedInputRef.current.value = '';
                }}
            />
        </>
    );

    const modelDisplayName = SHORT_MODEL_LABELS[selectedModel] ?? getModelDisplayName(selectedModel);

    const improvePrompt = () => {
        const raw = input.trim();
        if (!raw) {
            setAlertConfig({
                isOpen: true,
                title: 'Improve Prompt',
                message: 'Write a rough prompt first, then UseGlass AI can reshape it into a clearer request.',
                type: 'info'
            });
            return;
        }

        const enhanced = [
            'Goal:',
            raw,
            '',
            'Context:',
            '- I want a clear, useful response tailored to the task.',
            '',
            'Desired output:',
            '- Provide the best answer with structure, examples, and next steps when helpful.',
            '',
            'Constraints:',
            '- Be accurate, concise, and avoid unnecessary filler.',
            '',
            'Format:',
            '- Use headings, bullets, tables, or code blocks when they improve clarity.'
        ].join('\n');

        setInput(enhanced);
        window.setTimeout(() => textareaRef.current?.focus(), 0);
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe md:pb-4 bg-transparent z-20">
            {renderHiddenInputs()}

            <div className="mx-auto w-full max-w-3xl px-3 md:px-0">
                {/* Main Input Container — Claude-style */}
                <div className={cn(
                    "w-full bg-[#f4f4f3] flex flex-col transition-all duration-200 relative",
                    attachedImages.length > 0 || attachedFiles.length > 0 || input.length > 80 || input.includes('\n') ? "rounded-[28px]" : "rounded-[999px]",
                    isFocused
                        ? "shadow-[0_10px_30px_-22px_rgba(20,20,19,0.55)] ring-1 ring-stone-200/70"
                        : "shadow-[0_4px_18px_-16px_rgba(20,20,19,0.35)] ring-1 ring-transparent"
                )}>

                    {/* Attached Images Preview */}
                    {attachedImages.length > 0 && (
                        <div className="w-full px-3 pt-3">
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                                {attachedImages.map((img, idx) => (
                                    <div key={idx} className="relative group shrink-0 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
                                        <img src={img} alt="Preview" className="h-28 w-28 object-cover rounded-lg" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute -right-2 -top-2 z-10 rounded-full bg-zinc-950 p-1.5 text-white shadow-md transition-all hover:bg-zinc-700"
                                        >
                                            <X size={12} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attached Files Preview */}
                    {attachedFiles.length > 0 && (
                        <div className="w-full px-4 pt-3">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {attachedFiles.map((file, idx) => (
                                    <div key={idx} className="relative group shrink-0 flex items-center gap-2 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg">
                                        <FileText size={14} className="text-stone-500" />
                                        <span className="text-xs font-medium text-stone-700 max-w-[120px] sm:max-w-[200px] truncate">{file.name}</span>
                                        <button
                                            onClick={() => removeFile?.(idx)}
                                            className="ml-1 text-stone-400 hover:text-stone-700"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Mode Badges */}
                    {false && (routingResult || activeToolMode !== 'chat' || activeWorkflowMode !== 'think' || activeStyle !== 'normal' || !!activeSkill || !!activeConnector || !!activeCanvasType || enableWebSearch || settings.planningBeforeAnswer || settings.defaultTone !== 'professional') && (
                        <div className="flex max-w-full flex-nowrap gap-2 overflow-x-auto px-4 pt-2 scrollbar-none">
                            {activeToolMode !== 'chat' && <button
                                type="button"
                                onClick={() => onToolModeChange?.('chat')}
                                className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition", activeTool.color)}
                                title="Reset to Glass Chat"
                            >
                                <ActiveToolIcon size={12} />
                                {activeTool.label}
                                {activeToolMode !== 'chat' && <X size={12} />}
                            </button>}
                            {activeWorkflowMode !== 'think' && <button
                                type="button"
                                onClick={() => onWorkflowModeChange?.('think')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
                                title={activeWorkflow.flow}
                            >
                                <Brain size={12} />
                                {activeWorkflow.label}
                                {activeWorkflowMode !== 'think' && <X size={12} />}
                            </button>}
                            {activeStyle !== 'normal' && <button
                                onClick={() => onStyleChange('normal')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
                            >
                                <Wand2 size={12} />
                                {activeGlassStyleConfig.label}
                                {activeStyle !== 'normal' && <X size={12} />}
                            </button>}
                            {activeCanvasType && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                                    <LayoutTemplate size={12} />Canvas: {activeCanvasType}
                                </span>
                            )}
                            {activeSkill && (
                                <button
                                    type="button"
                                    onClick={() => onSkillChange?.(null)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
                                >
                                    <SquareTerminal size={12} />
                                    Skill: {activeSkill.name}
                                    <X size={12} />
                                </button>
                            )}
                            {activeConnector && (
                                <button
                                    type="button"
                                    onClick={() => onConnectorChange?.(null)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                                >
                                    {React.createElement(activeConnector.icon, { size: 12 })}
                                    Connector: {activeConnector.name}
                                    <X size={12} />
                                </button>
                            )}
                            {settings.planningBeforeAnswer && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-medium">
                                    <Brain size={12} />
                                    Glass Thinking
                                </div>
                            )}
                            {settings.defaultTone !== 'professional' && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 text-zinc-600 rounded-lg text-xs font-medium">
                                    Tone: {settings.defaultTone}
                                </div>
                            )}
                            {enableWebSearch && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                                    <Globe size={12} />
                                    Web Search On
                                    <button onClick={() => setEnableWebSearch(false)} className="ml-1 hover:text-blue-800">
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Textarea */}
                    <div className={cn(
                        attachedImages.length > 0 || attachedFiles.length > 0 || input.length > 80 || input.includes('\n')
                            ? "min-w-0 px-4 pt-4 pb-1 sm:px-6 sm:pt-4 sm:pb-1"
                            : "flex h-[58px] min-w-0 items-center pl-12 pr-24 sm:pl-16 sm:pr-44"
                    )}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(isDeepDiveModel && withReasoning))}
                            onFocus={(e) => {
                                setIsFocused(true);
                                if (input) {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                                }
                            }}
                            onBlur={() => setIsFocused(false)}
                            placeholder={isTyping ? "AI is processing..." : "What do you want to know?"}
                            disabled={isTyping}
                            autoCapitalize="sentences"
                            autoCorrect="on"
                            autoComplete="off"
                            spellCheck="true"
                            enterKeyHint="send"
                            className={cn(
                                "block h-[22px] max-h-24 min-h-[22px] w-full resize-none overflow-y-auto border-0 bg-transparent py-0 text-base font-medium leading-[22px] text-gray-800 placeholder-stone-500 focus:outline-none scrollbar-none break-words",
                                isTyping && "opacity-60 cursor-not-allowed"
                            )}
                            style={{ height: '22px', minHeight: '22px', fontSize: '16px' }}
                        />
                    </div>

                    {/* Bottom Bar — Claude Layout */}
                    <div className={cn(
                        "pointer-events-none flex items-center justify-between gap-2 px-4",
                        attachedImages.length > 0 || attachedFiles.length > 0 || input.length > 80 || input.includes('\n')
                            ? "pb-3 pt-1"
                            : "absolute inset-x-0 bottom-1/2 translate-y-1/2"
                    )}>
                        {/* Left: + Button with Dropdown */}
                        <div className="pointer-events-auto flex items-center gap-1 relative" ref={toolsMenuRef}>
                            <button
                                onClick={() => setShowToolsMenu(!showToolsMenu)}
                                className={cn(
                                    "w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-all",
                                    isTyping ? "opacity-30 cursor-not-allowed" : showToolsMenu
                                        ? "bg-white text-stone-800 shadow-sm"
                                        : "text-stone-500 hover:text-stone-900 hover:bg-white/80"
                                )}
                                disabled={isTyping}
                                title="Attach menu"
                            >
                                <Plus size={20} strokeWidth={1.8} />
                            </button>

                            {false && (
                            <button
                                onClick={improvePrompt}
                                disabled={isTyping}
                                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
                                title="Improve Prompt"
                            >
                                <Wand2 size={15} strokeWidth={1.8} />
                                <span className="hidden sm:inline">Improve Prompt</span>
                            </button>
                            )}



                            {/* Tools Dropdown */}
                            {showToolsMenu && (
                                <div className="absolute bottom-full left-0 mb-2 sm:mb-3 flex flex-col md:flex-row items-start gap-1 z-50">
                                    {/* Main menu */}
                                    <div className="w-[min(88vw,260px)] sm:w-56 bg-white/95 backdrop-blur-xl border border-stone-200 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 py-1.5 max-h-[60vh] overflow-y-auto">
                                        <button type="button" onClick={() => setAutoPilot((value) => !value)} className="mx-1.5 mb-1 flex w-[calc(100%-12px)] items-center justify-between rounded-xl px-3 py-2.5 sm:py-2 text-left text-[13px] text-stone-700 transition-colors active:bg-stone-100 hover:bg-stone-50 [touch-action:manipulation]">
                                            <span>Auto Pilot</span>
                                            <span className={cn("relative h-4 w-7 rounded-full transition-colors duration-300", autoPilot ? "bg-blue-500" : "bg-stone-200")}>
                                                <span className={cn("absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-300", autoPilot && "translate-x-3")} />
                                            </span>
                                        </button>
                                        {lowCredits && (
                                            <div className="mx-1.5 mb-1 flex w-[calc(100%-12px)] items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-stone-500">
                                                <AlertTriangle size={14} /> {creditBalance} credits left
                                            </div>
                                        )}
                                        <button type="button" onClick={improvePrompt} disabled={isTyping} className="mx-1.5 mb-1 flex w-[calc(100%-12px)] items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-30">
                                            <Wand2 size={14} strokeWidth={1.8} /> Improve Prompt
                                        </button>
                                        <div className="mx-3 mb-1 h-px bg-stone-100" />
                                        {TOOL_GROUPS.map((group, groupIdx) => (
                                            <React.Fragment key={groupIdx}>
                                                <div className="flex flex-col">
                                                    {group.map((tool) => {
                                                        const Icon = tool.icon;
                                                        const isWebActive = tool.id === 'web' && enableWebSearch;
                                                        const isStyleActive = tool.id === 'styles' && !!activeStyle;
                                                        const isVisualActive = (tool.id === 'image_gen' && showVisualSubmenu === 'image') || (tool.id === 'video_gen' && showVisualSubmenu === 'video');
                                                        const isActive = isWebActive || isStyleActive || isVisualActive;
                                                        return (
                                                            <button
                                                                key={tool.id}
                                                                onClick={() => handleToolSelect(tool.id)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-3 px-3 py-2.5 sm:py-2 text-[13px] transition-colors mx-1.5 rounded-lg text-left active:bg-stone-100 [touch-action:manipulation]",
                                                                    (tool.id === 'styles' && showStyleSubmenu) || (tool.id === 'skills' && showSkillSubmenu) || isVisualActive ? "bg-stone-100" : "hover:bg-stone-50"
                                                                )}
                                                                style={{ width: 'calc(100% - 12px)' }}
                                                            >
                                                                <div className={cn("flex justify-center items-center w-5", isActive ? "text-blue-500" : "text-stone-700")}>
                                                                    <Icon size={16} strokeWidth={1.8} />
                                                                </div>
                                                                <span className={cn("flex-1", isActive ? "text-blue-600 font-medium" : "text-stone-700")}>{tool.label}</span>
                                                                {tool.id === 'styles' ? (
                                                                    <ChevronRight size={14} className={cn("text-stone-400 ml-auto transition-transform duration-150", showStyleSubmenu && "rotate-90")} strokeWidth={2} />
                                                                ) : tool.id === 'skills' ? (
                                                                    <ChevronRight size={14} className={cn("text-stone-400 ml-auto transition-transform duration-150", showSkillSubmenu && "rotate-90")} strokeWidth={2} />
                                                                ) : tool.id === 'image_gen' ? (
                                                                    <ChevronRight size={14} className={cn("text-stone-400 ml-auto transition-transform duration-150", showVisualSubmenu === 'image' && "rotate-90")} strokeWidth={2} />
                                                                ) : tool.id === 'video_gen' ? (
                                                                    <ChevronRight size={14} className={cn("text-stone-400 ml-auto transition-transform duration-150", showVisualSubmenu === 'video' && "rotate-90")} strokeWidth={2} />
                                                                ) : (tool as any).hasChevron ? (
                                                                    <ChevronRight size={14} className="text-stone-400 ml-auto" strokeWidth={2} />
                                                                ) : isWebActive ? (
                                                                    <Check size={16} className="text-blue-500 ml-auto" strokeWidth={2.5} />
                                                                ) : null}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {groupIdx < TOOL_GROUPS.length - 1 && (
                                                    <div className="h-px bg-stone-100 my-1.5 mx-3" />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* Skill submenu */}
                                    {showSkillSubmenu && (
                                        <div className="w-[min(88vw,260px)] md:w-44 bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-left-1 duration-150 py-1.5 max-h-[40vh] overflow-y-auto">
                                            {userSkills.filter(s => s.enabled).length === 0 ? (
                                                <div className="px-3 py-3 text-[12px] text-stone-400 text-center">
                                                    Belum ada skill aktif
                                                </div>
                                            ) : (
                                                userSkills.filter(s => s.enabled).map(skill => (
                                                    <div key={skill.id} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] mx-1.5 rounded-lg" style={{ width: 'calc(100% - 12px)' }}>
                                                        <SquareTerminal size={14} className="text-stone-400 shrink-0" strokeWidth={1.8} />
                                                        <span className="text-stone-700 truncate">{skill.name}</span>
                                                    </div>
                                                ))
                                            )}
                                            <div className="h-px bg-stone-100 my-1.5 mx-3" />
                                            <button
                                                onClick={() => { setShowSkillSubmenu(false); setShowToolsMenu(false); navigate('/skills'); }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-stone-50 transition-colors mx-1.5 rounded-lg text-left"
                                                style={{ width: 'calc(100% - 12px)' }}
                                            >
                                                <Wrench size={14} className="text-stone-500 shrink-0" strokeWidth={1.8} />
                                                <span className="text-stone-700">Manage skills</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Style submenu */}
                                    {showStyleSubmenu && (
                                        <div className="w-[min(88vw,260px)] md:w-44 bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-left-1 duration-150 py-1.5 max-h-[40vh] overflow-y-auto">
                                            {WRITING_STYLES.map((style) => {
                                                const isSelected = activeStyle === style.id || (!activeStyle && style.id === 'normal');
                                                return (
                                                    <button
                                                        key={style.id}
                                                        onClick={() => handleSelectStyle(style.id)}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-stone-50 transition-colors mx-1.5 rounded-lg text-left"
                                                        style={{ width: 'calc(100% - 12px)' }}
                                                    >
                                                        <Wand2 size={14} className={isSelected ? "text-blue-500" : "text-stone-400"} strokeWidth={1.8} />
                                                        <span className={cn("flex-1", isSelected ? "text-blue-600 font-medium" : "text-stone-700")}>{style.label}</span>
                                                        {isSelected && <Check size={13} className="text-blue-500 shrink-0" strokeWidth={2.5} />}
                                                    </button>
                                                );
                                            })}
                                            <div className="h-px bg-stone-100 my-1.5 mx-3" />
                                            <button
                                                onClick={() => { setShowStyleSubmenu(false); setShowToolsMenu(false); setAlertConfig({ isOpen: true, title: 'Custom Styles', message: 'Fitur buat & edit style kustom akan segera hadir!', type: 'development' }); }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-stone-50 transition-colors mx-1.5 rounded-lg text-left"
                                                style={{ width: 'calc(100% - 12px)' }}
                                            >
                                                <Plus size={14} className="text-stone-500 shrink-0" strokeWidth={2} />
                                                <span className="text-stone-700">Create &amp; edit styles</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Visual Model submenu */}
                                    {showVisualSubmenu && (
                                        <div className="w-[min(88vw,260px)] md:w-48 bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-left-1 duration-150 py-1.5 max-h-[40vh] overflow-y-auto">
                                            <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                                                {showVisualSubmenu === 'image' ? 'Image Models' : 'Video Models'}
                                            </div>
                                            {[
                                                { id: 'flux-schnell', label: 'Flux 1.1 Schnell', type: 'image', icon: ImageIcon },
                                                { id: 'sdxl', label: 'Stable Diffusion XL', type: 'image', icon: ImageIcon },
                                                { id: 'openjourney', label: 'Openjourney', type: 'image', icon: ImageIcon },
                                                { id: 'stable-video', label: 'Stable Video Diffusion', type: 'video', icon: Play }
                                            ].filter(m => m.type === showVisualSubmenu).map((model) => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        onModelChange(model.id as any);
                                                        setInput(`Generate an ${showVisualSubmenu} using ${model.label} of `);
                                                        setShowVisualSubmenu(null);
                                                        setShowToolsMenu(false);
                                                        textareaRef.current?.focus();
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-stone-50 transition-colors mx-1.5 rounded-lg text-left"
                                                    style={{ width: 'calc(100% - 12px)' }}
                                                >
                                                    <model.icon size={14} className="text-purple-500 shrink-0" strokeWidth={1.8} />
                                                    <span className="text-stone-700 font-medium">{model.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: Model Selector + Voice + Send */}
                        <div className="pointer-events-auto flex items-center gap-1.5">
                            {false && lowCredits && (
                                <span className="hidden h-8 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 text-xs font-medium text-stone-500 sm:inline-flex" title={`${creditBalance} credits left`}>
                                    <AlertTriangle size={14} /> Low
                                </span>
                            )}
                            {/* Model Name Button (Claude style: "Sonnet 4.6 ∨") */}
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={onModelChange}
                                disabled={isTyping}
                                withReasoning={withReasoning}
                                onReasoningToggle={() => {
                                    setWithReasoning(!withReasoning);
                                    onToggleDeepResearch?.(!withReasoning);
                                }}
                                isSubscribed={isSubscribed}
                                comparisonMode={comparisonMode}
                                onComparisonModeToggle={onComparisonModeToggle}
                            >
                                <button className="flex items-center gap-1 px-2 py-1.5 text-stone-500 hover:text-stone-800 transition-colors text-[13px] font-semibold">
                                    {input.trim() ? (
                                        <Zap size={16} className="text-zinc-950" fill="currentColor" strokeWidth={2.2} />
                                    ) : (
                                        <>
                                            <span className="hidden sm:inline">{modelDisplayName}</span>
                                            <Zap size={16} className="sm:hidden text-zinc-950" fill="currentColor" strokeWidth={2.2} />
                                            <ChevronDown size={14} strokeWidth={2} className="hidden sm:inline" />
                                        </>
                                    )}
                                </button>
                            </ModelSelector>

                            {/* Voice / Send Button */}
                            <motion.button
                                onClick={() => {
                                    if (isTyping) handleStop?.();
                                    else if (input.trim() || attachedImages.length > 0 || attachedFiles.length > 0) handleSend(isDeepDiveModel && withReasoning);
                                    else setShowDictation(true);
                                }}
                                disabled={!isTyping && !input.trim() && attachedImages.length === 0 && attachedFiles.length === 0 ? false : false}
                                whileTap={{ scale: 0.92 }}
                                className={cn(
                                    "w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm transition-colors hover:bg-zinc-800",
                                    isTyping && "hover:bg-red-600"
                                )}
                                title={isTyping ? "Stop generating" : input.trim() || attachedImages.length > 0 || attachedFiles.length > 0 ? "Send message" : "Voice Input"}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {isTyping ? (
                                        <motion.span key="stop" initial={{ opacity: 0, scale: 0.65, rotate: -45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.65, rotate: 45 }} transition={{ type: 'spring', stiffness: 420, damping: 24 }}>
                                            <Square size={14} fill="currentColor" strokeWidth={0} />
                                        </motion.span>
                                    ) : input.trim() || attachedImages.length > 0 || attachedFiles.length > 0 ? (
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

                            {/* Send / Stop Button */}
                            {false && <button
                                onClick={() => isTyping ? handleStop?.() : handleSend(isDeepDiveModel && withReasoning)}
                                disabled={!isTyping && (!input.trim() && attachedImages.length === 0 && attachedFiles.length === 0)}
                                className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ml-0.5",
                                    !isTyping && (!input.trim() && attachedImages.length === 0 && attachedFiles.length === 0)
                                        ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                                        : isTyping 
                                            ? "bg-stone-800 hover:bg-red-600 text-white" 
                                            : "bg-stone-800 hover:bg-stone-900 text-white transform hover:scale-105"
                                )}
                                title={isTyping ? "Stop generating" : "Send message"}
                            >
                                {isTyping ? (
                                    <Square size={14} fill="currentColor" strokeWidth={0} />
                                ) : (
                                    <ArrowUp size={18} strokeWidth={2.5} />
                                )}
                            </button>}
                        </div>
                    </div>
                </div>

                {/* Quick Action Pills — Below the input box */}
                {messagesLength === 0 && (
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        {QUICK_ACTIONS.map(action => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action.id)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm hover:shadow"
                                >
                                    <Icon size={14} strokeWidth={1.8} />
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Footer Disclaimer */}
                <div className="text-center mt-2">
                    <p className="text-[11px] text-stone-400">UseGlass is AI and can make mistakes. Please double-check responses.</p>
                </div>
            </div>

            <VoiceDictationModal
                isOpen={showDictation}
                onClose={() => setShowDictation(false)}
                onInsert={(text) => {
                    setInput((prev) => prev ? prev + ' ' + text : text);
                }}
            />


            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

        </div >
    );
};

export default ChatInput;



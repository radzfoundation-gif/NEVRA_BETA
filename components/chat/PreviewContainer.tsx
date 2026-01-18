import React, { useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Globe, RefreshCw, FileCode, Layout } from 'lucide-react';
import BuildingAnimation from '@/components/BuildingAnimation';
import Logo from '@/components/Logo';
import { getIframeSrc } from '@/lib/previewUtils';
import { FileManager, ProjectFile } from '@/lib/fileManager';
import { Framework } from '@/lib/ai';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Message = {
    id: string;
    role: 'user' | 'ai';
    content: string;
    code?: string;
    images?: string[];
    timestamp: Date;
};

interface PreviewContainerProps {
    isMobile: boolean;
    previewDevice: 'desktop' | 'tablet' | 'mobile';
    isSubscribed: boolean;
    hasExceeded: boolean;
    isBuildingCode: boolean;
    isExploringCodebase: boolean;
    fileManager: FileManager;
    currentCode: string;
    currentFramework: Framework;
    refreshKey: number;
    setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
    setCurrentCode: (code: string) => void;
    setSelectedFile: (path: string) => void;
    setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
    messages: Message[];
    canvasZoom: number;
    selectedFile?: string | null;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({
    isMobile,
    previewDevice,
    isSubscribed,
    hasExceeded,
    isBuildingCode,
    isExploringCodebase,
    fileManager,
    currentCode,
    currentFramework,
    refreshKey,
    setRefreshKey,
    setCurrentCode,
    setSelectedFile,
    setOpenFiles,
    messages,
    canvasZoom,
    selectedFile
}) => {
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const previewIframeRef = useRef<HTMLIFrameElement>(null);

    // Calculate scaling for mobile/tablet previews
    const deviceScale = isMobile ? (window.innerWidth - 32) / 430 : 1;

    return (
        <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center relative overflow-hidden p-4 sm:p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="flex flex-col items-center justify-center w-full h-full relative z-10 max-h-full">
                {/* Browser Bar (Desktop only or when preview shown) */}
                <div className={cn(
                    "bg-white border border-zinc-200 rounded-lg shadow-sm mb-3 sm:mb-4 transition-all shrink-0 z-10 text-xs text-zinc-400 flex items-center gap-2 sm:gap-3",
                    previewDevice === 'desktop'
                        ? isMobile ? "w-full px-2 sm:px-3 py-1.5 sm:py-2" : "w-[600px] px-4 py-2.5"
                        : "w-full max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)] px-2 sm:px-3 py-1.5 sm:py-2"
                )}>
                    <div className="flex gap-1.5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60"></div>
                    </div>
                    <div className="flex-1 text-center font-mono text-gray-400 flex items-center justify-center gap-2 min-w-0">
                        <Globe size={12} className="shrink-0" />
                        <span className="truncate">localhost:3000</span>
                    </div>
                    <button
                        onClick={() => setRefreshKey(k => k + 1)}
                        className="p-1.5 sm:p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="Refresh preview"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                {/* Iframe Preview Container - iPhone 17 Pro Max Mockup */}
                <div
                    ref={previewContainerRef}
                    className={cn(
                        "relative z-0 transition-all duration-300 origin-center flex flex-col shrink-0 shadow-2xl overflow-visible",
                        previewDevice === 'mobile'
                            ? isMobile
                                ? "w-full max-w-[calc(100vw-2rem)] sm:max-w-[430px] h-[calc(100vh-200px)] sm:h-[932px] mx-auto"
                                : "w-[430px] h-[932px]"
                            : previewDevice === 'tablet'
                                ? isMobile
                                    ? "w-full max-w-[calc(100vw-2rem)] sm:max-w-[600px] h-[calc(100vh-200px)] sm:h-[700px] mx-auto"
                                    : "w-[768px] h-[1024px]"
                                : "w-full h-full max-w-full max-h-full rounded-lg border border-white/10 bg-[#1a1a1a]"
                    )}
                    style={
                        previewDevice === 'mobile' || previewDevice === 'tablet'
                            ? {
                                transform: `scale(${deviceScale * (canvasZoom / 100)})`,
                                transformOrigin: 'center',
                                margin: '0 auto'
                            }
                            : {
                                transform: `scale(${canvasZoom / 100})`,
                                transformOrigin: 'center',
                            }
                    }>
                    {/* iPhone 17 Pro Max Frame - Premium Design */}
                    {previewDevice === 'mobile' && (
                        <>
                            {/* Outer Frame - Premium Bezel with realistic depth */}
                            <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-b from-[#2d2d2d] via-[#1a1a1a] to-[#2d2d2d] shadow-[0_0_0_6px_#1a1a1a,0_0_0_7px_#0a0a0a,0_0_0_8px_#050505,0_25px_70px_rgba(0,0,0,0.9)] pointer-events-none z-0" />

                            {/* Inner Screen Border - No padding */}
                            <div className="absolute inset-0 rounded-[3.5rem] border-[2.5px] border-[#0a0a0a]/80 pointer-events-none z-10" />
                            <div className="absolute inset-0 rounded-[3.5rem] border border-white/5 pointer-events-none z-10" />

                            {/* Dynamic Island - iPhone 17 Pro Max Style */}
                            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                                <div className="w-[126px] h-[37px] bg-[#000000] rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_2px_rgba(0,0,0,0.8),0_2px_10px_rgba(0,0,0,0.7)] flex items-center justify-center relative">
                                    {/* Dynamic Island Inner Glow */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.03] via-transparent to-black/50"></div>

                                    {/* Dynamic Island Content */}
                                    <div className="flex items-center gap-2.5 z-10">
                                        <div className="w-[5px] h-[5px] rounded-full bg-white/30 shadow-[0_0_2px_rgba(255,255,255,0.2)]"></div>
                                        <div className="w-[3px] h-[3px] rounded-full bg-white/20"></div>
                                    </div>

                                    {/* Camera cutout hint */}
                                    <div className="absolute left-4 w-[6px] h-[6px] rounded-full bg-black/80 border border-white/10"></div>
                                    <div className="absolute right-4 w-[8px] h-[8px] rounded-full bg-black/80 border border-white/10"></div>
                                </div>
                            </div>

                            {/* Status Bar Indicators - Left Side (Time) */}
                            <div className="absolute top-[20px] left-[50px] z-30 flex items-center pointer-events-none">
                                <span className="text-[14px] font-semibold text-white tracking-[-0.2px]">9:41</span>
                            </div>

                            {/* Status Bar Indicators - Right Side (Signal, Battery, etc) */}
                            <div className="absolute top-[20px] right-[50px] z-30 flex items-center gap-1.5 pointer-events-none">
                                {/* Signal Bars */}
                                <div className="flex items-end gap-[2.5px]">
                                    <div className="w-[3px] h-[4px] bg-white rounded-t-[1px]"></div>
                                    <div className="w-[3px] h-[5px] bg-white rounded-t-[1px]"></div>
                                    <div className="w-[3px] h-[6px] bg-white rounded-t-[1px]"></div>
                                    <div className="w-[3px] h-[7px] bg-white rounded-t-[1px]"></div>
                                </div>

                                {/* WiFi */}
                                <div className="w-[16px] h-[12px] relative -mt-0.5">
                                    <svg viewBox="0 0 16 12" className="w-full h-full" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M8 2C10 2 12 3 13.5 4.5" />
                                        <path d="M8 6.5C9 6.5 10 7 11 8" />
                                        <circle cx="8" cy="10.5" r="1" fill="white" />
                                    </svg>
                                </div>

                                {/* Battery */}
                                <div className="w-[26px] h-[13px] border border-white rounded-[2.5px] relative">
                                    <div className="absolute left-[2.5px] top-[2.5px] w-[19px] h-[7px] bg-white rounded-[1px]"></div>
                                    <div className="absolute right-[-3.5px] top-[3.5px] w-[2.5px] h-[6px] bg-white rounded-r-[1.5px]"></div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className={cn(
                        "flex-1 bg-[#1a1a1a] relative overflow-hidden min-h-0 flex flex-col",
                        previewDevice === 'mobile'
                            ? "rounded-[3.5rem]"
                            : previewDevice === 'tablet'
                                ? "rounded-[1.5rem]"
                                : "rounded-t-lg"
                    )}>

                        {!isSubscribed && hasExceeded && (
                            <div className="absolute inset-0 z-30 bg-[#0a0a0a]/95 backdrop-blur flex flex-col items-center justify-center text-center px-6">
                                <div className="text-lg font-semibold text-white mb-2">Quota reached</div>
                                <p className="text-sm text-gray-400 mb-4">Upgrade to continue generating previews.</p>
                            </div>
                        )}

                        {/* Show building animation when generating code */}
                        {isBuildingCode ? (
                            <BuildingAnimation
                                isBuilding={isBuildingCode}
                                files={fileManager.getAllFiles().map(f => ({
                                    path: f.path,
                                    type: f.type
                                }))}
                                currentStep={isExploringCodebase ? 'Exploring codebase...' : 'Building web application...'}
                            />
                        ) : (currentCode || fileManager.getEntry()) ? (
                            <>
                                {(() => {
                                    // Get code for preview
                                    const previewCode = currentCode ||
                                        fileManager.getFile(fileManager.getEntry())?.content ||
                                        '';

                                    // Validate code before rendering
                                    // Check if code is empty or only contains whitespace/newlines
                                    const trimmedCode = previewCode ? previewCode.trim() : '';
                                    if (!trimmedCode || trimmedCode.length === 0 || /^[\s\n\r\t]+$/.test(trimmedCode)) {
                                        return (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-500">
                                                <div className="text-center">
                                                    <p className="text-lg mb-2 text-zinc-800">No code to preview</p>
                                                    <p className="text-sm">Please generate code first by describing your app in the chat.</p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Use getIframeSrc which handles React/TSX conversion automatically
                                    const entryPath = fileManager.getEntry() || selectedFile || undefined;

                                    return (
                                        <iframe
                                            ref={previewIframeRef}
                                            key={refreshKey}
                                            src={getIframeSrc(previewCode, entryPath, currentFramework)}
                                            className="w-full h-full border-none bg-white flex-1 min-h-0"
                                            title="Preview"
                                            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'block',
                                                flex: '1 1 0',
                                                minHeight: 0
                                            }}
                                            onError={(e) => {
                                                console.error('❌ Iframe error:', e);
                                            }}
                                            onLoad={() => {
                                                console.log('✅ Preview iframe loaded successfully');
                                            }}
                                        />
                                    );
                                })()}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-5 bg-zinc-50 min-h-[200px] flex-1">
                                <div className="text-center">
                                    <FileCode size={48} className="mx-auto mb-4 opacity-50 text-zinc-400" />
                                    <p className="text-lg mb-2">No code to preview</p>
                                    <p className="text-sm mb-4">Generate code by describing your app in the chat, then click "View Generated App"</p>
                                    <button
                                        onClick={() => {
                                            // Try to get code from messages
                                            const lastAiMessage = messages.filter(m => m.role === 'ai' && m.code).pop();
                                            if (lastAiMessage?.code) {
                                                setCurrentCode(lastAiMessage.code);
                                                fileManager.clear();
                                                fileManager.addFile('index.html', lastAiMessage.code, 'page');
                                                fileManager.setEntry('index.html');
                                                setSelectedFile('index.html');
                                                setRefreshKey(k => k + 1);
                                                console.log('✅ Restored code from message');
                                            } else {
                                                console.warn('⚠️ No code found in messages');
                                            }
                                        }}
                                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 transition-colors"
                                    >
                                        Try to Restore from Chat
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-2xl flex items-center justify-center animate-pulse border border-purple-500/30">
                                        <Layout size={40} className="text-purple-400/60" />
                                    </div>
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400/20 to-blue-400/20 blur-xl animate-pulse"></div>
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-semibold text-gray-300 mb-1">Ready to build</p>
                                    <p className="text-sm text-gray-400">Your generated app will appear here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewContainer;

import React, { useCallback, useState, useEffect } from 'react';
import { Tldraw, Editor, TldrawFile, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';
import { Sparkles, Loader2, Lock, Crown } from 'lucide-react';
import { useUser } from '@/lib/authContext';

interface CanvasBoardProps {
    onAnalyze: (blob: Blob) => void;
    isAnalyzing?: boolean;
}

interface CanvasUsage {
    tier: 'free' | 'pro';
    usage: {
        used: number;
        limit: number | 'unlimited';
        remaining: number | 'unlimited';
    };
}

const CustomUi = ({ onAnalyze, isAnalyzing }: CanvasBoardProps) => {
    const editor = useEditor();
    const { user } = useUser();
    const [canvasUsage, setCanvasUsage] = useState<CanvasUsage | null>(null);
    const [showLimitReached, setShowLimitReached] = useState(false);

    // Fetch canvas usage on mount
    useEffect(() => {
        const fetchUsage = async () => {
            if (!user?.id) return;
            try {
                const resp = await fetch(`/api/canvas/usage?userId=${user.id}`);
                if (resp.ok) {
                    const data = await resp.json();
                    setCanvasUsage(data);
                }
            } catch (error) {
                console.error('Error fetching canvas usage:', error);
            }
        };
        fetchUsage();
    }, [user?.id]);

    const handleAnalyzeClick = useCallback(async () => {
        if (!editor || !user?.id) return;

        // Check if free user at limit
        if (canvasUsage && canvasUsage.tier === 'free' && typeof canvasUsage.usage.remaining === 'number' && canvasUsage.usage.remaining <= 0) {
            setShowLimitReached(true);
            return;
        }

        // Get all shapes or selected shapes
        const shapeIds = editor.getCurrentPageShapeIds();
        if (shapeIds.size === 0) return;

        try {
            // Export to blob
            const blob = await editor.toImage(Array.from(shapeIds), {
                format: 'png',
                background: true,
                padding: 20,
                scale: 1,
            });

            // Convert blob to base64 for API check
            const blobData = blob instanceof Blob ? blob : (blob as any).blob;

            // Check limit with backend first
            const checkResp = await fetch('/api/canvas/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    imageData: 'check' // Just for limit check
                })
            });

            if (!checkResp.ok) {
                const errorData = await checkResp.json();
                if (errorData.code === 'CANVAS_ANALYZE_LIMIT') {
                    setShowLimitReached(true);
                    // Refresh usage
                    const usageResp = await fetch(`/api/canvas/usage?userId=${user.id}`);
                    if (usageResp.ok) setCanvasUsage(await usageResp.json());
                    return;
                }
            }

            // Update local usage counter
            if (canvasUsage && canvasUsage.tier === 'free') {
                setCanvasUsage({
                    ...canvasUsage,
                    usage: {
                        ...canvasUsage.usage,
                        used: (canvasUsage.usage.used as number) + 1,
                        remaining: typeof canvasUsage.usage.remaining === 'number'
                            ? canvasUsage.usage.remaining - 1
                            : canvasUsage.usage.remaining
                    }
                });
            }

            // Call the original analyze callback
            if (blobData instanceof Blob) {
                onAnalyze(blobData);
            }
        } catch (error) {
            console.error("Failed to export canvas:", error);
        }
    }, [editor, onAnalyze, user?.id, canvasUsage]);

    const isPro = canvasUsage?.tier === 'pro';
    const usedCount = canvasUsage?.usage?.used ?? 0;
    const limitCount = canvasUsage?.usage?.limit ?? 2;
    const remaining = canvasUsage?.usage?.remaining;

    return (
        <>
            <div className="absolute top-2 md:top-4 right-2 md:right-4 z-[9999] flex gap-2 pointer-events-auto">
                {/* Usage Counter for Free Users */}
                {canvasUsage && !isPro && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/90 text-white rounded-lg text-xs backdrop-blur-sm">
                        <Sparkles size={14} className="text-purple-400" />
                        <span>
                            {typeof remaining === 'number' ? remaining : 0}/{limitCount} analyzes left
                        </span>
                    </div>
                )}

                {/* Pro Badge */}
                {isPro && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded-lg text-xs backdrop-blur-sm border border-amber-500/30">
                        <Crown size={14} />
                        <span>Pro - Unlimited</span>
                    </div>
                )}

                {/* Analyze Button */}
                <button
                    onClick={handleAnalyzeClick}
                    disabled={isAnalyzing}
                    className="flex items-center justify-center gap-2 px-4 md:px-4 py-3 md:py-2 bg-black text-white rounded-xl md:rounded-lg shadow-2xl hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-sm min-h-[48px] md:min-h-0 touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span className="hidden sm:inline">Analyzing...</span>
                            <span className="sm:hidden">Analyzing</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            <span className="hidden sm:inline">Ask AI to Analyze</span>
                            <span className="sm:hidden">Analyze</span>
                        </>
                    )}
                </button>
            </div>

            {/* Limit Reached Modal */}
            {showLimitReached && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-red-500/20">
                                <Lock size={24} className="text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Canvas AI Limit Reached</h3>
                                <p className="text-sm text-gray-400">You've used all your free analyzes</p>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-6">
                            Free users get <strong className="text-white">2 Canvas AI analyzes per month</strong>.
                            Upgrade to Pro for <strong className="text-purple-400">unlimited</strong> canvas analysis!
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLimitReached(false)}
                                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                            >
                                Maybe Later
                            </button>
                            <button
                                onClick={() => window.location.href = '/pricing'}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Crown size={16} />
                                Upgrade - $3/mo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export const CanvasBoard: React.FC<CanvasBoardProps> = ({ onAnalyze, isAnalyzing = false }) => {
    return (
        <div className="w-full h-full relative bg-white">
            <Tldraw
                persistenceKey="nevra-canvas-persistence"
                hideUi={false}
            >
                <CustomUi onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} />
            </Tldraw>
        </div>
    );
};

export default CanvasBoard;

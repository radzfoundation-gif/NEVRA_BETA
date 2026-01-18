import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GripVertical, ArrowLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
    beforeImage: string;
    afterContent: string; // HTML content or image URL
    afterIsHtml?: boolean;
    beforeLabel?: string;
    afterLabel?: string;
    className?: string;
}

export function BeforeAfterSlider({
    beforeImage,
    afterContent,
    afterIsHtml = true,
    beforeLabel = 'Original',
    afterLabel = 'Redesigned',
    className
}: BeforeAfterSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Handle movement calculation
    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        // Clamp between 0 and 100
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    }, []);

    // Mouse interactions
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection/flickering
        setIsDragging(true);
        handleMove(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // e.preventDefault(); // Don't prevent default on touch start to allow scrolling if needed, unless we decide to capture all
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
    };

    // Global event listeners for dragging state
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                e.preventDefault(); // Prevent selection while dragging
                handleMove(e.clientX);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                // Prevent scrolling while dragging the slider
                e.preventDefault();
                handleMove(e.touches[0].clientX);
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, handleMove]);

    // Inject HTML content into iframe
    useEffect(() => {
        if (afterIsHtml && iframeRef.current && afterContent) {
            setIframeLoaded(false);
            const iframe = iframeRef.current;

            // Wait for iframe to be ready
            const writeContent = () => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (doc) {
                        doc.open();
                        doc.write(afterContent);
                        doc.close();
                        setIframeLoaded(true);
                    }
                } catch (e) {
                    console.error('Error writing to iframe:', e);
                }
            };

            setTimeout(writeContent, 100);
        }
    }, [afterContent, afterIsHtml]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={cn(
                "relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-zinc-200 shadow-2xl shadow-purple-900/10 bg-white select-none cursor-ew-resize touch-none", // Added cursor and touch-none
                className
            )}
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* After Content (HTML iframe or Image) - BOTTOM LAYER */}
            <div className="absolute inset-0 z-0">
                {afterIsHtml ? (
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full border-none bg-white"
                        title="Redesigned Preview"
                        sandbox="allow-scripts allow-same-origin"
                        // Pointer events none ensures clicks pass through to the container to trigger slider movement
                        style={{ pointerEvents: 'none' }}
                    />
                ) : (
                    <img
                        src={afterContent}
                        alt={afterLabel}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                )}
            </div>

            {/* Before Image (TOP LAYER with width clip) */}
            <div
                className="absolute inset-0 z-10 overflow-hidden pointer-events-none" // pointer-events-none to let clicks pass to max container if needed, but logic is on container now
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={beforeImage}
                    alt={beforeLabel}
                    className="h-full object-cover object-left"
                    style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
                    draggable={false}
                />
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                {beforeLabel}
            </div>
            <div className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium flex items-center gap-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {afterLabel}
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none" // pointer-events-none because container handles the drag now
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
                {/* Vertical Line */}
                <div className="w-1 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

                {/* Handle Grip */}
                <div className={cn(
                    "absolute w-12 h-12 rounded-full bg-white shadow-xl border-2 border-purple-500 flex items-center justify-center transition-all duration-150",
                    isDragging ? "scale-110 shadow-2xl border-purple-600" : "scale-100"
                )}>
                    <ArrowLeftRight size={18} className="text-purple-600" />
                </div>
            </div>

            {/* Loading overlay for iframe */}
            {afterIsHtml && !iframeLoaded && (
                <div className="absolute inset-0 z-40 bg-zinc-100 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </motion.div>
    );
}

export default BeforeAfterSlider;

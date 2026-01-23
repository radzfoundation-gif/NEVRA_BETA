/**
 * StreamingMessage.tsx
 * Real-time streaming AI response component for Nevra Chat
 * 
 * Features:
 * - Skeleton shimmer while waiting
 * - Progressive text rendering (streaming)
 * - Status indicator with phase changes
 * - Smooth animations & transitions
 * - Mobile responsive
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import SlidingCubeLoader from '../ui/SlidingCubeLoader';

// Status phases for the AI response
type AIStatus = 'thinking' | 'analyzing' | 'generating' | 'complete';

interface StreamingMessageProps {
    isStreaming: boolean;
    content: string;
    onComplete?: () => void;
    className?: string;
}

// Status messages for each phase
const STATUS_MESSAGES: Record<AIStatus, string> = {
    thinking: 'Thinking...',
    analyzing: 'Analyzing...',
    generating: 'Generating...',
    complete: ''
};

export default function StreamingMessage({
    isStreaming,
    content,
    onComplete,
    className = ''
}: StreamingMessageProps) {
    const [status, setStatus] = useState<AIStatus>('thinking');
    const [displayedContent, setDisplayedContent] = useState('');
    const [showSkeleton, setShowSkeleton] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    // Determine status based on content length and streaming state
    useEffect(() => {
        if (!isStreaming && content.length > 0) {
            setStatus('complete');
            setShowSkeleton(false);
            setDisplayedContent(content);
            onComplete?.();
            return;
        }

        if (content.length === 0) {
            setStatus('thinking');
            setShowSkeleton(true);
        } else if (content.length < 50) {
            setStatus('analyzing');
            setShowSkeleton(false); // Content started appearing
        } else {
            setStatus('generating');
            setShowSkeleton(false);
        }

        setDisplayedContent(content);
    }, [content, isStreaming, onComplete]);

    // Auto-scroll to bottom when content updates
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [displayedContent]);

    return (
        <div className={`flex gap-3 md:gap-4 ${className}`}>
            {/* AI Avatar */}
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#0164FF] to-[#0052CC] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                <Bot size={16} className="text-white" />
            </div>

            {/* Message Container */}
            <div className="flex-1 min-w-0 max-w-[calc(100%-3rem)]">
                {/* Status Indicator */}
                <AnimatePresence mode="wait">
                    {status !== 'complete' && (
                        <motion.div
                            key={status}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2 mb-2"
                        >
                            <span className="text-xs font-medium text-zinc-500">
                                {STATUS_MESSAGES[status]}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Message Bubble */}
                <motion.div
                    layout
                    className="relative rounded-2xl rounded-tl-md px-4 py-3 md:px-5 md:py-4 bg-white border border-zinc-200 shadow-sm"
                >
                    <AnimatePresence mode="wait">
                        {showSkeleton ? (
                            /* Loading Indicator (Sliding Cubes) */
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center justify-center py-4 text-zinc-400 min-h-[60px]"
                            >
                                <SlidingCubeLoader />
                            </motion.div>
                        ) : (
                            /* Actual Content */
                            <motion.div
                                key="content"
                                ref={contentRef}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="prose prose-sm md:prose-base max-w-none text-zinc-700
                        prose-p:my-3 prose-p:leading-[1.8] prose-p:text-[15px] md:prose-p:text-base prose-p:text-zinc-700
                        prose-headings:text-zinc-900 prose-headings:font-bold prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-3
                        prose-h1:text-xl md:prose-h1:text-2xl prose-h1:border-b prose-h1:border-zinc-200 prose-h1:pb-2
                        prose-h2:text-lg md:prose-h2:text-xl
                        prose-h3:text-base md:prose-h3:text-lg
                        prose-strong:text-zinc-900 prose-strong:font-semibold
                        prose-em:text-zinc-600 prose-em:italic
                        prose-code:text-[#0164FF] prose-code:bg-blue-50/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-blue-100
                        prose-pre:bg-[#1e1e1e] prose-pre:rounded-xl prose-pre:border prose-pre:border-zinc-700/50 prose-pre:shadow-md prose-pre:my-4
                        prose-ul:my-3 prose-ul:pl-5 prose-ul:space-y-1.5
                        prose-ol:my-3 prose-ol:pl-5 prose-ol:space-y-1.5
                        prose-li:text-zinc-700 prose-li:leading-relaxed prose-li:my-0 prose-li:marker:text-zinc-400
                        prose-blockquote:border-l-[3px] prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50/50 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-zinc-600 prose-blockquote:not-italic prose-blockquote:my-4
                        prose-table:my-4 prose-table:w-full prose-table:border-collapse prose-table:text-sm
                        prose-th:text-left prose-th:font-semibold prose-th:text-zinc-900 prose-th:bg-zinc-50 prose-th:border prose-th:border-zinc-200 prose-th:px-3 prose-th:py-2
                        prose-td:text-zinc-700 prose-td:border prose-td:border-zinc-200 prose-td:px-3 prose-td:py-2
                        prose-a:text-[#0164FF] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                        prose-hr:border-zinc-200 prose-hr:my-6
                        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-4"
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        code({ node, inline, className, children, ...props }: any) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline && match ? (
                                                <div className="overflow-hidden rounded-lg my-3">
                                                    <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                                                        <span className="text-xs font-medium text-zinc-400 uppercase">{match[1]}</span>
                                                    </div>
                                                    <SyntaxHighlighter
                                                        style={vscDarkPlus}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        customStyle={{
                                                            margin: 0,
                                                            padding: '1rem',
                                                            background: '#1e1e1e',
                                                            fontSize: '13px'
                                                        }}
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                </div>
                                            ) : (
                                                <code className="rounded px-1.5 py-0.5 text-sm bg-blue-50 text-[#0164FF]" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {displayedContent}
                                </ReactMarkdown>

                                {/* Typing cursor (visible while streaming) */}
                                {isStreaming && status === 'generating' && (
                                    <motion.span
                                        className="inline-block w-0.5 h-4 bg-[#0164FF] ml-0.5 align-middle"
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div >
        </div >
    );
}

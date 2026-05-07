import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AIResponseStreamProps {
    streamId: string;
    initialContent?: string; // If resuming or fully loaded
    isDone?: boolean;
    className?: string;
    onStreamUpdate: (fullText: string) => void;
    eventManager: any; // Using any to avoid circular dependency issues in simple setup
    appMode: string;
}

export function AIResponseStream({
    streamId,
    initialContent = '',
    isDone = false,
    className,
    onStreamUpdate,
    eventManager,
    appMode
}: AIResponseStreamProps) {
    const [content, setContent] = useState(initialContent);
    const [isStreaming, setIsStreaming] = useState(!isDone);
    const contentRef = useRef(initialContent);

    useEffect(() => {
        if (isDone) {
            setIsStreaming(false);
            return;
        }

        const unsubscribe = eventManager.subscribe((event: any) => {
            if (event.type === 'token_stream') {
                contentRef.current += event.payload;
                setContent(contentRef.current);
                onStreamUpdate(contentRef.current);
            } else if (event.type === 'done') {
                setIsStreaming(false);
            }
        });

        return () => unsubscribe();
    }, [eventManager, isDone, onStreamUpdate]);

    return (
        <div className={cn("relative leading-relaxed min-h-[24px]", className)}>
            <div className={cn(
                "prose prose-sm sm:prose-base max-w-none w-full break-words overflow-hidden",
                "prose-p:text-gray-700 prose-p:leading-[1.75] prose-p:my-3 prose-p:text-[15px] sm:prose-p:text-base",
                "prose-headings:text-gray-900 prose-headings:font-semibold",
                "prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-zinc-700/50 prose-pre:rounded-xl"
            )}>
                {/* 
                   We render content + cursor
                   However, ReactMarkdown wraps things in <p>, so putting cursor inside might be tricky if content ends in a code block.
                   A simple trick is to append a special cursor character if streaming, 
                   OR css based cursor.
                 */}
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                        img({ node, src, alt, ...props }: any) {
                            if (!src) return null;
                            return (
                                <div className="my-4 not-prose">
                                    <div className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-zinc-50 dark:bg-zinc-900 max-w-md mx-auto sm:mx-0">
                                        <img
                                            src={src}
                                            alt={alt || 'Generated Image'}
                                            className="w-full h-auto object-cover rounded-2xl"
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = target.parentElement?.querySelector('.img-fallback');
                                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                            }}
                                        />
                                        <div className="img-fallback hidden items-center justify-center h-48 text-zinc-400 text-sm">
                                            <span>⚠️ Gambar gagal dimuat</span>
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 rounded-2xl" />
                                    </div>
                                    {alt && alt !== 'Generated Image' && (
                                        <p className="text-xs text-zinc-500 mt-2 text-center sm:text-left italic">{alt}</p>
                                    )}
                                </div>
                            );
                        },
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <div className="relative group">
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{ margin: 0, borderRadius: '0.75rem' }}
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                </div>
                            ) : (
                                <code className={cn("bg-zinc-100 text-zinc-800 px-1 py-0.5 rounded text-sm font-mono", className)} {...props}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {content}
                </ReactMarkdown>

                {/* Blinking Cursor - Only show when streaming and content isn't empty (or is empty) */}
                {isStreaming && (
                    <span className="inline-block w-1.5 h-5 bg-blue-500 ml-0.5 align-middle animate-[pulse_0.8s_steps(2)_infinite] rounded-sm" />
                )}
            </div>
        </div>
    );
}

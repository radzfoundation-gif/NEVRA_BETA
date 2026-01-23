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

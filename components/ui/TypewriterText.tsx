import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface TypewriterTextProps {
    content: string;
    isStreaming?: boolean;
    onComplete?: () => void;
    speed?: number; // ms per character
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
    content,
    isStreaming = false,
    onComplete,
    speed = 10
}) => {
    // Use a ref to track the full content we WANT to show
    // Use state for what we ARE showing
    const [displayedContent, setDisplayedContent] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // We need to keep track of where we are in the animation independent of renders
    const indexRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial setup - if we mount with content, we start at 0 (or previous if re-mounting?)
    // For a chat message, we usually start at 0.

    // reset if content string *reference* changes? No, content changes on every token.
    // We need to detect if it's a "new" message or just an update.
    // Usually the parent handles key={msg.id} so a new message is a new component instance.

    useEffect(() => {
        // Animation Loop
        const animate = () => {
            if (indexRef.current < content.length) {
                // Calculate how many characters to add this frame
                // If we are far behind (streaming fast), catch up faster
                const distance = content.length - indexRef.current;
                const step = distance > 50 ? 5 : (distance > 10 ? 2 : 1);

                indexRef.current += step;

                // Ensure we don't overshoot
                if (indexRef.current > content.length) indexRef.current = content.length;

                setDisplayedContent(content.substring(0, indexRef.current));

                // Schedule next frame
                timeoutRef.current = setTimeout(animate, speed);
            } else {
                // Finished animating CURRENT content target
                setDisplayedContent(content); // Ensure exact match
                if (!isStreaming) {
                    setIsComplete(true);
                    if (onComplete) onComplete();
                }
            }
        };

        // If we haven't displayed everything yet, or if content grew
        if (indexRef.current < content.length) {
            // Clear any existing timer to avoid overlapping loops
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            animate();
        } else if (content.length < indexRef.current) {
            // Content shrank? (e.g. error or reset). Reset index.
            indexRef.current = content.length;
            setDisplayedContent(content);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [content, speed, isStreaming, onComplete]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Copy helper
    const copyToClipboard = async (text: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        }
    };

    return (
        <div className="relative">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <div className="overflow-hidden border border-zinc-200 rounded-xl bg-zinc-50 my-4 font-mono text-sm shadow-sm group">
                                <div className="flex items-center justify-between px-4 py-2 bg-zinc-100/50 border-b border-zinc-200">
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{match[1]}</span>
                                    <button
                                        onClick={() => {
                                            copyToClipboard(String(children).replace(/\n$/, ''));
                                        }}
                                        className="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded hover:bg-zinc-200 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <SyntaxHighlighter
                                        style={oneLight}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{
                                            margin: 0,
                                            padding: '1.25rem',
                                            background: 'transparent',
                                            fontSize: '13px',
                                            lineHeight: '1.6'
                                        }}
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        ) : (
                            <code className="rounded px-1.5 py-0.5 text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200" {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {displayedContent}
            </ReactMarkdown>

            {/* Blinking Cursor - Only show if not complete */}
            {(!isComplete || isStreaming) && (
                <span className="inline-block w-1.5 h-4 bg-teal-500 ml-1 animate-pulse align-middle rounded-sm" />
            )}
        </div>
    );
};

export default TypewriterText;

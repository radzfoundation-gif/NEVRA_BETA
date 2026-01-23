import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface TypewriterTextProps {
    content: string;
    onComplete?: () => void;
    speed?: number; // ms per character
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
    content,
    onComplete,
    speed = 10
}) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Reset state when content changes significantly (new message)
        // or if we decide to re-animate.
        // For now, assume content is stable for a completed message.
        indexRef.current = 0;
        setDisplayedContent('');
        setIsComplete(false);

        const animate = () => {
            if (indexRef.current < content.length) {
                // Calculate step size - for very long content, type faster or multiple chars
                const step = content.length > 500 ? 5 : 1;

                setDisplayedContent((prev) => content.slice(0, indexRef.current + step));
                indexRef.current += step;

                timerRef.current = setTimeout(animate, speed);
            } else {
                setDisplayedContent(content);
                setIsComplete(true);
                if (onComplete) onComplete();
            }
        };

        timerRef.current = setTimeout(animate, speed);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [content, speed, onComplete]);

    // Copy to clipboard helper (duplicated from ChatInterface, ideal refactor: move to utils)
    const copyToClipboard = async (text: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        }
    };

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <div className="overflow-hidden border border-zinc-200 rounded-lg bg-zinc-900 my-3">
                            <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2 bg-zinc-800">
                                <span className="text-xs font-medium text-gray-300 uppercase">{match[1]}</span>
                                <button
                                    onClick={() => {
                                        copyToClipboard(String(children).replace(/\n$/, ''));
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                        margin: 0,
                                        padding: '1rem',
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
    );
};

export default TypewriterText;

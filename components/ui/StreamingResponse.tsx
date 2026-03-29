import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { ChevronDown, ChevronRight, BrainCircuit, ExternalLink, Globe } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamingResponseProps {
    content: string;
    isStreaming?: boolean;
}

const CitationBadge = ({ id, sources }: { id: string, sources: any }) => {
    const source = sources?.[id];
    const [isHovered, setIsHovered] = useState(false);

    if (!source) return <sup className="text-xs text-zinc-500 font-bold ml-0.5 opacity-50">[{id}]</sup>;

    let domain = '';
    try {
        domain = new URL(source.url).hostname.replace('www.', '');
    } catch (e) {
        domain = source.url;
    }

    return (
        <span
            className="relative inline-block align-middle mb-0.5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-5 h-5 ml-1 bg-white border border-zinc-200 rounded-[4px] hover:border-blue-400 hover:scale-110 shadow-sm transition-all cursor-pointer no-underline select-none overflow-hidden p-0.5"
            >
                <img 
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                    alt={id}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
                    }}
                />
            </a>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 text-left"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
                                <img 
                                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                                    className="w-5 h-5 object-contain"
                                    alt="favicon"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug mb-0.5">
                                    {source.title || 'Web Source'}
                                </h4>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                    <span className="truncate max-w-[80px] sm:max-w-[120px]">{domain}</span>
                                    <ExternalLink size={8} />
                                </div>
                            </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-8 border-transparent border-t-white dark:border-t-zinc-900 drop-shadow-sm" />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
};

const StreamingResponse: React.FC<StreamingResponseProps> = ({ content, isStreaming }) => {
    const [thought, setThought] = useState<string | null>(null);
    const [mainContent, setMainContent] = useState<string>('');
    const [isThoughtOpen, setIsThoughtOpen] = useState(false);
    const [sources, setSources] = useState<any>(null);

    useEffect(() => {
        let processedContent = content;

        // 1. Extract Sources
        // Use [\s\S]*? to match across newlines in case JSON is pretty-printed
        const sourcesMatch = processedContent.match(/<!-- SOURCES_JSON:([\s\S]*?) -->/);
        if (sourcesMatch) {
            try {
                setSources(JSON.parse(sourcesMatch[1]));
                // Remove sources block from content to prevent display issues
                processedContent = processedContent.replace(sourcesMatch[0], '');
            } catch (e) {
                console.error("Failed to parse sources JSON", e);
            }
        }

        // 2. Extract Thought
        const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/;
        const match = processedContent.match(thoughtRegex);

        if (match) {
            setThought(match[1].trim());
            setMainContent(processedContent.replace(match[0], '').trim());
        } else {
            // Handle streaming incomplete thought
            const startTag = '<thought>';
            if (processedContent.trim().startsWith(startTag)) {
                const contentWithoutStart = processedContent.replace(startTag, '');
                if (!processedContent.includes('</thought>')) {
                    setThought(contentWithoutStart);
                    setMainContent('');
                } else {
                    setThought(null);
                    setMainContent(processedContent);
                }
            } else {
                setThought(null);
                setMainContent(processedContent);
            }
        }
    }, [content]);

    // Pre-process content to replace [1] or [1, 2] with custom citation tags
    // Using simple regex that matches "[1]" or "[1, 2]" or "[1,2,3]"
    // We strictly match format without spaces around brackets to avoid some code arrays
    const processedMarkdown = mainContent.replace(
        /\[(\d+(?:,\s*\d+)*)\]/g,
        (match, capture) => {
            const ids = capture.split(',').map((s: string) => s.trim());
            return ids.map((id: string) => `<sup class="citation-ref">${id}</sup>`).join('');
        }
    );

    const components = {
        code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={oneLight}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        // Custom handler for citation badges
        sup({ node, className, children, ...props }: any) {
            // Check for our specific class
            if (className === 'citation-ref') {
                const id = String(children);
                return <CitationBadge id={id} sources={sources} />;
            }
            return <sup className={className} {...props}>{children}</sup>;
        }
    };

    return (
        <div className="space-y-4 w-full">
            {thought && (
                <div className="border border-indigo-100 dark:border-indigo-900/30 rounded-xl overflow-hidden bg-indigo-50/30 dark:bg-indigo-900/10">
                    <button
                        onClick={() => setIsThoughtOpen(!isThoughtOpen)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                    >
                        <BrainCircuit size={14} className={isStreaming ? "animate-pulse" : ""} />
                        <span>Thinking Process</span>
                        {isThoughtOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {isThoughtOpen && (
                        <div className="px-4 py-3 bg-white/50 dark:bg-black/20 border-t border-indigo-100 dark:border-indigo-900/30 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                >
                                    {thought}
                                </ReactMarkdown>
                            </div>
                            {isStreaming && !mainContent && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-indigo-400 animate-pulse" />}
                        </div>
                    )}
                </div>
            )}

            {mainContent && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={components}
                    >
                        {processedMarkdown}
                    </ReactMarkdown>
                </div>
            )}

            {/* Loading cursor if streaming and no content or finishing thought */}
            {isStreaming && !mainContent && !thought && (
                <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse px-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            )}
        </div>
    );
};

export default StreamingResponse;

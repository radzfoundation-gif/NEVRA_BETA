import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useOpenRouterStream } from '@/hooks/useOpenRouterStream';
import SlidingCubeLoader from '@/components/ui/SlidingCubeLoader';

/**
 * StreamingChat - Modular real-time streaming chat component
 * 
 * This component provides a self-contained streaming chat UI that can be
 * integrated into any page. Uses useOpenRouterStream hook for SSE.
 * 
 * Props:
 * - model: OpenRouter model ID (e.g., 'sonar', 'gpt-5', 'claude-sonnet')
 * - systemPrompt: Optional system message for context
 * - onMessageComplete: Callback when streaming completes with full content
 * - className: Additional CSS classes for the container
 */

interface Message {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface StreamingChatProps {
    model?: string;
    systemPrompt?: string;
    onMessageComplete?: (content: string) => void;
    className?: string;
    placeholder?: string;
}

export function StreamingChat({
    model = 'sonar',
    systemPrompt = 'You are Noir AI, a helpful and knowledgeable assistant.',
    onMessageComplete,
    className = '',
    placeholder = 'Ask anything...',
}: StreamingChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const {
        isStreaming,
        content: streamingContent,
        error,
        startStream,
        cancelStream,
        resetStream,
    } = useOpenRouterStream();

    // Auto-scroll to bottom when content updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    // Handle streaming completion
    useEffect(() => {
        if (!isStreaming && streamingContent && streamingContent.length > 0) {
            // Streaming just completed - add final message to history
            const assistantMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: streamingContent,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            onMessageComplete?.(streamingContent);
            resetStream();
        }
    }, [isStreaming, streamingContent, onMessageComplete, resetStream]);

    const handleSend = useCallback(async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isStreaming) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: trimmedInput,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Build messages array for API
        const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: trimmedInput },
        ];

        // Start streaming
        await startStream(model, apiMessages);
    }, [input, isStreaming, messages, model, systemPrompt, startStream]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Markdown code block renderer
    const CodeBlock = ({ node, inline, className: codeClassName, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(codeClassName || '');
        return !inline && match ? (
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ borderRadius: '0.5rem', margin: '0.5rem 0' }}
                {...props}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
            </code>
        );
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-2xl ${message.role === 'user'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white/80 dark:bg-zinc-800/80 text-gray-800 dark:text-gray-200 shadow-sm'
                                    }`}
                            >
                                {message.role === 'user' ? (
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{ code: CodeBlock }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Streaming Response */}
                {isStreaming && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                    >
                        <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white/80 dark:bg-zinc-800/80 text-gray-800 dark:text-gray-200 shadow-sm">
                            {streamingContent ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{ code: CodeBlock }}
                                    >
                                        {streamingContent}
                                    </ReactMarkdown>
                                    {/* Blinking cursor */}
                                    <span className="inline-block w-2 h-5 bg-teal-500 ml-1 animate-pulse rounded-sm" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <SlidingCubeLoader size={12} />
                                    <span className="text-sm">Noir is thinking...</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                    >
                        <AlertCircle size={18} />
                        <span className="text-sm">{error}</span>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-zinc-700 p-4">
                <div className="flex items-end gap-2 max-w-2xl mx-auto">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 resize-none px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 text-gray-800 dark:text-gray-200 placeholder-gray-400"
                        style={{ minHeight: '48px', maxHeight: '200px' }}
                    />

                    {isStreaming ? (
                        <button
                            onClick={cancelStream}
                            className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Stop generation"
                        >
                            <Square size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Send message"
                        >
                            <Send size={20} />
                        </button>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 mt-2">
                    Noir is AI and can make mistakes. Double-check important info.
                </p>
            </div>
        </div>
    );
}

export default StreamingChat;

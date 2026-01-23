import { useState, useRef, useCallback } from 'react';

/**
 * useOpenRouterStream - Custom hook for streaming LLM responses
 * 
 * SSE Event Format (from /api/chat/stream):
 * - event: delta -> data: { content: "token" }
 * - event: done  -> data: {}
 * - event: error -> data: { message: "error text" }
 * 
 * Cancel Support:
 * - Uses AbortController to cancel ongoing stream
 * - Call cancelStream() to abort
 */

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface StreamState {
    isStreaming: boolean;
    content: string;
    error: string | null;
}

interface UseOpenRouterStreamReturn extends StreamState {
    startStream: (model: string, messages: Message[]) => Promise<void>;
    cancelStream: () => void;
    resetStream: () => void;
}

export function useOpenRouterStream(): UseOpenRouterStreamReturn {
    const [state, setState] = useState<StreamState>({
        isStreaming: false,
        content: '',
        error: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const contentRef = useRef<string>('');

    /**
     * Start streaming from OpenRouter
     */
    const startStream = useCallback(async (model: string, messages: Message[]) => {
        // Cancel any existing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Reset state
        contentRef.current = '';
        setState({
            isStreaming: true,
            content: '',
            error: null,
        });

        // Create new AbortController
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ model, messages }),
                signal: abortControllerRef.current.signal,
            });

            // Handle non-streaming error responses
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            // Read SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // Decode chunk and add to buffer
                buffer += decoder.decode(value, { stream: true });

                // Process complete events (separated by \n\n)
                const events = buffer.split('\n\n');
                buffer = events.pop() || ''; // Keep incomplete event in buffer

                for (const eventBlock of events) {
                    if (!eventBlock.trim()) continue;

                    const lines = eventBlock.split('\n');
                    let eventType = '';
                    let eventData = '';

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventType = line.slice(6).trim();
                        } else if (line.startsWith('data:')) {
                            eventData = line.slice(5).trim();
                        }
                        // Ignore comment lines (start with ':')
                    }

                    // Process event based on type
                    if (eventType === 'delta' && eventData) {
                        try {
                            const parsed = JSON.parse(eventData);
                            if (parsed.content) {
                                contentRef.current += parsed.content;
                                setState(prev => ({
                                    ...prev,
                                    content: contentRef.current,
                                }));
                            }
                        } catch {
                            console.warn('[useOpenRouterStream] Failed to parse delta:', eventData);
                        }
                    } else if (eventType === 'done') {
                        // Stream completed normally
                        setState(prev => ({
                            ...prev,
                            isStreaming: false,
                        }));
                    } else if (eventType === 'error') {
                        try {
                            const parsed = JSON.parse(eventData);
                            setState(prev => ({
                                ...prev,
                                isStreaming: false,
                                error: parsed.message || 'Stream error',
                            }));
                        } catch {
                            setState(prev => ({
                                ...prev,
                                isStreaming: false,
                                error: 'Stream error',
                            }));
                        }
                    }
                }
            }

            // Ensure streaming is marked as complete
            setState(prev => ({
                ...prev,
                isStreaming: false,
            }));

        } catch (error: any) {
            if (error.name === 'AbortError') {
                // User cancelled - not an error
                setState(prev => ({
                    ...prev,
                    isStreaming: false,
                }));
            } else {
                console.error('[useOpenRouterStream] Error:', error);
                setState(prev => ({
                    ...prev,
                    isStreaming: false,
                    error: error.message || 'Stream failed',
                }));
            }
        } finally {
            abortControllerRef.current = null;
        }
    }, []);

    /**
     * Cancel ongoing stream
     */
    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setState(prev => ({
            ...prev,
            isStreaming: false,
        }));
    }, []);

    /**
     * Reset stream state
     */
    const resetStream = useCallback(() => {
        cancelStream();
        contentRef.current = '';
        setState({
            isStreaming: false,
            content: '',
            error: null,
        });
    }, [cancelStream]);

    return {
        ...state,
        startStream,
        cancelStream,
        resetStream,
    };
}

export default useOpenRouterStream;

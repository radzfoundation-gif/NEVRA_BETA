import { useCallback } from 'react';
import { useOpenRouterStream } from './useOpenRouterStream';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export function useDualStream() {
    const streamA = useOpenRouterStream();
    const streamB = useOpenRouterStream();

    const startDualStream = useCallback(async (
        modelA: string, 
        modelB: string, 
        messages: Message[]
    ) => {
        // Run both in parallel
        await Promise.all([
            streamA.startStream(modelA, messages),
            streamB.startStream(modelB, messages)
        ]);
    }, [streamA, streamB]);

    const cancelDualStream = useCallback(() => {
        streamA.cancelStream();
        streamB.cancelStream();
    }, [streamA, streamB]);

    const resetDualStream = useCallback(() => {
        streamA.resetStream();
        streamB.resetStream();
    }, [streamA, streamB]);

    return {
        streamA,
        streamB,
        isStreaming: streamA.isStreaming || streamB.isStreaming,
        error: streamA.error || streamB.error,
        startDualStream,
        cancelDualStream,
        resetDualStream
    };
}

export default useDualStream;

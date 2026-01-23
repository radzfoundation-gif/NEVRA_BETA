export type AIEventStatus = 'searching' | 'analyzing' | 'generating' | 'done';

export interface AIEvent {
    type: 'status_change' | 'log_activity' | 'source_found' | 'token_stream' | 'done';
    payload: any;
}

export interface ActivityLog {
    id: string;
    message: string;
    timestamp: number;
    icon?: string;
    status: 'pending' | 'active' | 'complete';
}

export interface Source {
    id: string;
    domain: string;
    title: string;
    url: string;
    snippet?: string;
}

type AIEventCallback = (event: AIEvent) => void;

class AIEventManager {
    private listeners: AIEventCallback[] = [];
    private currentStatus: AIEventStatus = 'searching';
    private controller: AbortController | null = null;
    private streamId: string | null = null;

    subscribe(callback: AIEventCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    private emit(event: AIEvent) {
        this.listeners.forEach(cb => cb(event));
    }

    private generateId() {
        return Math.random().toString(36).substring(7);
    }

    private extractKeywords(query: string): string[] {
        const stopWords = ['how', 'to', 'what', 'is', 'a', 'the', 'of', 'in', 'on', 'for', 'with', 'create', 'build', 'write', 'explain'];
        return query.toLowerCase().split(' ')
            .filter(w => !stopWords.includes(w) && w.length > 3)
            .slice(0, 3); // Take top 3 keywords
    }

    /**
     * Simulate a realistic AI pipeline
     */
    async simulatePipeline(query: string, streamId: string) {
        // Abort previous simulation if active
        // Initialize new controller for this run
        // (In a real class, you'd manage aborts better, here assuming one active stream per instance or usage mainly in effect)

        this.streamId = streamId;
        const keywords = this.extractKeywords(query);
        const topic = keywords.join(' ') || 'topic';

        // PHASE 1: SEARCHING
        this.emit({ type: 'status_change', payload: 'searching' });

        await this.wait(600);
        this.emit({ type: 'log_activity', payload: { id: this.generateId(), message: `Parsing query for intent: "${topic}"...`, status: 'complete' } });

        await this.wait(800);
        this.emit({ type: 'log_activity', payload: { id: this.generateId(), message: `Searching web sources for: ${topic}`, status: 'active' } });

        await this.wait(1200);

        // Mock Sources
        const mockDomains = ['docs.dev', 'stackoverflow.com', 'github.com', 'medium.com'];
        const sourcesCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 sources

        for (let i = 0; i < sourcesCount; i++) {
            const domain = mockDomains[Math.floor(Math.random() * mockDomains.length)];
            this.emit({
                type: 'source_found',
                payload: {
                    id: this.generateId(),
                    domain,
                    title: `${topic} - ${domain} Guide`,
                    url: `https://${domain}/${topic.replace(/\s+/g, '-')}`
                }
            });
            await this.wait(400);
        }

        // PHASE 2: ANALYZING
        this.emit({ type: 'status_change', payload: 'analyzing' });
        this.emit({ type: 'log_activity', payload: { id: this.generateId(), message: `Reading content from found sources...`, status: 'active' } });

        await this.wait(1500);
        this.emit({ type: 'log_activity', payload: { id: this.generateId(), message: `Synthesizing information...`, status: 'complete' } });

        // PHASE 3: GENERATING
        await this.wait(800);
        this.emit({ type: 'status_change', payload: 'generating' });

        // Note: The actual text generation is handled by the caller pushing 'token_stream' events
        // OR we simulate it here if we want full pure simulation.
        // Assuming the UI will receive the real text stream separately via 'handleSend' but we coordinate the 'done' event?
        // User request says "simulatePipeline(query)".
        // If we are simulating EVERYTHING including text, we emit mock tokens.
        // But likely the user wants the VISUALS to be simulated while the REAL API generates text?
        // Or if the API is not streaming, we simulate streaming from the full response.

        // Let's assume this manager just manages the "pre-generation" activity phases heavily,
        // and then hands off or we pipe tokens through it. 
        // For a true "Skeleton replacement", we need to emit 'token_stream' events.
    }

    /**
     * Simulate streaming text output
     */
    async streamText(text: string) {
        this.emit({ type: 'status_change', payload: 'generating' });

        // Split by chunks (simulating tokens - smaller chunks = smoother)
        const chunkSize = 2;
        for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = text.slice(i, i + chunkSize);
            this.emitToken(chunk);
            // Dynamic delay: varied for realism but consistent enough for smoothness
            // Average ~15ms per 2 chars = ~8000 chars/min (quite fast but readable)
            const delay = Math.random() * 20 + 5;
            await this.wait(delay);
        }
    }

    /**
     * Call this when real API returns text chunk
     */
    emitToken(token: string) {
        this.emit({ type: 'token_stream', payload: token });
    }

    /**
     * Call this when complete
     */
    complete() {
        this.emit({ type: 'status_change', payload: 'done' });
        this.emit({ type: 'done', payload: {} });
    }

    private wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const aiEventManager = new AIEventManager();

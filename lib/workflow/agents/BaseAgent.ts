import { WorkflowContext } from '../types';

/**
 * Base Agent Interface
 * All agents must implement this interface
 */
export interface IAgent {
  /**
   * Execute the agent's task
   */
  execute(context: WorkflowContext, input: any): Promise<any>;

  /**
   * Get agent name
   */
  getName(): string;

  /**
   * Get required model/provider
   */
  getRequiredModel(): string;
}

/**
 * Base Agent Abstract Class
 * Provides common functionality for all agents
 */
export abstract class BaseAgent implements IAgent {
  protected model: string;
  protected apiBase: string;

  constructor(model: string) {
    this.model = model;
    this.apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  abstract execute(context: WorkflowContext, input: any): Promise<any>;
  abstract getName(): string;
  abstract getRequiredModel(): string;

  /**
   * Call LLM API with enhanced system prompt
   * Includes retry logic with exponential backoff for rate limiting
   */
  protected async callLLM(
    prompt: string,
    systemPrompt: string,
    context: WorkflowContext,
    mode: 'builder' | 'tutor' = 'tutor',
    maxRetries: number = 3
  ): Promise<string> {
    // systemPrompt is already the final/enhanced version

    let lastError: Error | null = null;

    // Default maxRetries 5 for faster response
    const effectiveMaxRetries = maxRetries === 3 ? 5 : maxRetries;

    for (let attempt = 0; attempt < effectiveMaxRetries; attempt++) {
      try {
        const response = await fetch(`${this.apiBase}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            history: context.history,
            mode,
            provider: this.model,
            images: context.images || [],
            systemPrompt: systemPrompt,
          }),
        });

        // Handle rate limiting (429) and server errors (5xx) with retry
        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          const retryAfter = response.headers.get('Retry-After');
          // Exponential backoff with jitter: start at 3s, max 60s
          const baseWait = Math.min(3000 * Math.pow(2, attempt), 60000); // Start 3s, max 60s
          const jitter = Math.random() * 2000;
          const waitTime = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : baseWait + jitter;

          if (attempt < effectiveMaxRetries - 1) {
            console.warn(`${this.getName()}: Rate limited/Server error (${response.status}), retrying in ${Math.round(waitTime)}ms (attempt ${attempt + 1}/${effectiveMaxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        if (!response.ok) {
          const errorText = response.statusText || `HTTP ${response.status}`;
          throw new Error(`LLM call failed: ${errorText}`);
        }

        const data = await response.json();

        // Handle different response formats
        if (data.content) {
          return data.content;
        } else if (typeof data === 'string') {
          return data;
        } else {
          return JSON.stringify(data);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If it's a rate limit error and we have retries left, wait and retry
        if (lastError.message.includes('Too Many Requests') || lastError.message.includes('429')) {
          if (attempt < effectiveMaxRetries - 1) {
            const baseWait = Math.min(1000 * Math.pow(2, attempt), 30000);
            const jitter = Math.random() * 1000;
            const waitTime = baseWait + jitter;
            console.warn(`${this.getName()}: Rate limited (caught), retrying in ${Math.round(waitTime)}ms (attempt ${attempt + 1}/${effectiveMaxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // If it's the last attempt or non-retryable error, throw
        if (attempt === effectiveMaxRetries - 1) {
          throw lastError;
        }
      }
    }

    // Should never reach here, but just in case
    throw lastError || new Error('LLM call failed: Unknown error');
  }

  /**
   * Estimate token count (rough: ~4 chars per token)
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

import { MemoryEntry, WorkflowResult } from '../types';
import { saveToMemory, retrieveRelevantMemory } from '../memoryManager';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';
import { WORKFLOW_CONFIG } from '../config';
import { getMCPClient } from '../../mcp/client';

/**
 * Memory Engine
 * Enhanced memory management with intelligent retrieval and updates
 * Now uses MCP for standardized resource access
 */
export class MemoryEngine {
  /**
   * Save workflow result to memory with enhanced metadata
   */
  static async saveWorkflowResult(
    sessionId: string,
    userId: string | undefined,
    prompt: string,
    result: WorkflowResult,
    intentAnalysis: IntentAnalysis
  ): Promise<void> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return;
    }

    try {
      // Enhanced memory entry with intent analysis
      const memoryEntry: Omit<MemoryEntry, 'timestamp'> = {
        sessionId,
        userId,
        prompt,
        response: result.response,
        code: result.code,
        plan: result.plan,
        review: result.review,
        metadata: {
          ...result.metadata,
          intent: intentAnalysis.primaryIntent,
          confidence: intentAnalysis.confidence,
          requirements: intentAnalysis.requirements,
          qualityScore: result.metadata?.qualityScore,
          executionAttempts: result.metadata?.executionAttempts,
          revisionAttempts: result.metadata?.revisionAttempts,
          finalState: result.metadata?.finalState,
        },
      };

      // Try MCP first, fallback to direct save
      if (userId && WORKFLOW_CONFIG.enableMCP) {
        try {
          const mcpClient = getMCPClient();
          await mcpClient.saveUserMemory(userId, memoryEntry);

          if (WORKFLOW_CONFIG.logStages) {
            console.log('💾 MemoryEngine: Workflow result saved via MCP', {
              sessionId,
              intent: intentAnalysis.primaryIntent,
              qualityScore: result.metadata?.qualityScore,
            });
          }
          return;
        } catch (mcpError) {
          console.warn('MCP save failed, falling back to direct save:', mcpError);
        }
      }

      // Fallback to direct save
      await saveToMemory(memoryEntry);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('💾 MemoryEngine: Workflow result saved', {
          sessionId,
          intent: intentAnalysis.primaryIntent,
          qualityScore: result.metadata?.qualityScore,
        });
      }
    } catch (error) {
      console.error('MemoryEngine: Error saving workflow result', error);
      // Don't throw - memory save is non-critical
    }
  }

  /**
   * Retrieve relevant memory entries based on intent and context
   */
  static async retrieveRelevantMemory(
    prompt: string,
    sessionId: string,
    userId: string | undefined,
    intentAnalysis: IntentAnalysis,
    limit: number = WORKFLOW_CONFIG.memoryRetrievalLimit
  ): Promise<MemoryEntry[]> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return [];
    }

    try {
      let memories: MemoryEntry[] = [];

      // Try MCP first if enabled and userId available
      if (userId && WORKFLOW_CONFIG.enableMCP) {
        try {
          const mcpClient = getMCPClient();
          memories = await mcpClient.getUserMemories(userId, limit);

          if (WORKFLOW_CONFIG.logStages) {
            console.log('🔍 MemoryEngine: Retrieved memories via MCP', {
              total: memories.length,
              userId,
            });
          }
        } catch (mcpError) {
          console.warn('MCP retrieval failed, falling back to direct retrieval:', mcpError);
        }
      }

      // Fallback to direct retrieval if MCP failed or not enabled
      if (memories.length === 0) {
        memories = await retrieveRelevantMemory(prompt, sessionId, userId, limit);
      }

      // Filter and rank by relevance
      const relevantMemories = this.rankByRelevance(memories, intentAnalysis);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('🔍 MemoryEngine: Retrieved relevant memories', {
          total: memories.length,
          relevant: relevantMemories.length,
          intent: intentAnalysis.primaryIntent,
        });
      }

      return relevantMemories;
    } catch (error) {
      console.error('MemoryEngine: Error retrieving memory', error);
      return [];
    }
  }

  /**
   * Rank memories by relevance to current intent
   */
  private static rankByRelevance(
    memories: MemoryEntry[],
    intentAnalysis: IntentAnalysis
  ): MemoryEntry[] {
    return memories
      .map(memory => ({
        memory,
        score: this.calculateRelevanceScore(memory, intentAnalysis),
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.memory);
  }

  /**
   * Calculate relevance score for a memory entry
   */
  private static calculateRelevanceScore(
    memory: MemoryEntry,
    intentAnalysis: IntentAnalysis
  ): number {
    let score = 0;

    // Intent match
    if (memory.metadata?.intent === intentAnalysis.primaryIntent) {
      score += 0.5;
    }

    // Framework match
    if (
      memory.metadata?.requirements?.framework &&
      intentAnalysis.requirements.framework &&
      memory.metadata.requirements.framework === intentAnalysis.requirements.framework
    ) {
      score += 0.3;
    }

    // Component match
    if (
      memory.metadata?.requirements?.components &&
      intentAnalysis.requirements.components
    ) {
      const commonComponents = memory.metadata.requirements.components.filter((c: string) =>
        intentAnalysis.requirements.components?.includes(c)
      );
      score += (commonComponents.length / (intentAnalysis.requirements.components.length || 1)) * 0.2;
    }

    // Quality score (prefer high-quality memories)
    if (memory.metadata?.qualityScore) {
      score += memory.metadata.qualityScore * 0.2;
    }

    // Recency (prefer recent memories)
    if (memory.timestamp) {
      const age = Date.now() - new Date(memory.timestamp).getTime();
      const daysSince = age / (1000 * 60 * 60 * 24);
      score += Math.max(0, 0.1 * (1 - daysSince / 30)); // Decay over 30 days
    }

    return Math.min(1, score);
  }

  /**
   * Update memory with new information
   */
  static async updateMemory(
    sessionId: string,
    userId: string | undefined,
    updates: Partial<MemoryEntry>
  ): Promise<void> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return;
    }

    try {
      // This would update existing memory entries
      // Implementation depends on your database schema
      if (WORKFLOW_CONFIG.logStages) {
        console.log('🔄 MemoryEngine: Memory updated', {
          sessionId,
          updates: Object.keys(updates),
        });
      }
    } catch (error) {
      console.error('MemoryEngine: Error updating memory', error);
    }
  }

  /**
   * Get memory context for agent injection
   */
  static getMemoryContext(memories: MemoryEntry[]): string {
    if (memories.length === 0) {
      return '';
    }

    const contextParts: string[] = [];

    memories.forEach((memory, index) => {
      contextParts.push(`\n[Previous Interaction ${index + 1}]`);
      contextParts.push(`Prompt: ${memory.prompt.substring(0, 200)}`);
      if (memory.code) {
        contextParts.push(`Code: ${memory.code.substring(0, 300)}`);
      }
      if (memory.metadata?.intent) {
        contextParts.push(`Intent: ${memory.metadata.intent}`);
      }
    });

    return contextParts.join('\n');
  }
}

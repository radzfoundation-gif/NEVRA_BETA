import { AgentMemoryEntry } from '../types';
import { SelfReflectionResult } from '../agents/SelfReflectionAgent';
import { WorkflowResult } from '../types';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';
// Supabase removed - using in-memory cache
import { WORKFLOW_CONFIG } from '../config';

// In-memory cache for agent memory
const agentMemoryCache: Map<string, AgentMemoryEntry[]> = new Map();

/**
 * Agent Memory Engine
 * Stores and retrieves self-reflection results for continuous learning
 * Note: Now uses in-memory storage (Supabase removed)
 */
export class AgentMemoryEngine {
  /**
   * Save agent memory (self-reflection)
   */
  static async saveAgentMemory(
    sessionId: string,
    userId: string | undefined,
    intentAnalysis: IntentAnalysis,
    reflection: SelfReflectionResult,
    workflowResult: WorkflowResult
  ): Promise<void> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return;
    }

    try {
      const agentMemory: AgentMemoryEntry = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        userId,
        timestamp: new Date(),
        intent: intentAnalysis.primaryIntent,
        whatWorked: reflection.whatWorked,
        whatFailed: reflection.whatFailed,
        whatToImprove: reflection.whatToImprove,
        lessonsLearned: reflection.lessonsLearned,
        qualityScore: reflection.qualityScore,
        confidence: reflection.confidence,
        recommendations: reflection.recommendations,
        metadata: {
          executionAttempts: workflowResult.metadata?.executionAttempts,
          revisionAttempts: workflowResult.metadata?.revisionAttempts,
          stagesExecuted: workflowResult.metadata?.stagesExecuted,
          finalState: workflowResult.metadata?.finalState,
          intentConfidence: intentAnalysis.confidence,
          requirements: intentAnalysis.requirements,
        },
      };

      // Save to in-memory cache
      const cacheKey = userId || 'anonymous';
      const existing = agentMemoryCache.get(cacheKey) || [];
      existing.unshift(agentMemory);

      // Keep only last N entries per user
      if (existing.length > WORKFLOW_CONFIG.maxMemoryEntries) {
        existing.pop();
      }
      agentMemoryCache.set(cacheKey, existing);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('💾 AgentMemoryEngine: Reflection saved to memory cache', {
          sessionId,
          intent: agentMemory.intent,
          qualityScore: agentMemory.qualityScore,
        });
      }
    } catch (error) {
      console.error('AgentMemoryEngine: Error saving agent memory', error);
    }
  }

  /**
   * Retrieve relevant agent memory for learning
   */
  static async retrieveAgentMemory(
    intent: string,
    userId?: string,
    limit: number = 10
  ): Promise<AgentMemoryEntry[]> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return [];
    }

    try {
      const cacheKey = userId || 'anonymous';
      const memories = agentMemoryCache.get(cacheKey) || [];

      // Filter by intent and limit
      const filtered = memories
        .filter(m => m.intent === intent)
        .slice(0, limit);

      if (WORKFLOW_CONFIG.logStages && filtered.length > 0) {
        console.log('🔍 AgentMemoryEngine: Retrieved agent memories', {
          intent,
          count: filtered.length,
        });
      }

      return filtered;
    } catch (error) {
      console.error('AgentMemoryEngine: Error retrieving agent memory', error);
      return [];
    }
  }

  /**
   * Get improvement suggestions from agent memory
   */
  static getImprovementSuggestions(memories: AgentMemoryEntry[]): string[] {
    if (memories.length === 0) {
      return [];
    }

    const improvements: Record<string, number> = {};

    memories.forEach(memory => {
      memory.whatToImprove.forEach(improvement => {
        improvements[improvement] = (improvements[improvement] || 0) + 1;
      });
    });

    const sorted = Object.entries(improvements)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([improvement]) => improvement);

    return sorted;
  }

  /**
   * Get lessons learned from agent memory
   */
  static getLessonsLearned(memories: AgentMemoryEntry[]): string[] {
    if (memories.length === 0) {
      return [];
    }

    const lessons: Record<string, number> = {};

    memories.forEach(memory => {
      memory.lessonsLearned.forEach(lesson => {
        lessons[lesson] = (lessons[lesson] || 0) + 1;
      });
    });

    const sorted = Object.entries(lessons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lesson]) => lesson);

    return sorted;
  }
}

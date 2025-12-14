import { AgentMemoryEntry } from '../types';
import { SelfReflectionResult } from '../agents/SelfReflectionAgent';
import { WorkflowResult } from '../types';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';
import { supabase } from '../../supabase';
import { WORKFLOW_CONFIG } from '../config';

/**
 * Agent Memory Engine
 * Stores and retrieves self-reflection results for continuous learning
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
      if (!supabase) {
        console.warn('Supabase not initialized, skipping agent memory save');
        return;
      }

      const agentMemory: Omit<AgentMemoryEntry, 'id' | 'timestamp'> = {
        sessionId,
        userId,
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

      // Save to Supabase (assuming 'agent_memory' table exists)
      // Note: This is a placeholder - actual implementation depends on your Supabase schema
      const { error } = await supabase
        .from('agent_memory')
        .insert({
          session_id: agentMemory.sessionId,
          user_id: agentMemory.userId,
          timestamp: new Date().toISOString(),
          intent: agentMemory.intent,
          what_worked: agentMemory.whatWorked,
          what_failed: agentMemory.whatFailed,
          what_to_improve: agentMemory.whatToImprove,
          lessons_learned: agentMemory.lessonsLearned,
          quality_score: agentMemory.qualityScore,
          confidence: agentMemory.confidence,
          recommendations: agentMemory.recommendations,
          metadata: agentMemory.metadata,
        });

      if (error) {
        // If table doesn't exist, just log (non-critical)
        if (WORKFLOW_CONFIG.logStages) {
          console.warn('Agent memory table may not exist, logging reflection:', {
            sessionId,
            intent: agentMemory.intent,
            qualityScore: agentMemory.qualityScore,
          });
        }
      } else {
        if (WORKFLOW_CONFIG.logStages) {
          console.log('💾 AgentMemoryEngine: Reflection saved', {
            sessionId,
            intent: agentMemory.intent,
            qualityScore: agentMemory.qualityScore,
            whatWorked: agentMemory.whatWorked.length,
            whatFailed: agentMemory.whatFailed.length,
            whatToImprove: agentMemory.whatToImprove.length,
          });
        }
      }
    } catch (error) {
      console.error('AgentMemoryEngine: Error saving agent memory', error);
      // Don't throw - agent memory save is non-critical
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
      if (!supabase) {
        return [];
      }

      // Query agent memory by intent and user
      let query = supabase
        .from('agent_memory')
        .select('*')
        .eq('intent', intent)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        // Table may not exist yet
        return [];
      }

      // Transform to AgentMemoryEntry format
      const memories: AgentMemoryEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        sessionId: row.session_id,
        userId: row.user_id,
        timestamp: new Date(row.timestamp),
        intent: row.intent,
        whatWorked: row.what_worked || [],
        whatFailed: row.what_failed || [],
        whatToImprove: row.what_to_improve || [],
        lessonsLearned: row.lessons_learned || [],
        qualityScore: row.quality_score || 0.7,
        confidence: row.confidence || 0.5,
        recommendations: row.recommendations || [],
        metadata: row.metadata || {},
      }));

      if (WORKFLOW_CONFIG.logStages) {
        console.log('🔍 AgentMemoryEngine: Retrieved agent memories', {
          intent,
          count: memories.length,
        });
      }

      return memories;
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

    // Aggregate what to improve from recent memories
    const improvements: Record<string, number> = {};
    
    memories.forEach(memory => {
      memory.whatToImprove.forEach(improvement => {
        improvements[improvement] = (improvements[improvement] || 0) + 1;
      });
    });

    // Sort by frequency and return top suggestions
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

    // Aggregate lessons learned
    const lessons: Record<string, number> = {};
    
    memories.forEach(memory => {
      memory.lessonsLearned.forEach(lesson => {
        lessons[lesson] = (lessons[lesson] || 0) + 1;
      });
    });

    // Sort by frequency and return top lessons
    const sorted = Object.entries(lessons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lesson]) => lesson);

    return sorted;
  }
}

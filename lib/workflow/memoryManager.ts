import { MemoryEntry, WorkflowResult } from './types';
import { supabase } from '../supabase';
import { WORKFLOW_CONFIG } from './config';

/**
 * Save workflow result to memory
 */
export async function saveToMemory(
  entry: Omit<MemoryEntry, 'timestamp'>
): Promise<void> {
  if (!WORKFLOW_CONFIG.enableMemory) {
    return;
  }

  try {
    if (!supabase) {
      console.warn('Supabase not initialized, skipping memory save');
      return;
    }

    const memoryEntry: MemoryEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Save to Supabase (assuming a 'workflow_memory' table)
    // Note: This is a placeholder - actual implementation depends on your Supabase schema
    const { error } = await supabase
      .from('workflow_memory')
      .insert({
        session_id: memoryEntry.sessionId,
        user_id: memoryEntry.userId,
        timestamp: memoryEntry.timestamp.toISOString(),
        prompt: memoryEntry.prompt,
        response: memoryEntry.response,
        code: memoryEntry.code,
        plan: memoryEntry.plan ? JSON.stringify(memoryEntry.plan) : null,
        review: memoryEntry.review ? JSON.stringify(memoryEntry.review) : null,
        metadata: memoryEntry.metadata,
      });

    // Memory saving is handled by existing message storage
    // This is a placeholder for future dedicated workflow memory
    if (WORKFLOW_CONFIG.logStages) {
      console.log('💾 Memory: Workflow result logged', {
        sessionId: memoryEntry.sessionId,
      });
    }
  } catch (error) {
    console.error('Memory save error:', error);
    // Don't throw - memory save is non-critical
  }
}

/**
 * Retrieve relevant memory entries
 */
export async function retrieveRelevantMemory(
  prompt: string,
  sessionId: string,
  limit: number = WORKFLOW_CONFIG.memoryRetrievalLimit
): Promise<MemoryEntry[]> {
  if (!WORKFLOW_CONFIG.enableMemory) {
    return [];
  }

  try {
    if (!supabase) {
      return [];
    }

    // For now, retrieve from existing chat messages
    // Future: Can create dedicated workflow_memory table
    // This is a simplified implementation using existing message storage
    
    // Return empty for now - can be enhanced to retrieve from messages table
    // The existing message history in ChatInterface already provides context
    return [];
  } catch (error) {
    console.error('Memory retrieval error:', error);
    return [];
  }
}

/**
 * Save workflow result to memory (convenience function)
 */
export async function saveWorkflowResult(
  sessionId: string,
  userId: string | undefined,
  prompt: string,
  result: WorkflowResult
): Promise<void> {
  await saveToMemory({
    sessionId,
    userId,
    prompt,
    response: result.response,
    code: result.code,
    plan: result.plan,
    review: result.review,
    metadata: {
      ...result.metadata,
      stagesExecuted: result.metadata?.stagesExecuted || [],
    },
  });
}

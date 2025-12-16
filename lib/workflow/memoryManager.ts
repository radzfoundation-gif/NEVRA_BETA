import { MemoryEntry, WorkflowResult } from './types';
import { WORKFLOW_CONFIG } from './config';
import { saveUserMemory, getUserMemories } from '../firebaseDatabase';

// In-memory cache for workflow memory (legacy/fallback)
const memoryCache: Map<string, MemoryEntry[]> = new Map();

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
    const memoryEntry: MemoryEntry = {
      ...entry,
      timestamp: new Date(),
    };

    if (entry.userId) {
      await saveUserMemory(entry.userId, memoryEntry);
    } else {
      // Fallback to in-memory for anonymous users (though unlikely in this app's context)
      const cacheKey = 'anonymous';
      const existing = memoryCache.get(cacheKey) || [];
      existing.unshift(memoryEntry);
      if (existing.length > WORKFLOW_CONFIG.maxMemoryEntries) existing.pop();
      memoryCache.set(cacheKey, existing);
    }

    if (WORKFLOW_CONFIG.logStages) {
      console.log('💾 Memory: Workflow result logged', {
        sessionId: memoryEntry.sessionId,
      });
    }
  } catch (error) {
    console.error('Memory save error:', error);
  }
}

/**
 * Retrieve relevant memory entries
 */
export async function retrieveRelevantMemory(
  prompt: string,
  sessionId: string,
  userId: string | undefined,
  limit: number = WORKFLOW_CONFIG.memoryRetrievalLimit
): Promise<MemoryEntry[]> {
  if (!WORKFLOW_CONFIG.enableMemory || !userId) {
    return [];
  }

  try {
    const memories = await getUserMemories(userId, limit);
    return memories as MemoryEntry[];
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

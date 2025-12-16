import { NormalizedKnowledge } from '../processors/KnowledgeNormalizer';
// Supabase removed - using in-memory storage
import { WORKFLOW_CONFIG } from '../../workflow/config';

// In-memory cache for vector storage
const vectorCache: Map<string, NormalizedKnowledge> = new Map();

/**
 * Vector Store
 * Stores knowledge as vector embeddings for semantic search
 * Note: Now uses in-memory storage (Supabase removed)
 */
export class VectorStore {
  /**
   * Store knowledge with embeddings
   */
  static async store(
    knowledge: NormalizedKnowledge,
    embeddings?: number[]
  ): Promise<void> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return;
    }

    try {
      // Store in in-memory cache
      vectorCache.set(knowledge.id, {
        ...knowledge,
        embeddings: embeddings || undefined,
      } as NormalizedKnowledge);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('💾 VectorStore: Knowledge stored in memory', {
          id: knowledge.id,
          title: knowledge.title.substring(0, 50),
          tags: knowledge.tags.length,
        });
      }
    } catch (error) {
      console.error('VectorStore: Error storing knowledge', error);
    }
  }

  /**
   * Store batch
   */
  static async storeBatch(
    knowledgeList: NormalizedKnowledge[],
    embeddingsMap: Map<string, number[]> = new Map()
  ): Promise<void> {
    for (const knowledge of knowledgeList) {
      await this.store(knowledge, embeddingsMap.get(knowledge.id));
    }
  }

  /**
   * Search by similarity (basic text search - no vector DB)
   */
  static async searchSimilar(
    query: string,
    limit: number = 10
  ): Promise<NormalizedKnowledge[]> {
    try {
      const queryLower = query.toLowerCase();
      const results: NormalizedKnowledge[] = [];

      vectorCache.forEach(knowledge => {
        const titleMatch = knowledge.title.toLowerCase().includes(queryLower);
        const summaryMatch = knowledge.summary?.toLowerCase().includes(queryLower);
        const contentMatch = knowledge.content.toLowerCase().includes(queryLower);

        if (titleMatch || summaryMatch || contentMatch) {
          results.push(knowledge);
        }
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('VectorStore: Error searching', error);
      return [];
    }
  }
}

import { NormalizedKnowledge } from '../processors/KnowledgeNormalizer';
import { supabase } from '../../supabase';
import { WORKFLOW_CONFIG } from '../../workflow/config';

/**
 * Vector Store
 * Stores knowledge as vector embeddings for semantic search
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
      if (!supabase) {
        console.warn('Supabase not initialized, skipping vector store');
        return;
      }

      // Store in knowledge_base table (assuming it exists)
      const { error } = await supabase
        .from('knowledge_base')
        .insert({
          id: knowledge.id,
          title: knowledge.title,
          content: knowledge.content,
          summary: knowledge.summary,
          tags: knowledge.tags,
          categories: knowledge.categories,
          metadata: knowledge.metadata,
          embeddings: embeddings || null,
          created_at: new Date().toISOString(),
        });

      if (error) {
        // Table may not exist yet
        if (WORKFLOW_CONFIG.logStages) {
          console.warn('Knowledge base table may not exist, logging knowledge:', {
            id: knowledge.id,
            title: knowledge.title.substring(0, 50),
          });
        }
      } else {
        if (WORKFLOW_CONFIG.logStages) {
          console.log('💾 VectorStore: Knowledge stored', {
            id: knowledge.id,
            title: knowledge.title.substring(0, 50),
            tags: knowledge.tags.length,
          });
        }
      }
    } catch (error) {
      console.error('VectorStore: Error storing knowledge', error);
      // Don't throw - storage is non-critical
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
   * Search by similarity (placeholder - would use vector search)
   */
  static async searchSimilar(
    query: string,
    limit: number = 10
  ): Promise<NormalizedKnowledge[]> {
    if (!supabase) {
      return [];
    }

    try {
      // Simple text search (would be replaced with vector similarity search)
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        summary: row.summary,
        tags: row.tags || [],
        categories: row.categories || [],
        metadata: row.metadata || {},
        embeddings: row.embeddings,
      }));
    } catch (error) {
      console.error('VectorStore: Error searching', error);
      return [];
    }
  }
}

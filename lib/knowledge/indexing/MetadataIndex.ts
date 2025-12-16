import { NormalizedKnowledge } from '../processors/KnowledgeNormalizer';
// Supabase removed - using in-memory storage
import { WORKFLOW_CONFIG } from '../../workflow/config';

// In-memory cache for metadata index
const metadataCache: Map<string, MetadataIndex> = new Map();

/**
 * Metadata Index
 * Indexes knowledge metadata for fast retrieval
 */
export interface MetadataIndex {
  id: string;
  knowledgeId: string;
  tags: string[];
  categories: string[];
  sourceId: string;
  sourceName: string;
  qualityScore: number;
  relevance: number;
  publishedAt?: Date;
  indexedAt: Date;
}

export class MetadataIndexService {
  /**
   * Index knowledge metadata
   */
  static async index(knowledge: NormalizedKnowledge): Promise<void> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return;
    }

    try {
      const indexEntry: MetadataIndex = {
        id: `idx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        knowledgeId: knowledge.id,
        tags: knowledge.tags,
        categories: knowledge.categories,
        sourceId: knowledge.metadata.sourceId,
        sourceName: knowledge.metadata.sourceName,
        qualityScore: knowledge.metadata.qualityScore,
        relevance: knowledge.metadata.relevance,
        publishedAt: knowledge.metadata.publishedAt,
        indexedAt: new Date(),
      };

      // Store in memory
      metadataCache.set(knowledge.id, indexEntry);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('📇 MetadataIndex: Metadata indexed in memory', {
          knowledgeId: knowledge.id,
          tags: knowledge.tags.length,
          categories: knowledge.categories.length,
        });
      }
    } catch (error) {
      console.error('MetadataIndex: Error indexing', error);
    }
  }

  /**
   * Index batch
   */
  static async indexBatch(knowledgeList: NormalizedKnowledge[]): Promise<void> {
    for (const knowledge of knowledgeList) {
      await this.index(knowledge);
    }
  }

  /**
   * Search by tags
   */
  static async searchByTags(tags: string[], limit: number = 10): Promise<string[]> {
    try {
      const results: string[] = [];

      metadataCache.forEach((index, knowledgeId) => {
        const hasMatchingTags = tags.some(tag => index.tags.includes(tag));
        if (hasMatchingTags) {
          results.push(knowledgeId);
        }
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('MetadataIndex: Error searching by tags', error);
      return [];
    }
  }

  /**
   * Search by category
   */
  static async searchByCategory(category: string, limit: number = 10): Promise<string[]> {
    try {
      const results: string[] = [];

      metadataCache.forEach((index, knowledgeId) => {
        if (index.categories.includes(category)) {
          results.push(knowledgeId);
        }
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('MetadataIndex: Error searching by category', error);
      return [];
    }
  }
}

// Export for backward compatibility
export { MetadataIndexService as MetadataIndex };

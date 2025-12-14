import { NormalizedKnowledge } from '../processors/KnowledgeNormalizer';
import { supabase } from '../../supabase';
import { WORKFLOW_CONFIG } from '../../workflow/config';

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

export class MetadataIndex {
  /**
   * Index knowledge metadata
   */
  static async index(knowledge: NormalizedKnowledge): Promise<void> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return;
    }

    try {
      if (!supabase) {
        console.warn('Supabase not initialized, skipping metadata index');
        return;
      }

      // Store in metadata_index table
      const indexEntry: Omit<MetadataIndex, 'id' | 'indexedAt'> = {
        knowledgeId: knowledge.id,
        tags: knowledge.tags,
        categories: knowledge.categories,
        sourceId: knowledge.metadata.sourceId,
        sourceName: knowledge.metadata.sourceName,
        qualityScore: knowledge.metadata.qualityScore,
        relevance: knowledge.metadata.relevance,
        publishedAt: knowledge.metadata.publishedAt,
      };

      const { error } = await supabase
        .from('metadata_index')
        .insert({
          knowledge_id: indexEntry.knowledgeId,
          tags: indexEntry.tags,
          categories: indexEntry.categories,
          source_id: indexEntry.sourceId,
          source_name: indexEntry.sourceName,
          quality_score: indexEntry.qualityScore,
          relevance: indexEntry.relevance,
          published_at: indexEntry.publishedAt?.toISOString(),
          indexed_at: new Date().toISOString(),
        });

      if (error) {
        // Table may not exist yet
        if (WORKFLOW_CONFIG.logStages) {
          console.warn('Metadata index table may not exist, logging index:', {
            knowledgeId: knowledge.id,
            tags: knowledge.tags.length,
          });
        }
      } else {
        if (WORKFLOW_CONFIG.logStages) {
          console.log('📇 MetadataIndex: Metadata indexed', {
            knowledgeId: knowledge.id,
            tags: knowledge.tags.length,
            categories: knowledge.categories.length,
          });
        }
      }
    } catch (error) {
      console.error('MetadataIndex: Error indexing', error);
      // Don't throw - indexing is non-critical
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
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('metadata_index')
        .select('knowledge_id')
        .contains('tags', tags)
        .order('relevance', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return (data || []).map((row: any) => row.knowledge_id);
    } catch (error) {
      console.error('MetadataIndex: Error searching by tags', error);
      return [];
    }
  }

  /**
   * Search by category
   */
  static async searchByCategory(category: string, limit: number = 10): Promise<string[]> {
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('metadata_index')
        .select('knowledge_id')
        .contains('categories', [category])
        .order('quality_score', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return (data || []).map((row: any) => row.knowledge_id);
    } catch (error) {
      console.error('MetadataIndex: Error searching by category', error);
      return [];
    }
  }
}

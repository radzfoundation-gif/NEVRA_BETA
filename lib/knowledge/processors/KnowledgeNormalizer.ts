import { CuratedContent } from '../agents/CurationAgent';

/**
 * Normalized Knowledge
 */
export interface NormalizedKnowledge {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  categories: string[];
  metadata: {
    sourceId: string;
    sourceName: string;
    url: string;
    publishedAt?: Date;
    curatedAt: Date;
    qualityScore: number;
    relevance: number;
    [key: string]: any;
  };
  embeddings?: number[]; // Vector embeddings
}

/**
 * Knowledge Normalizer
 * Normalizes curated content into standardized knowledge format
 */
export class KnowledgeNormalizer {
  /**
   * Normalize curated content
   */
  static normalize(
    curated: CuratedContent,
    relevance: number = 0.5
  ): NormalizedKnowledge {
    return {
      id: curated.id,
      title: curated.curatedTitle,
      content: curated.curatedContent,
      summary: curated.summary,
      tags: this.normalizeTags(curated.tags),
      categories: this.normalizeCategories(curated.categories),
      metadata: {
        sourceId: curated.originalContent.sourceId,
        sourceName: curated.originalContent.sourceName,
        url: curated.originalContent.url,
        publishedAt: curated.originalContent.publishedAt,
        curatedAt: curated.curatedAt,
        qualityScore: curated.qualityScore,
        relevance,
        keyPoints: curated.keyPoints,
        relatedTopics: curated.relatedTopics,
        author: curated.originalContent.author,
      },
    };
  }

  /**
   * Normalize tags (lowercase, remove duplicates, sort)
   */
  private static normalizeTags(tags: string[]): string[] {
    return Array.from(new Set(
      tags
        .map(tag => tag.toLowerCase().trim())
        .filter(tag => tag.length > 0)
    )).sort();
  }

  /**
   * Normalize categories
   */
  private static normalizeCategories(categories: string[]): string[] {
    return Array.from(new Set(
      categories
        .map(cat => cat.toLowerCase().trim())
        .filter(cat => cat.length > 0)
    )).sort();
  }

  /**
   * Normalize batch
   */
  static normalizeBatch(
    curatedContents: CuratedContent[],
    relevanceScores: Map<string, number> = new Map()
  ): NormalizedKnowledge[] {
    return curatedContents.map(curated => 
      this.normalize(curated, relevanceScores.get(curated.id) || 0.5)
    );
  }
}

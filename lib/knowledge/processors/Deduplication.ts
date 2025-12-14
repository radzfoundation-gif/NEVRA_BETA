import { CuratedContent } from '../agents/CurationAgent';

/**
 * Deduplication
 * Removes duplicate content from knowledge base
 */
export class Deduplication {
  /**
   * Check if content is duplicate
   */
  static isDuplicate(
    newContent: CuratedContent,
    existingContents: CuratedContent[],
    similarityThreshold: number = 0.85
  ): { isDuplicate: boolean; duplicateId?: string; similarity?: number } {
    for (const existing of existingContents) {
      const similarity = this.calculateSimilarity(newContent, existing);
      
      if (similarity >= similarityThreshold) {
        return {
          isDuplicate: true,
          duplicateId: existing.id,
          similarity,
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Calculate similarity between two contents
   */
  private static calculateSimilarity(
    content1: CuratedContent,
    content2: CuratedContent
  ): number {
    let similarity = 0;
    let factors = 0;

    // Title similarity
    const titleSimilarity = this.textSimilarity(
      content1.curatedTitle.toLowerCase(),
      content2.curatedTitle.toLowerCase()
    );
    similarity += titleSimilarity * 0.3;
    factors += 0.3;

    // Summary similarity
    if (content1.summary && content2.summary) {
      const summarySimilarity = this.textSimilarity(
        content1.summary.toLowerCase(),
        content2.summary.toLowerCase()
      );
      similarity += summarySimilarity * 0.3;
      factors += 0.3;
    }

    // URL similarity (exact match)
    if (content1.originalContent.url === content2.originalContent.url) {
      similarity += 0.4;
      factors += 0.4;
    }

    // Tag overlap
    if (content1.tags.length > 0 && content2.tags.length > 0) {
      const commonTags = content1.tags.filter(tag => 
        content2.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
      const tagSimilarity = commonTags.length / Math.max(content1.tags.length, content2.tags.length);
      similarity += tagSimilarity * 0.1;
      factors += 0.1;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  private static textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));

    if (words1.size === 0 && words2.size === 0) return 1;
    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Remove duplicates from array
   */
  static removeDuplicates(
    contents: CuratedContent[],
    similarityThreshold: number = 0.85
  ): CuratedContent[] {
    const unique: CuratedContent[] = [];
    const seen = new Set<string>();

    for (const content of contents) {
      // Check URL first (fastest check)
      if (seen.has(content.originalContent.url)) {
        continue;
      }

      // Check similarity with existing unique contents
      const { isDuplicate } = this.isDuplicate(content, unique, similarityThreshold);
      
      if (!isDuplicate) {
        unique.push(content);
        seen.add(content.originalContent.url);
      }
    }

    return unique;
  }
}

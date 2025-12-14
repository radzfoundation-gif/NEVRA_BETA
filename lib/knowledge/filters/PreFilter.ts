import { FetchedContent } from '../fetchers/Fetcher';

/**
 * Pre-Filter
 * Initial filtering of fetched content before processing
 */
export interface FilterResult {
  passed: boolean;
  reason?: string;
  score?: number;
}

export class PreFilter {
  /**
   * Filter content based on quality and relevance
   */
  static filter(content: FetchedContent): FilterResult {
    // Minimum content length
    if (content.content.length < 100) {
      return {
        passed: false,
        reason: 'Content too short',
        score: 0,
      };
    }

    // Maximum content length (avoid processing huge content)
    if (content.content.length > 50000) {
      return {
        passed: false,
        reason: 'Content too long',
        score: 0,
      };
    }

    // Check for spam indicators
    if (this.isSpam(content)) {
      return {
        passed: false,
        reason: 'Spam detected',
        score: 0,
      };
    }

    // Calculate quality score
    const score = this.calculateQualityScore(content);

    // Minimum quality threshold
    if (score < 0.3) {
      return {
        passed: false,
        reason: 'Quality score too low',
        score,
      };
    }

    return {
      passed: true,
      score,
    };
  }

  /**
   * Check if content is spam
   */
  private static isSpam(content: FetchedContent): boolean {
    const spamIndicators = [
      /click here/i,
      /buy now/i,
      /limited time/i,
      /act now/i,
      /spam/i,
    ];

    const text = `${content.title} ${content.content}`.toLowerCase();
    const spamCount = spamIndicators.filter(pattern => pattern.test(text)).length;

    return spamCount > 2;
  }

  /**
   * Calculate quality score
   */
  private static calculateQualityScore(content: FetchedContent): number {
    let score = 0.5; // Base score

    // Title quality
    if (content.title && content.title.length > 10 && content.title.length < 200) {
      score += 0.1;
    }

    // Content length (optimal range)
    if (content.content.length >= 500 && content.content.length <= 10000) {
      score += 0.2;
    }

    // Has excerpt
    if (content.excerpt && content.excerpt.length > 50) {
      score += 0.1;
    }

    // Has author
    if (content.author) {
      score += 0.05;
    }

    // Has published date
    if (content.publishedAt) {
      score += 0.05;
    }

    // Metadata quality
    if (content.metadata.tags && content.metadata.tags.length > 0) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Filter multiple contents
   */
  static filterBatch(contents: FetchedContent[]): FetchedContent[] {
    return contents
      .map(content => ({
        content,
        filterResult: this.filter(content),
      }))
      .filter(({ filterResult }) => filterResult.passed)
      .map(({ content }) => content);
  }
}

import { BaseAgent } from '../../workflow/agents/BaseAgent';
import { FetchedContent } from '../fetchers/Fetcher';
import { TechWatcherResult } from './TechWatcherAgent';
import { WORKFLOW_CONFIG } from '../../workflow/config';

// Create a simple context for CurationAgent
const createSimpleContext = () => ({
  history: [],
  mode: 'tutor' as const,
  provider: 'anthropic' as const,
});

/**
 * Curation Agent
 * Curates and enhances content for knowledge base
 */
export interface CuratedContent {
  id: string;
  originalContent: FetchedContent;
  curatedTitle: string;
  curatedContent: string;
  summary: string;
  tags: string[];
  categories: string[];
  keyPoints: string[];
  relatedTopics: string[];
  qualityScore: number;
  curatedAt: Date;
}

export class CurationAgent extends BaseAgent {
  constructor(model: 'anthropic' | 'gemini' = 'anthropic') {
    super(model);
  }

  getName(): string {
    return 'CurationAgent';
  }

  getRequiredModel(): string {
    return 'GPT-OSS-20B (anthropic/gemini)';
  }

  async execute(
    context: any,
    input: { content: FetchedContent; watcherResult: TechWatcherResult }
  ): Promise<CuratedContent> {
    const { content, watcherResult } = input;

    try {
      if (WORKFLOW_CONFIG.logStages) {
        console.log('📚 CurationAgent: Curating content', {
          source: content.sourceName,
          title: content.title.substring(0, 50),
        });
      }

      // Create curation prompt
      const curationPrompt = this.createCurationPrompt(content, watcherResult);
      const systemPrompt = this.createSystemPrompt();

      // Call LLM with simple context
      const simpleContext = createSimpleContext();
      const curatedText = await this.callLLM(curationPrompt, systemPrompt, simpleContext, 'tutor');

      // Parse curated content
      const curated = this.parseCuratedContent(curatedText, content, watcherResult);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('✅ CurationAgent: Curation completed', {
          qualityScore: curated.qualityScore,
          tags: curated.tags.length,
          keyPoints: curated.keyPoints.length,
        });
      }

      return curated;
    } catch (error) {
      console.error('CurationAgent error:', error);
      return this.createDefaultCurated(content, watcherResult);
    }
  }

  /**
   * Create system prompt
   */
  private createSystemPrompt(): string {
    return `You are a Curation Agent specialized in curating and enhancing technology content for a knowledge base.

Your task is to:
1. Create a clear, concise title
2. Summarize the content effectively
3. Extract key points
4. Identify relevant tags and categories
5. Suggest related topics
6. Ensure content quality and accuracy

Format your response with clear sections for:
- Curated Title
- Summary
- Key Points
- Tags
- Categories
- Related Topics`;
  }

  /**
   * Create curation prompt
   */
  private createCurationPrompt(content: FetchedContent, watcherResult: TechWatcherResult): string {
    return `Curate this technology content for knowledge base:

Original Title: ${content.title}
Source: ${content.sourceName}
URL: ${content.url}

Content:
${content.content.substring(0, 4000)}

Tech Watcher Analysis:
- Relevance: ${watcherResult.relevance}
- Importance: ${watcherResult.importance}
- Tech Trends: ${watcherResult.techTrends.join(', ')}
- Key Insights: ${watcherResult.keyInsights.join('; ')}
- Reasoning: ${watcherResult.reasoning}

Please provide:
1. Curated Title: Clear, descriptive title
2. Summary: 2-3 sentence summary
3. Key Points: 3-5 main points
4. Tags: Relevant tags (comma-separated)
5. Categories: Categories (comma-separated)
6. Related Topics: Related topics (comma-separated)

Format your response clearly.`;
  }

  /**
   * Parse curated content
   */
  private parseCuratedContent(
    curatedText: string,
    content: FetchedContent,
    watcherResult: TechWatcherResult
  ): CuratedContent {
    // Extract curated title
    const titleMatch = curatedText.match(/curated title[:\s]*\n?([^\n]+)/i);
    const curatedTitle = titleMatch?.[1]?.trim() || content.title;

    // Extract summary
    const summaryMatch = curatedText.match(/summary[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n\n|key points|tags|$)/i);
    const summary = summaryMatch?.[1]?.trim() || content.excerpt || content.content.substring(0, 200);

    // Extract key points
    const pointsMatch = curatedText.match(/key points?[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n\n|tags|categories|$)/i);
    const keyPoints = pointsMatch
      ? pointsMatch[1].split(/\n[-•*]\s*/).filter(p => p.trim().length > 0).map(p => p.trim())
      : watcherResult.keyInsights;

    // Extract tags
    const tagsMatch = curatedText.match(/tags?[:\s]*\n?([^\n]+)/i);
    const tags = tagsMatch
      ? tagsMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0)
      : content.metadata.tags || [];

    // Extract categories
    const categoriesMatch = curatedText.match(/categor(?:y|ies)[:\s]*\n?([^\n]+)/i);
    const categories = categoriesMatch
      ? categoriesMatch[1].split(',').map(c => c.trim()).filter(c => c.length > 0)
      : content.metadata.categories || [];

    // Extract related topics
    const topicsMatch = curatedText.match(/related topics?[:\s]*\n?([^\n]+)/i);
    const relatedTopics = topicsMatch
      ? topicsMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    // Calculate quality score
    const qualityScore = Math.min(1, (
      (curatedTitle.length > 10 ? 0.2 : 0) +
      (summary.length > 50 ? 0.2 : 0) +
      (keyPoints.length > 0 ? 0.2 : 0) +
      (tags.length > 0 ? 0.2 : 0) +
      (watcherResult.relevance * 0.2)
    ));

    return {
      id: `${content.sourceId}-${Date.now()}`,
      originalContent: content,
      curatedTitle,
      curatedContent: content.content,
      summary,
      tags: [...tags, ...(content.metadata.tags || [])],
      categories: [...categories, ...(content.metadata.categories || [])],
      keyPoints,
      relatedTopics,
      qualityScore,
      curatedAt: new Date(),
    };
  }

  /**
   * Create default curated content
   */
  private createDefaultCurated(
    content: FetchedContent,
    watcherResult: TechWatcherResult
  ): CuratedContent {
    return {
      id: `${content.sourceId}-${Date.now()}`,
      originalContent: content,
      curatedTitle: content.title,
      curatedContent: content.content,
      summary: content.excerpt || content.content.substring(0, 200),
      tags: content.metadata.tags || [],
      categories: content.metadata.categories || [],
      keyPoints: watcherResult.keyInsights,
      relatedTopics: [],
      qualityScore: watcherResult.relevance,
      curatedAt: new Date(),
    };
  }
}

import { BaseAgent } from '../../workflow/agents/BaseAgent';
import { FetchedContent } from '../fetchers/Fetcher';
import { WORKFLOW_CONFIG } from '../../workflow/config';

// Create a simple context for TechWatcherAgent
const createSimpleContext = () => ({
  history: [],
  mode: 'tutor' as const,
  provider: 'anthropic' as const,
});

/**
 * Tech Watcher Agent
 * Monitors and analyzes technology trends from fetched content
 */
export interface TechWatcherResult {
  relevance: number; // 0-1
  techTrends: string[];
  keyInsights: string[];
  importance: 'low' | 'medium' | 'high';
  shouldCurate: boolean;
  reasoning: string;
}

export class TechWatcherAgent extends BaseAgent {
  constructor(model: 'anthropic' | 'gemini' = 'anthropic') {
    super(model);
  }

  getName(): string {
    return 'TechWatcherAgent';
  }

  getRequiredModel(): string {
    return 'GPT-OSS-20B (anthropic/gemini)';
  }

  async execute(
    context: any,
    input: { content: FetchedContent }
  ): Promise<TechWatcherResult> {
    const { content } = input;

    try {
      if (WORKFLOW_CONFIG.logStages) {
        console.log('👁️ TechWatcherAgent: Analyzing content', {
          source: content.sourceName,
          title: content.title.substring(0, 50),
        });
      }

      // Create analysis prompt
      const analysisPrompt = this.createAnalysisPrompt(content);
      const systemPrompt = this.createSystemPrompt();

      // Call LLM with simple context
      const simpleContext = createSimpleContext();
      const analysisText = await this.callLLM(analysisPrompt, systemPrompt, simpleContext, 'tutor');

      // Parse analysis
      const result = this.parseAnalysis(analysisText, content);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('✅ TechWatcherAgent: Analysis completed', {
          relevance: result.relevance,
          importance: result.importance,
          shouldCurate: result.shouldCurate,
        });
      }

      return result;
    } catch (error) {
      console.error('TechWatcherAgent error:', error);
      return this.createDefaultResult(content);
    }
  }

  /**
   * Create system prompt
   */
  private createSystemPrompt(): string {
    return `You are a Tech Watcher Agent specialized in monitoring technology trends, updates, and innovations.

Your task is to analyze content and determine:
1. Relevance to current technology landscape (0-1 score)
2. Technology trends mentioned
3. Key insights and takeaways
4. Importance level (low/medium/high)
5. Whether this content should be curated for knowledge base

Focus on:
- New features, updates, or releases
- Best practices and patterns
- Security updates or vulnerabilities
- Performance improvements
- Breaking changes or migrations
- Community insights and discussions

Provide structured analysis with clear reasoning.`;
  }

  /**
   * Create analysis prompt
   */
  private createAnalysisPrompt(content: FetchedContent): string {
    return `Analyze this technology content for trends and relevance:

Title: ${content.title}
Source: ${content.sourceName}
URL: ${content.url}
Published: ${content.publishedAt?.toLocaleDateString() || 'Unknown'}

Content:
${content.content.substring(0, 3000)}

Metadata:
${JSON.stringify(content.metadata, null, 2)}

Please provide:
1. Relevance Score (0-1): How relevant is this to current tech landscape?
2. Tech Trends: List key technology trends mentioned
3. Key Insights: Extract important insights or takeaways
4. Importance: low, medium, or high
5. Should Curate: true or false (should this be added to knowledge base?)
6. Reasoning: Brief explanation of your analysis

Format your response clearly with sections.`;
  }

  /**
   * Parse analysis response
   */
  private parseAnalysis(analysisText: string, content: FetchedContent): TechWatcherResult {
    // Extract relevance score
    const relevanceMatch = analysisText.match(/relevance[:\s]*([0-9.]+)/i) ||
                          analysisText.match(/score[:\s]*([0-9.]+)/i);
    const relevance = relevanceMatch ? Math.min(1, Math.max(0, parseFloat(relevanceMatch[1]))) : 0.5;

    // Extract tech trends
    const trendsMatch = analysisText.match(/tech trends?[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n\n|key insights|importance|$)/i);
    const techTrends = trendsMatch
      ? trendsMatch[1].split(/\n[-•*]\s*/).filter(t => t.trim().length > 0).map(t => t.trim())
      : [];

    // Extract key insights
    const insightsMatch = analysisText.match(/key insights?[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n\n|importance|should|$)/i);
    const keyInsights = insightsMatch
      ? insightsMatch[1].split(/\n[-•*]\s*/).filter(i => i.trim().length > 0).map(i => i.trim())
      : [];

    // Extract importance
    const importanceMatch = analysisText.match(/importance[:\s]*(low|medium|high)/i);
    const importance = (importanceMatch?.[1]?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high';

    // Extract should curate
    const curateMatch = analysisText.match(/should curate[:\s]*(true|false|yes|no)/i);
    const shouldCurate = curateMatch ? /true|yes/i.test(curateMatch[1]) : relevance > 0.6;

    // Extract reasoning
    const reasoningMatch = analysisText.match(/reasoning[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n\n|$)/i);
    const reasoning = reasoningMatch?.[1]?.trim() || 'Content analyzed for tech relevance';

    return {
      relevance,
      techTrends: techTrends.length > 0 ? techTrends : ['Technology update'],
      keyInsights: keyInsights.length > 0 ? keyInsights : ['Relevant technology content'],
      importance,
      shouldCurate,
      reasoning,
    };
  }

  /**
   * Create default result
   */
  private createDefaultResult(content: FetchedContent): TechWatcherResult {
    return {
      relevance: 0.5,
      techTrends: [],
      keyInsights: ['Content fetched from source'],
      importance: 'medium',
      shouldCurate: true,
      reasoning: 'Default analysis - processing error occurred',
    };
  }
}

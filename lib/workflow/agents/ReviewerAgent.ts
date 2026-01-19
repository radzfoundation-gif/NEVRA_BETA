import { BaseAgent } from './BaseAgent';
import { WorkflowContext, ReviewResult, ExecutionResult, EnhancedPlan } from '../types';
import { PromptEnhancer } from '../utils/PromptEnhancer';
import { WORKFLOW_CONFIG } from '../config';

import { AIProvider } from '../../ai';

/**
 * Reviewer Agent - Uses GPT-OSS-20B for code review
 */
export class ReviewerAgent extends BaseAgent {
  constructor(model: AIProvider = 'groq') {
    super(model);
  }

  getName(): string {
    return 'ReviewerAgent';
  }

  getRequiredModel(): string {
    return 'Gemini Flash Lite (groq)';
  }

  async execute(
    context: WorkflowContext,
    input: { executionResult: ExecutionResult; plan: EnhancedPlan | null }
  ): Promise<ReviewResult> {
    const { executionResult, plan } = input;

    try {
      if (WORKFLOW_CONFIG.logStages) {
        console.log('🔍 ReviewerAgent: Starting review', {
          model: this.model,
          hasPlan: !!plan,
          mode: context.mode,
        });
      }

      // Create review prompt
      const reviewPrompt = this.createReviewPrompt(executionResult, plan, context);
      const baseSystemPrompt = this.createReviewSystemPrompt(context.mode);

      // Enhance system prompt with user name and context awareness
      const contextAwareness = context.metadata?.contextAwareness
        ? JSON.parse(context.metadata.contextAwareness)
        : null;
      const userProfile = context.metadata?.userProfile
        ? JSON.parse(context.metadata.userProfile)
        : null;
      const intentAnalysis = context.metadata?.intentAnalysis
        ? JSON.parse(context.metadata.intentAnalysis)
        : null;

      const enhancedSystemPrompt = PromptEnhancer.enhanceSystemPrompt(
        baseSystemPrompt,
        contextAwareness,
        userProfile,
        intentAnalysis || { primaryIntent: 'code_generation', confidence: 0.5, requirements: {}, context: { hasCode: false, hasImages: false, hasErrors: false, isFollowUp: false }, secondaryIntents: [] }
      );

      // Call LLM with enhanced prompt
      const reviewText = await this.callLLM(reviewPrompt, enhancedSystemPrompt, context, 'tutor');

      // Parse review response
      const reviewData = this.parseReviewResponse(reviewText, executionResult, plan);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('✅ ReviewerAgent: Review completed', {
          qualityScore: reviewData.qualityScore,
          issues: reviewData.issues.length,
          suggestions: reviewData.suggestions.length,
          rejected: reviewData.rejected,
        });
      }

      return reviewData;
    } catch (error) {
      console.error('ReviewerAgent error:', error);
      return this.createBasicReview(executionResult, plan);
    }
  }

  private createReviewSystemPrompt(mode: 'builder' | 'tutor'): string {
    if (mode === 'builder') {
      return `You are a code reviewer. Review the provided code for:
1. Syntax errors and bugs
2. Code quality and best practices
3. Responsive design
4. Performance issues
5. Accessibility
6. Framework-specific best practices

Provide a quality score (0-1), list of issues with severity, and suggestions for improvement.
If the code needs improvement, provide an improved version.
If quality score < 0.6 or critical errors found, respond with "REJECT: [reason]" to trigger revision.`;
    } else {
      return `You are an educational content reviewer. Review the provided explanation for:
1. Accuracy and correctness
2. Clarity and understandability
3. Completeness
4. Educational value

Provide a quality score (0-1), list of issues, and suggestions for improvement.
If the explanation needs improvement, provide an improved version.
If quality score < 0.6 or critical errors found, respond with "REJECT: [reason]" to trigger revision.`;
    }
  }

  private createReviewPrompt(
    executionResult: ExecutionResult,
    plan: EnhancedPlan | null,
    context: WorkflowContext
  ): string {
    let prompt = `Review the following ${context.mode === 'builder' ? 'code' : 'explanation'}:\n\n`;

    if (context.mode === 'builder') {
      if (executionResult.files && executionResult.files.length > 0) {
        prompt += `Files:\n`;
        executionResult.files.forEach(file => {
          prompt += `\n${file.path}:\n\`\`\`\n${file.content.substring(0, 2000)}\n\`\`\`\n`;
        });
      } else if (executionResult.code) {
        prompt += `Code:\n\`\`\`\n${executionResult.code.substring(0, 2000)}\n\`\`\`\n`;
      }
    } else {
      if (executionResult.explanation) {
        prompt += `Explanation:\n${executionResult.explanation.substring(0, 2000)}\n`;
      }
    }

    if (plan) {
      prompt += `\nQuality Criteria:\n`;
      plan.qualityCriteria.forEach((criterion, index) => {
        prompt += `${index + 1}. ${criterion}\n`;
      });

      prompt += `\nReview Checklist:\n`;
      plan.reviewChecklist.forEach((item, index) => {
        prompt += `${index + 1}. ${item}\n`;
      });
    }

    prompt += `\nPlease provide:
1. Quality score (0-1)
2. List of issues with severity (error, warning, suggestion)
3. Suggestions for improvement
4. Improved version if needed
5. REJECTION DECISION: If quality score < 0.6 or critical errors found, respond with "REJECT: [reason]" to trigger revision`;

    return prompt;
  }

  private parseReviewResponse(
    reviewText: string,
    executionResult: ExecutionResult,
    plan: EnhancedPlan | null
  ): ReviewResult {
    const issues: ReviewResult['issues'] = [];
    const suggestions: string[] = [];
    let qualityScore = 0.8; // Default score
    let improvedCode: string | undefined;
    let improvedExplanation: string | undefined;
    let rejected = false;
    let rejectionReason: string | undefined;

    // Check for rejection decision
    const rejectMatch = reviewText.match(/REJECT[:\s]+(.+?)(?=\n|$)/i);
    if (rejectMatch) {
      rejected = true;
      rejectionReason = rejectMatch[1].trim();
    }

    // Extract quality score
    const scoreMatch = reviewText.match(/quality\s*score[:\s]*([0-9.]+)/i) ||
      reviewText.match(/score[:\s]*([0-9.]+)/i);
    if (scoreMatch) {
      qualityScore = Math.min(1, Math.max(0, parseFloat(scoreMatch[1])));
    }

    // Auto-reject if quality score is very low
    if (qualityScore < 0.6 && !rejected) {
      rejected = true;
      rejectionReason = `Quality score too low (${qualityScore})`;
    }

    // Extract issues
    const issuePatterns = [
      /(error|warning|suggestion)[:\s]+(.+?)(?=\n|$)/gi,
      /(❌|⚠️|💡)\s*(.+?)(?=\n|$)/gi,
    ];

    issuePatterns.forEach(pattern => {
      const matches = reviewText.matchAll(pattern);
      for (const match of matches) {
        const severity = match[1].toLowerCase().includes('error') ? 'error' :
          match[1].toLowerCase().includes('warning') ? 'warning' : 'suggestion';
        issues.push({
          severity,
          message: match[2] || match[0],
        });
      }
    });

    // Extract suggestions
    const suggestionMatches = reviewText.match(/suggestion[s]?[:\s]*\n((?:[-•]\s*.+\n?)+)/i);
    if (suggestionMatches) {
      const suggestionLines = suggestionMatches[1].split('\n');
      suggestionLines.forEach(line => {
        const cleaned = line.replace(/^[-•]\s*/, '').trim();
        if (cleaned) suggestions.push(cleaned);
      });
    }

    // Extract improved version
    const improvedMatch = reviewText.match(/improved\s*(?:version|code|explanation)[:\s]*\n?```[\s\S]*?```/i) ||
      reviewText.match(/improved[:\s]*\n([\s\S]+?)(?=\n\n|\nQuality|\nScore|$)/i);
    if (improvedMatch) {
      const improved = improvedMatch[0].replace(/```[a-z]*\n?/g, '').trim();
      if (executionResult.code) {
        improvedCode = improved;
      } else if (executionResult.explanation) {
        improvedExplanation = improved;
      }
    }

    return {
      issues,
      qualityScore,
      suggestions: suggestions.length > 0 ? suggestions : ['No specific suggestions'],
      improvedCode,
      improvedExplanation,
      rejected,
      rejectionReason,
    };
  }

  private createBasicReview(
    executionResult: ExecutionResult,
    plan: EnhancedPlan | null
  ): ReviewResult {
    return {
      issues: [],
      qualityScore: 0.7, // Default score
      suggestions: ['Review completed with basic checks'],
    };
  }
}

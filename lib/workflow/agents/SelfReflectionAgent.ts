import { BaseAgent } from './BaseAgent';
import { WorkflowContext, ExecutionResult, ReviewResult, EnhancedPlan, WorkflowResult } from '../types';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';
import { PromptEnhancer } from '../utils/PromptEnhancer';
import { WORKFLOW_CONFIG } from '../config';

/**
 * Self-Reflection Result
 */
export interface SelfReflectionResult {
  whatWorked: string[];
  whatFailed: string[];
  whatToImprove: string[];
  lessonsLearned: string[];
  qualityScore: number;
  confidence: number;
  recommendations: string[];
}

/**
 * Self-Reflection Agent
 * Analyzes workflow output and generates reflection for continuous improvement
 */
export class SelfReflectionAgent extends BaseAgent {
  constructor(model: 'anthropic' | 'gemini' = 'anthropic') {
    super(model);
  }

  getName(): string {
    return 'SelfReflectionAgent';
  }

  getRequiredModel(): string {
    return 'GPT-OSS-20B (anthropic/gemini)';
  }

  async execute(
    context: WorkflowContext,
    input: {
      executionResult: ExecutionResult;
      reviewResult: ReviewResult | null;
      plan: EnhancedPlan | null;
      workflowResult: WorkflowResult;
      intentAnalysis: IntentAnalysis;
    }
  ): Promise<SelfReflectionResult> {
    const { executionResult, reviewResult, plan, workflowResult, intentAnalysis } = input;

    try {
      if (WORKFLOW_CONFIG.logStages) {
        console.log('🤔 SelfReflectionAgent: Starting reflection', {
          model: this.model,
          hasReview: !!reviewResult,
          hasPlan: !!plan,
        });
      }

      // Create reflection prompt
      const reflectionPrompt = this.createReflectionPrompt(
        executionResult,
        reviewResult,
        plan,
        workflowResult,
        intentAnalysis
      );

      const baseSystemPrompt = this.createReflectionSystemPrompt();

      // Enhance system prompt with user name and context awareness
      const contextAwareness = context.metadata?.contextAwareness
        ? JSON.parse(context.metadata.contextAwareness)
        : null;
      const userProfile = context.metadata?.userProfile
        ? JSON.parse(context.metadata.userProfile)
        : null;

      const enhancedSystemPrompt = PromptEnhancer.enhanceSystemPrompt(
        baseSystemPrompt,
        contextAwareness,
        userProfile,
        intentAnalysis
      );

      // Call LLM with enhanced prompt
      const reflectionText = await this.callLLM(reflectionPrompt, enhancedSystemPrompt, context, 'tutor');

      // Parse reflection response
      const reflection = this.parseReflectionResponse(reflectionText, executionResult, reviewResult);

      if (WORKFLOW_CONFIG.logStages) {
        console.log('✅ SelfReflectionAgent: Reflection completed', {
          whatWorked: reflection.whatWorked.length,
          whatFailed: reflection.whatFailed.length,
          whatToImprove: reflection.whatToImprove.length,
          qualityScore: reflection.qualityScore,
        });
      }

      return reflection;
    } catch (error) {
      console.error('SelfReflectionAgent error:', error);
      return this.createBasicReflection(executionResult, reviewResult);
    }
  }

  /**
   * Create reflection system prompt
   */
  private createReflectionSystemPrompt(): string {
    return `You are a Self-Reflection Agent for an AI workflow system. Your task is to analyze the workflow execution and provide honest, constructive reflection.

Analyze:
1. What worked well in this execution?
2. What failed or didn't work as expected?
3. What should be improved next time?
4. What lessons can be learned?

Be specific, actionable, and focus on continuous improvement. Consider:
- Code quality and correctness
- Plan execution
- Review effectiveness
- User intent fulfillment
- Performance and efficiency

Format your response clearly with sections for:
- What Worked
- What Failed
- What to Improve
- Lessons Learned
- Recommendations`;
  }

  /**
   * Create reflection prompt
   */
  private createReflectionPrompt(
    executionResult: ExecutionResult,
    reviewResult: ReviewResult | null,
    plan: EnhancedPlan | null,
    workflowResult: WorkflowResult,
    intentAnalysis: IntentAnalysis
  ): string {
    let prompt = `Analyze this workflow execution and provide reflection:\n\n`;

    prompt += `=== USER INTENT ===\n`;
    prompt += `Primary Intent: ${intentAnalysis.primaryIntent}\n`;
    prompt += `Confidence: ${intentAnalysis.confidence}\n`;
    prompt += `Requirements: ${JSON.stringify(intentAnalysis.requirements, null, 2)}\n\n`;

    if (plan) {
      prompt += `=== EXECUTION PLAN ===\n`;
      prompt += `Tasks: ${plan.tasks.length}\n`;
      prompt += `Execution Steps: ${plan.executionSteps.length}\n`;
      prompt += `Quality Criteria: ${plan.qualityCriteria.length}\n\n`;
    }

    prompt += `=== EXECUTION RESULT ===\n`;
    prompt += `Has Code: ${!!executionResult.code}\n`;
    prompt += `Has Files: ${!!executionResult.files?.length || 0}\n`;
    prompt += `Has Explanation: ${!!executionResult.explanation}\n`;
    prompt += `Execution Time: ${executionResult.metadata.executionTime}ms\n`;
    prompt += `Tokens Used: ${executionResult.metadata.tokensUsed}\n`;
    if (executionResult.code) {
      prompt += `Code Length: ${executionResult.code.length} chars\n`;
      prompt += `Code Preview: ${executionResult.code.substring(0, 500)}...\n`;
    }
    prompt += `\n`;

    if (reviewResult) {
      prompt += `=== REVIEW RESULT ===\n`;
      prompt += `Quality Score: ${reviewResult.qualityScore}\n`;
      prompt += `Rejected: ${reviewResult.rejected || false}\n`;
      prompt += `Issues: ${reviewResult.issues.length}\n`;
      prompt += `Suggestions: ${reviewResult.suggestions.length}\n`;
      if (reviewResult.issues.length > 0) {
        prompt += `Issues Details:\n`;
        reviewResult.issues.forEach((issue, i) => {
          prompt += `${i + 1}. [${issue.severity}] ${issue.message}\n`;
        });
      }
      prompt += `\n`;
    }

    prompt += `=== WORKFLOW METADATA ===\n`;
    prompt += `Execution Attempts: ${workflowResult.metadata?.executionAttempts || 0}\n`;
    prompt += `Revision Attempts: ${workflowResult.metadata?.revisionAttempts || 0}\n`;
    prompt += `Stages Executed: ${workflowResult.metadata?.stagesExecuted?.join(', ') || 'none'}\n`;
    prompt += `Final State: ${workflowResult.metadata?.finalState || 'unknown'}\n\n`;

    prompt += `=== REFLECTION QUESTIONS ===\n`;
    prompt += `Please analyze and answer:\n\n`;
    prompt += `1. WHAT WORKED?\n`;
    prompt += `   - What aspects of this execution were successful?\n`;
    prompt += `   - What went well in the planning, execution, or review?\n`;
    prompt += `   - What strengths were demonstrated?\n\n`;

    prompt += `2. WHAT FAILED?\n`;
    prompt += `   - What didn't work as expected?\n`;
    prompt += `   - Were there any errors, issues, or failures?\n`;
    prompt += `   - What weaknesses were identified?\n\n`;

    prompt += `3. WHAT TO IMPROVE NEXT TIME?\n`;
    prompt += `   - What specific improvements should be made?\n`;
    prompt += `   - How can the workflow be optimized?\n`;
    prompt += `   - What changes would increase quality or efficiency?\n\n`;

    prompt += `4. LESSONS LEARNED\n`;
    prompt += `   - What key insights were gained?\n`;
    prompt += `   - What patterns or best practices emerged?\n`;
    prompt += `   - What should be remembered for future executions?\n\n`;

    prompt += `Provide your reflection in a structured format with clear sections.`;

    return prompt;
  }

  /**
   * Parse reflection response
   */
  private parseReflectionResponse(
    reflectionText: string,
    executionResult: ExecutionResult,
    reviewResult: ReviewResult | null
  ): SelfReflectionResult {
    const whatWorked: string[] = [];
    const whatFailed: string[] = [];
    const whatToImprove: string[] = [];
    const lessonsLearned: string[] = [];
    const recommendations: string[] = [];

    // Extract "What Worked" section
    const workedMatch = reflectionText.match(/WHAT WORKED[:\s]*\n?([\s\S]*?)(?=\n\n|WHAT FAILED|WHAT TO IMPROVE|LESSONS|$)/i);
    if (workedMatch) {
      const workedText = workedMatch[1];
      const workedItems = workedText.split(/\n[-•*]\s*/).filter(item => item.trim().length > 0);
      whatWorked.push(...workedItems.map(item => item.trim()).filter(item => item.length > 10));
    }

    // Extract "What Failed" section
    const failedMatch = reflectionText.match(/WHAT FAILED[:\s]*\n?([\s\S]*?)(?=\n\n|WHAT TO IMPROVE|LESSONS|$)/i);
    if (failedMatch) {
      const failedText = failedMatch[1];
      const failedItems = failedText.split(/\n[-•*]\s*/).filter(item => item.trim().length > 0);
      whatFailed.push(...failedItems.map(item => item.trim()).filter(item => item.length > 10));
    }

    // Extract "What to Improve" section
    const improveMatch = reflectionText.match(/WHAT TO IMPROVE[:\s]*\n?([\s\S]*?)(?=\n\n|LESSONS|$)/i);
    if (improveMatch) {
      const improveText = improveMatch[1];
      const improveItems = improveText.split(/\n[-•*]\s*/).filter(item => item.trim().length > 0);
      whatToImprove.push(...improveItems.map(item => item.trim()).filter(item => item.length > 10));
    }

    // Extract "Lessons Learned" section
    const lessonsMatch = reflectionText.match(/LESSONS LEARNED[:\s]*\n?([\s\S]*?)(?=\n\n|RECOMMENDATIONS|$)/i);
    if (lessonsMatch) {
      const lessonsText = lessonsMatch[1];
      const lessonsItems = lessonsText.split(/\n[-•*]\s*/).filter(item => item.trim().length > 0);
      lessonsLearned.push(...lessonsItems.map(item => item.trim()).filter(item => item.length > 10));
    }

    // Extract recommendations
    const recommendationsMatch = reflectionText.match(/RECOMMENDATIONS[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i);
    if (recommendationsMatch) {
      const recText = recommendationsMatch[1];
      const recItems = recText.split(/\n[-•*]\s*/).filter(item => item.trim().length > 0);
      recommendations.push(...recItems.map(item => item.trim()).filter(item => item.length > 10));
    }

    // Calculate quality score based on review or execution
    const qualityScore = reviewResult?.qualityScore || executionResult.metadata.qualityScore || 0.7;

    // Calculate confidence based on reflection completeness
    const confidence = Math.min(1, (
      (whatWorked.length > 0 ? 0.25 : 0) +
      (whatFailed.length > 0 ? 0.25 : 0) +
      (whatToImprove.length > 0 ? 0.25 : 0) +
      (lessonsLearned.length > 0 ? 0.25 : 0)
    ));

    // Fallback: if no structured sections found, try to extract from general text
    if (whatWorked.length === 0 && whatFailed.length === 0 && whatToImprove.length === 0) {
      // Try to extract from numbered or bulleted lists
      const allItems = reflectionText.split(/\n\d+[\.\)]\s*|\n[-•*]\s*/).filter(item =>
        item.trim().length > 20 && item.trim().length < 500
      );

      // Distribute items based on keywords
      allItems.forEach(item => {
        const lower = item.toLowerCase();
        if (lower.includes('work') || lower.includes('success') || lower.includes('good') || lower.includes('well')) {
          whatWorked.push(item.trim());
        } else if (lower.includes('fail') || lower.includes('error') || lower.includes('issue') || lower.includes('problem')) {
          whatFailed.push(item.trim());
        } else if (lower.includes('improve') || lower.includes('better') || lower.includes('optimize') || lower.includes('enhance')) {
          whatToImprove.push(item.trim());
        } else if (lower.includes('learn') || lower.includes('insight') || lower.includes('lesson')) {
          lessonsLearned.push(item.trim());
        }
      });
    }

    return {
      whatWorked: whatWorked.length > 0 ? whatWorked : ['Execution completed successfully'],
      whatFailed: whatFailed.length > 0 ? whatFailed : ['No critical failures identified'],
      whatToImprove: whatToImprove.length > 0 ? whatToImprove : ['Continue monitoring and optimizing'],
      lessonsLearned: lessonsLearned.length > 0 ? lessonsLearned : ['Workflow executed as expected'],
      qualityScore,
      confidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Maintain current quality standards'],
    };
  }

  /**
   * Create basic reflection on error
   */
  private createBasicReflection(
    executionResult: ExecutionResult,
    reviewResult: ReviewResult | null
  ): SelfReflectionResult {
    return {
      whatWorked: ['Execution completed'],
      whatFailed: ['Reflection analysis failed'],
      whatToImprove: ['Improve reflection agent reliability'],
      lessonsLearned: ['Error handling is important'],
      qualityScore: reviewResult?.qualityScore || executionResult.metadata.qualityScore || 0.7,
      confidence: 0.3,
      recommendations: ['Retry reflection or use cached results'],
    };
  }
}

import { BaseAgent } from './BaseAgent';
import { WorkflowContext, ExecutionResult, EnhancedPlan } from '../types';
import { BUILDER_PROMPT, TUTOR_PROMPT, CodeResponse } from '../../ai';
import { PromptEnhancer } from '../utils/PromptEnhancer';
import { WORKFLOW_CONFIG } from '../config';

import { AIProvider } from '../../ai';

/**
 * Executor Agent - Uses Gemini Flash Lite (groq) for code generation
 */
export class ExecutorAgent extends BaseAgent {
  constructor(model: AIProvider = 'groq') {
    super(model);
  }

  getName(): string {
    return 'ExecutorAgent';
  }

  getRequiredModel(): string {
    return 'Gemini Flash Lite (groq)';
  }

  async execute(
    context: WorkflowContext,
    input: { plan: EnhancedPlan | null }
  ): Promise<ExecutionResult> {
    const { plan } = input;
    const startTime = Date.now();

    try {
      if (WORKFLOW_CONFIG.logStages) {
        console.log('⚙️ ExecutorAgent: Starting execution', {
          model: this.model,
          hasPlan: !!plan,
          mode: context.mode,
        });
      }

      // Create execution prompt based on plan or direct request
      const executionPrompt = plan
        ? this.createExecutionPromptFromPlan(plan, context)
        : context.prompt;

      // Get base system prompt
      const baseSystemPrompt = context.mode === 'builder' ? BUILDER_PROMPT : TUTOR_PROMPT;

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

      // Check if this is the first message in the session (no AI responses in history yet)
      const isFirstMessage = !context.history || context.history.filter(m => m.role === 'ai').length === 0;

      const enhancedSystemPrompt = PromptEnhancer.enhanceSystemPrompt(
        baseSystemPrompt,
        contextAwareness,
        userProfile,
        intentAnalysis || { primaryIntent: 'code_generation', confidence: 0.5, requirements: {}, context: { hasCode: false, hasImages: false, hasErrors: false, isFollowUp: false }, secondaryIntents: [] },
        isFirstMessage // Only greet on first message
      );

      // Call LLM with enhanced prompt
      const response = await this.callLLM(executionPrompt, enhancedSystemPrompt, context, context.mode);

      // Parse response
      let result: CodeResponse;
      try {
        const parsed = JSON.parse(response);
        if (parsed.type === 'multi-file' && parsed.files) {
          result = parsed;
        } else if (parsed.type === 'single-file') {
          result = parsed;
        } else if (parsed.content) {
          result = { type: 'single-file', content: parsed.content };
        } else {
          result = { type: 'single-file', content: response };
        }
      } catch {
        // Not JSON, treat as single file
        result = { type: 'single-file', content: response };
      }

      const executionTime = Date.now() - startTime;

      // Build execution result
      const executionResult: ExecutionResult = {
        metadata: {
          tokensUsed: this.estimateTokens(executionPrompt) + this.estimateTokens(
            result.type === 'multi-file'
              ? result.files.map(f => f.content).join('')
              : result.content
          ),
          executionTime,
          qualityScore: undefined, // Will be set by reviewer
        },
      };

      // Handle different response types
      if (result.type === 'multi-file') {
        executionResult.files = result.files;
        executionResult.code = result.files.find(f => f.path === result.entry)?.content;
      } else {
        executionResult.code = result.content;
      }

      // For tutor mode, extract explanation
      if (context.mode === 'tutor') {
        executionResult.explanation = executionResult.code || response;
        executionResult.code = undefined;
      }

      if (WORKFLOW_CONFIG.logStages) {
        console.log('✅ ExecutorAgent: Execution completed', {
          executionTime,
          hasCode: !!executionResult.code,
          hasFiles: !!executionResult.files,
          hasExplanation: !!executionResult.explanation,
        });
      }

      return executionResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('ExecutorAgent error:', error);

      return {
        code: context.mode === 'builder'
          ? '// Error: Failed to generate code. Please try again.'
          : undefined,
        explanation: context.mode === 'tutor'
          ? 'I apologize, but I encountered an error while processing your request. Please try rephrasing your question or try again.'
          : undefined,
        metadata: {
          tokensUsed: 0,
          executionTime,
          qualityScore: 0,
        },
      };
    }
  }

  private createExecutionPromptFromPlan(plan: EnhancedPlan, context: WorkflowContext): string {
    let prompt = `Execute the following plan:\n\n`;

    prompt += `Original Request: ${plan.prompt}\n\n`;

    prompt += `Execution Steps:\n`;
    plan.executionSteps.forEach((step, index) => {
      prompt += `${index + 1}. ${step.action}\n`;
      if (step.expectedOutput) {
        prompt += `   Expected: ${step.expectedOutput}\n`;
      }
    });

    prompt += `\nQuality Criteria:\n`;
    plan.qualityCriteria.forEach((criterion, index) => {
      prompt += `${index + 1}. ${criterion}\n`;
    });

    prompt += `\nPlease generate the code following these steps and meeting all quality criteria.`;

    return prompt;
  }
}

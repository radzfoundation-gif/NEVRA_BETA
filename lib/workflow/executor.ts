import { ExecutionResult, EnhancedPlan, WorkflowContext } from './types';
import { CodeResponse, BUILDER_PROMPT, TUTOR_PROMPT } from '../ai';
import { WORKFLOW_CONFIG } from './config';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Execute the plan using DEVSTRAL
 */
export async function executePlan(
  plan: EnhancedPlan | null,
  context: WorkflowContext,
  provider: 'groq' // Gemini Flash Lite
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    // Create execution prompt based on plan or direct request
    const executionPrompt = plan
      ? createExecutionPromptFromPlan(plan, context)
      : context.prompt;

    if (WORKFLOW_CONFIG.logStages) {
      console.log('⚙️ Executor: Starting execution', {
        hasPlan: !!plan,
        mode: context.mode,
        provider,
      });
    }

    // Execute by calling API directly (avoid circular dependency)
    const systemPrompt = context.mode === 'builder' ? BUILDER_PROMPT : TUTOR_PROMPT;

    const resp = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: executionPrompt,
        history: context.history,
        mode: context.mode,
        provider,
        images: context.images || [],
        systemPrompt,
      }),
    });

    if (!resp.ok) {
      throw new Error(`Execution failed: ${resp.statusText}`);
    }

    const data = await resp.json();
    let result: CodeResponse;

    // Handle response format
    if (data.content) {
      // Single file response
      result = { type: 'single-file', content: data.content };
    } else if (data.type === 'multi-file' && data.files) {
      // Multi-file response
      result = data;
    } else if (data.type === 'single-file') {
      result = data;
    } else {
      // Fallback: treat as single file
      result = { type: 'single-file', content: JSON.stringify(data) };
    }

    const executionTime = Date.now() - startTime;

    // Parse result
    const executionResult: ExecutionResult = {
      metadata: {
        tokensUsed: estimateTokens(executionPrompt, result),
        executionTime,
        qualityScore: undefined, // Will be set by reviewer
      },
    };

    // Handle different response types
    if (typeof result === 'string') {
      // Single file response
      executionResult.code = result;
    } else if ('type' in result) {
      // CodeResponse
      if (result.type === 'multi-file') {
        executionResult.files = result.files;
        executionResult.code = result.files.find(f => f.path === result.entry)?.content;
      } else {
        executionResult.code = result.content;
      }
    } else {
      // Fallback
      executionResult.code = String(result);
    }

    // For tutor mode, extract explanation
    if (context.mode === 'tutor') {
      executionResult.explanation = executionResult.code || String(result);
      executionResult.code = undefined;
    }

    if (WORKFLOW_CONFIG.logStages) {
      console.log('✅ Executor: Execution completed', {
        executionTime,
        hasCode: !!executionResult.code,
        hasFiles: !!executionResult.files,
        hasExplanation: !!executionResult.explanation,
      });
    }

    return executionResult;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Executor error:', error);

    // Return error result
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

/**
 * Create execution prompt from plan
 */
function createExecutionPromptFromPlan(
  plan: EnhancedPlan,
  context: WorkflowContext
): string {
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

/**
 * Estimate token count (rough: ~4 chars per token)
 */
function estimateTokens(prompt: string, result: string | CodeResponse): number {
  const promptTokens = Math.ceil(prompt.length / 4);

  let resultTokens = 0;
  if (typeof result === 'string') {
    resultTokens = Math.ceil(result.length / 4);
  } else if ('type' in result) {
    if (result.type === 'multi-file') {
      resultTokens = result.files.reduce((sum, file) =>
        sum + Math.ceil(file.content.length / 4), 0
      );
    } else {
      resultTokens = Math.ceil(result.content.length / 4);
    }
  }

  return promptTokens + resultTokens;
}

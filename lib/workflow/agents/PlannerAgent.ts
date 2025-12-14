import { BaseAgent } from './BaseAgent';
import { WorkflowContext, EnhancedPlan, PreprocessedInput } from '../types';
import { generatePlan, Plan } from '../../agenticPlanner';
import { PromptEnhancer } from '../utils/PromptEnhancer';
import { WORKFLOW_CONFIG } from '../config';

/**
 * Planner Agent - Uses GPT-OSS-20B for planning
 */
export class PlannerAgent extends BaseAgent {
  constructor(model: 'anthropic' | 'gemini' = 'anthropic') {
    super(model);
  }

  getName(): string {
    return 'PlannerAgent';
  }

  getRequiredModel(): string {
    return 'GPT-OSS-20B (anthropic/gemini)';
  }

  async execute(
    context: WorkflowContext,
    input: { prompt: string; preprocessed: PreprocessedInput }
  ): Promise<EnhancedPlan> {
    const { prompt, preprocessed } = input;

    try {
      if (WORKFLOW_CONFIG.logStages) {
        console.log('📋 PlannerAgent: Starting planning', {
          model: this.model,
          intent: preprocessed.intent,
          complexity: preprocessed.context.complexity,
        });
      }

      // Create enhanced planning prompt
      const enhancedPrompt = this.createPlanningPrompt(prompt, preprocessed);

      // Call existing generatePlan function
      const basePlan = await generatePlan(enhancedPrompt, this.model as 'anthropic' | 'gemini');

      // Enhance the plan with execution steps and quality criteria
      const enhancedPlan: EnhancedPlan = {
        ...basePlan,
        executionSteps: this.createExecutionSteps(basePlan, preprocessed),
        qualityCriteria: this.createQualityCriteria(preprocessed),
        reviewChecklist: this.createReviewChecklist(preprocessed),
      };

      if (WORKFLOW_CONFIG.logStages) {
        console.log('✅ PlannerAgent: Plan created', {
          tasks: enhancedPlan.tasks.length,
          steps: enhancedPlan.executionSteps.length,
          criteria: enhancedPlan.qualityCriteria.length,
        });
      }

      return enhancedPlan;
    } catch (error) {
      console.error('PlannerAgent error:', error);
      return this.createFallbackPlan(prompt, preprocessed);
    }
  }

  private createPlanningPrompt(prompt: string, context: PreprocessedInput): string {
    const { intent, context: ctx, metadata } = context;
    
    let enhancedPrompt = `Create a detailed execution plan for the following request:\n\n${prompt}\n\n`;

    if (ctx.hasCode) {
      enhancedPrompt += `\nContext: User has existing code that may need to be modified.\n`;
    }

    if (ctx.hasImages) {
      enhancedPrompt += `\nContext: User has provided images that should be analyzed.\n`;
    }

    if (ctx.framework) {
      enhancedPrompt += `\nFramework: ${ctx.framework}\n`;
    }

    if (metadata.stylePreference) {
      enhancedPrompt += `\nStyle Preference: ${metadata.stylePreference}\n`;
    }

    if (metadata.components && metadata.components.length > 0) {
      enhancedPrompt += `\nRequired Components: ${metadata.components.join(', ')}\n`;
    }

    enhancedPrompt += `\nPlease break down this request into detailed, actionable steps with dependencies and quality criteria.`;

    return enhancedPrompt;
  }

  private createExecutionSteps(plan: Plan, context: PreprocessedInput) {
    const steps = [];
    
    plan.tasks.forEach((task, index) => {
      steps.push({
        step: index + 1,
        action: task.description || task.title,
        expectedOutput: `Complete ${task.title.toLowerCase()}`,
        dependencies: task.dependencies.map(depId => {
          const depIndex = plan.tasks.findIndex(t => t.id === depId);
          return depIndex >= 0 ? depIndex + 1 : 0;
        }).filter(dep => dep > 0),
      });
    });

    return steps;
  }

  private createQualityCriteria(context: PreprocessedInput): string[] {
    const criteria: string[] = [
      'Code follows best practices and conventions',
      'Components are properly structured and reusable',
      'Responsive design works on all screen sizes',
      'No console errors or warnings',
      'Proper error handling is implemented',
    ];

    if (context.context.framework && context.context.framework !== 'html') {
      criteria.push(`Follows ${context.context.framework} framework conventions`);
      criteria.push('Proper file structure and imports');
    }

    if (context.metadata.stylePreference) {
      criteria.push(`Follows ${context.metadata.stylePreference} design style`);
    }

    if (context.context.hasImages) {
      criteria.push('Image analysis is accurate and complete');
    }

    return criteria;
  }

  private createReviewChecklist(context: PreprocessedInput): string[] {
    const checklist: string[] = [
      'Check for syntax errors',
      'Verify responsive design',
      'Test component functionality',
      'Review code quality and readability',
      'Check for accessibility issues',
    ];

    if (context.context.framework && context.context.framework !== 'html') {
      checklist.push('Verify framework-specific best practices');
      checklist.push('Check import statements and dependencies');
    }

    return checklist;
  }

  private createFallbackPlan(prompt: string, context: PreprocessedInput): EnhancedPlan {
    const basePlan: Plan = {
      id: Date.now().toString(),
      prompt,
      tasks: [
        {
          id: '1',
          title: 'Analyze Requirements',
          description: 'Understand the user requirements',
          status: 'completed',
          dependencies: [],
          priority: 'high',
          category: 'setup',
        },
        {
          id: '2',
          title: 'Generate Solution',
          description: 'Create the requested code or explanation',
          status: 'pending',
          dependencies: ['1'],
          priority: 'high',
          category: context.intent === 'code_generation' ? 'component' : 'logic',
        },
      ],
      estimatedTotalTime: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      ...basePlan,
      executionSteps: [
        {
          step: 1,
          action: 'Analyze requirements',
          expectedOutput: 'Clear understanding of requirements',
          dependencies: [],
        },
        {
          step: 2,
          action: 'Generate solution',
          expectedOutput: 'Complete code or explanation',
          dependencies: [1],
        },
      ],
      qualityCriteria: this.createQualityCriteria(context),
      reviewChecklist: this.createReviewChecklist(context),
    };
  }
}

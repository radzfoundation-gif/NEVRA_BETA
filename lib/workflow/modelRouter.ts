import { RoutingDecision, PreprocessedInput } from './types';
import { WORKFLOW_CONFIG } from './config';

/**
 * Route requests to appropriate models based on request type and complexity
 */
export function routeModels(
  preprocessed: PreprocessedInput,
  mode: 'builder' | 'tutor',
  userPreferences?: Record<string, any>
): RoutingDecision {
  const { intent, context } = preprocessed;
  const { complexity } = context;

  // STRICT AGENT ROUTING - Always use correct models
  // Planner: Always GPT-OSS-20B (anthropic or gemini via OpenRouter)
  // Executor: Always DEVSTRAL (deepseek via OpenRouter)
  // Reviewer: Always GPT-OSS-20B (anthropic or gemini via OpenRouter)
  const decision: RoutingDecision = {
    plannerModel: WORKFLOW_CONFIG.defaultPlannerModel, // GPT-OSS-20B (anthropic/gemini)
    executorModel: 'deepseek' as const, // DEVSTRAL - ALWAYS deepseek
    reviewerModel: WORKFLOW_CONFIG.defaultReviewerModel, // GPT-OSS-20B (anthropic/gemini)
    skipStages: [],
  };

  // Determine which stages to skip
  if (WORKFLOW_CONFIG.skipPlannerForSimple && complexity === 'simple') {
    decision.skipStages = [...(decision.skipStages || []), 'planner'];
  }

  if (WORKFLOW_CONFIG.skipReviewerForSimple && complexity === 'simple') {
    decision.skipStages = [...(decision.skipStages || []), 'reviewer'];
  }

  // Tutor mode: skip planner for questions/explanations, but always review
  if (mode === 'tutor') {
    if (intent === 'question' || intent === 'explanation') {
      decision.skipStages = [...(decision.skipStages || []), 'planner'];
    }
    // Always review in tutor mode for quality
    decision.skipStages = (decision.skipStages || []).filter(s => s !== 'reviewer');
  }

  // Builder mode: always plan for complex requests
  if (mode === 'builder' && complexity === 'complex') {
    decision.skipStages = (decision.skipStages || []).filter(s => s !== 'planner');
  }

  // Simple edits don't need planning
  if (mode === 'builder' && intent === 'edit' && complexity === 'simple') {
    decision.skipStages = [...(decision.skipStages || []), 'planner'];
  }

  // Respect user preferences if provided
  if (userPreferences) {
    if (userPreferences.plannerModel && ['anthropic', 'gemini'].includes(userPreferences.plannerModel)) {
      decision.plannerModel = userPreferences.plannerModel;
    }
    if (userPreferences.reviewerModel && ['anthropic', 'gemini'].includes(userPreferences.reviewerModel)) {
      decision.reviewerModel = userPreferences.reviewerModel;
    }
  }

  return decision;
}

/**
 * Check if a stage should be skipped
 */
export function shouldSkipStage(
  stage: 'planner' | 'reviewer',
  routingDecision: RoutingDecision
): boolean {
  return routingDecision.skipStages?.includes(stage) || false;
}

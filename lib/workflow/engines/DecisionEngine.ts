import { RoutingDecision } from '../types';
import { AIProvider } from '../../ai';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';
import { UserProfile } from './UserProfileEngine';
import { WORKFLOW_CONFIG } from '../config';

/**
 * Decision Engine
 * Makes intelligent routing and workflow decisions
 */
export interface WorkflowDecision {
  routing: RoutingDecision;
  skipStages: ('planner' | 'reviewer')[];
  qualityThreshold: number;
  maxRetries: number;
  maxRevisions: number;
  priority: 'low' | 'normal' | 'high';
  reasoning: string[];
}

export class DecisionEngine {
  /**
   * Make workflow decision
   */
  static makeDecision(
    intentAnalysis: IntentAnalysis,
    userProfile: UserProfile | null,
    mode: 'builder' | 'tutor'
  ): WorkflowDecision {
    const reasoning: string[] = [];

    // Base routing decision
    const routing: RoutingDecision = {
      plannerModel: this.selectPlannerModel(intentAnalysis, userProfile, reasoning),
      executorModel: 'groq' as const, // Always Gemini Flash Lite (SumoPod)
      reviewerModel: this.selectReviewerModel(intentAnalysis, userProfile, reasoning),
      skipStages: [],
    };

    // Determine which stages to skip
    const skipStages = this.determineSkipStages(intentAnalysis, mode, reasoning);

    // Adjust quality threshold based on intent and user
    const qualityThreshold = this.calculateQualityThreshold(intentAnalysis, userProfile, reasoning);

    // Adjust retry/revision limits
    const maxRetries = this.calculateMaxRetries(intentAnalysis, reasoning);
    const maxRevisions = this.calculateMaxRevisions(intentAnalysis, reasoning);

    // Determine priority
    const priority = this.determinePriority(intentAnalysis, userProfile, reasoning);

    return {
      routing,
      skipStages,
      qualityThreshold,
      maxRetries,
      maxRevisions,
      priority,
      reasoning,
    };
  }

  /**
   * Select planner model
   */
  private static selectPlannerModel(
    intentAnalysis: IntentAnalysis,
    userProfile: UserProfile | null,
    reasoning: string[]
  ): AIProvider {
    // Use user preference if available
    if (userProfile?.preferences?.default_provider) {
      const provider = userProfile.preferences.default_provider;
      if (provider === 'groq' || provider === 'anthropic' || provider === 'gemini') {
        reasoning.push(`Using user preferred provider: ${provider}`);
        return provider as AIProvider;
      }
    }

    // Default to config
    const model = WORKFLOW_CONFIG.defaultPlannerModel;
    reasoning.push(`Using default planner model: ${model}`);
    return model;
  }

  /**
   * Select reviewer model
   */
  private static selectReviewerModel(
    intentAnalysis: IntentAnalysis,
    userProfile: UserProfile | null,
    reasoning: string[]
  ): AIProvider {
    // Use user preference if available
    if (userProfile?.preferences?.default_provider) {
      const provider = userProfile.preferences.default_provider;
      if (provider === 'groq' || provider === 'anthropic' || provider === 'gemini') {
        reasoning.push(`Using user preferred provider for review: ${provider}`);
        return provider as AIProvider;
      }
    }

    // Default to config
    const model = WORKFLOW_CONFIG.defaultReviewerModel;
    reasoning.push(`Using default reviewer model: ${model}`);
    return model;
  }

  /**
   * Determine which stages to skip
   */
  private static determineSkipStages(
    intentAnalysis: IntentAnalysis,
    mode: 'builder' | 'tutor',
    reasoning: string[]
  ): ('planner' | 'reviewer')[] {
    const skipStages: ('planner' | 'reviewer')[] = [];

    // Skip planner for simple requests
    if (WORKFLOW_CONFIG.skipPlannerForSimple) {
      const complexity = this.estimateComplexity(intentAnalysis);
      if (complexity === 'simple') {
        skipStages.push('planner');
        reasoning.push('Skipping planner for simple request');
      }
    }

    // Skip planner for questions/explanations in tutor mode
    if (mode === 'tutor') {
      if (intentAnalysis.primaryIntent === 'question' || intentAnalysis.primaryIntent === 'explanation') {
        skipStages.push('planner');
        reasoning.push('Skipping planner for question/explanation in tutor mode');
      }
    }

    // Skip reviewer for simple requests
    if (WORKFLOW_CONFIG.skipReviewerForSimple) {
      const complexity = this.estimateComplexity(intentAnalysis);
      if (complexity === 'simple' && mode === 'builder') {
        skipStages.push('reviewer');
        reasoning.push('Skipping reviewer for simple request');
      }
    }

    // Never skip reviewer for complex requests
    if (this.estimateComplexity(intentAnalysis) === 'complex') {
      const index = skipStages.indexOf('reviewer');
      if (index > -1) {
        skipStages.splice(index, 1);
        reasoning.push('Not skipping reviewer for complex request');
      }
    }

    return skipStages;
  }

  /**
   * Estimate complexity from intent analysis
   */
  private static estimateComplexity(intentAnalysis: IntentAnalysis): 'simple' | 'medium' | 'complex' {
    const { requirements, context } = intentAnalysis;

    // Complex if multiple requirements
    if (
      (requirements.components && requirements.components.length > 3) ||
      (requirements.features && requirements.features.length > 2) ||
      (context.hasCode && context.hasImages)
    ) {
      return 'complex';
    }

    // Simple if minimal requirements
    if (
      !requirements.components &&
      !requirements.features &&
      !context.hasCode &&
      !context.hasImages
    ) {
      return 'simple';
    }

    return 'medium';
  }

  /**
   * Calculate quality threshold
   */
  private static calculateQualityThreshold(
    intentAnalysis: IntentAnalysis,
    userProfile: UserProfile | null,
    reasoning: string[]
  ): number {
    let threshold = WORKFLOW_CONFIG.qualityThreshold;

    // Higher threshold for complex requests
    if (this.estimateComplexity(intentAnalysis) === 'complex') {
      threshold = Math.min(0.9, threshold + 0.1);
      reasoning.push('Increased quality threshold for complex request');
    }

    // Lower threshold for simple requests
    if (this.estimateComplexity(intentAnalysis) === 'simple') {
      threshold = Math.max(0.5, threshold - 0.1);
      reasoning.push('Decreased quality threshold for simple request');
    }

    // Adjust based on user behavior
    if (userProfile?.behavior.detailLevel === 'detailed') {
      threshold = Math.min(0.9, threshold + 0.05);
      reasoning.push('Increased quality threshold for detailed user preference');
    }

    return threshold;
  }

  /**
   * Calculate max retries
   */
  private static calculateMaxRetries(
    intentAnalysis: IntentAnalysis,
    reasoning: string[]
  ): number {
    let maxRetries = WORKFLOW_CONFIG.maxRetries;

    // More retries for complex requests
    if (this.estimateComplexity(intentAnalysis) === 'complex') {
      maxRetries += 1;
      reasoning.push('Increased max retries for complex request');
    }

    // Fewer retries for simple requests
    if (this.estimateComplexity(intentAnalysis) === 'simple') {
      maxRetries = Math.max(1, maxRetries - 1);
      reasoning.push('Decreased max retries for simple request');
    }

    return maxRetries;
  }

  /**
   * Calculate max revisions
   */
  private static calculateMaxRevisions(
    intentAnalysis: IntentAnalysis,
    reasoning: string[]
  ): number {
    let maxRevisions = WORKFLOW_CONFIG.maxRevisions;

    // More revisions for complex requests
    if (this.estimateComplexity(intentAnalysis) === 'complex') {
      maxRevisions += 1;
      reasoning.push('Increased max revisions for complex request');
    }

    return maxRevisions;
  }

  /**
   * Determine priority
   */
  private static determinePriority(
    intentAnalysis: IntentAnalysis,
    userProfile: UserProfile | null,
    reasoning: string[]
  ): 'low' | 'normal' | 'high' {
    // High priority for debug requests
    if (intentAnalysis.primaryIntent === 'debug') {
      reasoning.push('High priority: debug request');
      return 'high';
    }

    // High priority for complex requests
    if (this.estimateComplexity(intentAnalysis) === 'complex') {
      reasoning.push('High priority: complex request');
      return 'high';
    }

    // Low priority for simple requests
    if (this.estimateComplexity(intentAnalysis) === 'simple') {
      reasoning.push('Low priority: simple request');
      return 'low';
    }

    reasoning.push('Normal priority');
    return 'normal';
  }
}

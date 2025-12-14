import { ReviewResult, ExecutionResult, EnhancedPlan } from '../types';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';
import { UserProfile } from './UserProfileEngine';
import { WORKFLOW_CONFIG } from '../config';

/**
 * Review & Decision Engine
 * Enhanced review system with intelligent decision making
 */
export interface ReviewDecision {
  approved: boolean;
  rejected: boolean;
  needsRevision: boolean;
  revisionReason?: string;
  qualityScore: number;
  confidence: number;
  recommendations: string[];
  nextAction: 'accept' | 'revise' | 'reject';
}

export class ReviewDecisionEngine {
  /**
   * Make review decision
   */
  static makeDecision(
    reviewResult: ReviewResult,
    executionResult: ExecutionResult,
    intentAnalysis: IntentAnalysis,
    userProfile: UserProfile | null,
    qualityThreshold: number
  ): ReviewDecision {
    const qualityScore = reviewResult.qualityScore;
    const rejected = reviewResult.rejected || false;
    const rejectionReason = reviewResult.rejectionReason;

    // Calculate confidence in decision
    const confidence = this.calculateConfidence(reviewResult, executionResult, intentAnalysis);

    // Determine if needs revision
    const needsRevision = this.shouldRevise(
      reviewResult,
      executionResult,
      qualityScore,
      qualityThreshold,
      intentAnalysis
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      reviewResult,
      executionResult,
      intentAnalysis
    );

    // Determine next action
    const nextAction = this.determineNextAction(
      rejected,
      needsRevision,
      qualityScore,
      qualityThreshold
    );

    return {
      approved: !rejected && !needsRevision && qualityScore >= qualityThreshold,
      rejected,
      needsRevision,
      revisionReason: rejectionReason || (needsRevision ? 'Quality below threshold' : undefined),
      qualityScore,
      confidence,
      recommendations,
      nextAction,
    };
  }

  /**
   * Calculate confidence in review decision
   */
  private static calculateConfidence(
    reviewResult: ReviewResult,
    executionResult: ExecutionResult,
    intentAnalysis: IntentAnalysis
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if review has detailed issues
    if (reviewResult.issues.length > 0) {
      confidence += 0.2;
    }

    // Increase confidence if review has suggestions
    if (reviewResult.suggestions.length > 0) {
      confidence += 0.1;
    }

    // Increase confidence if execution result has metadata
    if (executionResult.metadata.qualityScore !== undefined) {
      confidence += 0.1;
    }

    // Increase confidence based on intent analysis confidence
    confidence += intentAnalysis.confidence * 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Determine if revision is needed
   */
  private static shouldRevise(
    reviewResult: ReviewResult,
    executionResult: ExecutionResult,
    qualityScore: number,
    qualityThreshold: number,
    intentAnalysis: IntentAnalysis
  ): boolean {
    // Explicit rejection
    if (reviewResult.rejected) {
      return true;
    }

    // Quality score below threshold
    if (qualityScore < qualityThreshold) {
      return true;
    }

    // Critical errors found
    const criticalErrors = reviewResult.issues.filter(
      issue => issue.severity === 'error'
    );
    if (criticalErrors.length > 0) {
      return true;
    }

    // Complex requests need higher quality
    if (
      intentAnalysis.requirements.components &&
      intentAnalysis.requirements.components.length > 3 &&
      qualityScore < qualityThreshold + 0.1
    ) {
      return true;
    }

    return false;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    reviewResult: ReviewResult,
    executionResult: ExecutionResult,
    intentAnalysis: IntentAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Add review suggestions
    if (reviewResult.suggestions.length > 0) {
      recommendations.push(...reviewResult.suggestions);
    }

    // Add recommendations based on issues
    const errors = reviewResult.issues.filter(i => i.severity === 'error');
    if (errors.length > 0) {
      recommendations.push(`Fix ${errors.length} critical error(s)`);
    }

    const warnings = reviewResult.issues.filter(i => i.severity === 'warning');
    if (warnings.length > 0) {
      recommendations.push(`Address ${warnings.length} warning(s)`);
    }

    // Add recommendations based on intent
    if (intentAnalysis.requirements.components && intentAnalysis.requirements.components.length > 0) {
      const missingComponents = intentAnalysis.requirements.components.filter(
        comp => !executionResult.code?.includes(comp)
      );
      if (missingComponents.length > 0) {
        recommendations.push(`Add missing components: ${missingComponents.join(', ')}`);
      }
    }

    return recommendations;
  }

  /**
   * Determine next action
   */
  private static determineNextAction(
    rejected: boolean,
    needsRevision: boolean,
    qualityScore: number,
    qualityThreshold: number
  ): 'accept' | 'revise' | 'reject' {
    if (rejected) {
      return 'reject';
    }

    if (needsRevision || qualityScore < qualityThreshold) {
      return 'revise';
    }

    return 'accept';
  }

  /**
   * Should use improved version
   */
  static shouldUseImprovedVersion(
    reviewResult: ReviewResult,
    qualityScore: number,
    qualityThreshold: number
  ): boolean {
    // Use improved version if available and quality is low
    if (
      (reviewResult.improvedCode || reviewResult.improvedExplanation) &&
      qualityScore < qualityThreshold
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get improved version
   */
  static getImprovedVersion(reviewResult: ReviewResult): string | undefined {
    return reviewResult.improvedCode || reviewResult.improvedExplanation;
  }
}

import {
  WorkflowContext,
  WorkflowResult,
  PreprocessedInput,
  RoutingDecision,
  EnhancedPlan,
  ExecutionResult,
  ReviewResult,
  WorkflowStatus,
  WorkflowState,
} from './types';
import { Framework } from '../ai';
import { InputNormalizer } from './normalizers/InputNormalizer';
import { IntentAnalyzer } from './analyzers/IntentAnalyzer';
import { UserProfileEngine } from './engines/UserProfileEngine';
import { ContextAwarenessEngine } from './engines/ContextAwarenessEngine';
import { DecisionEngine } from './engines/DecisionEngine';
import { ReviewDecisionEngine } from './engines/ReviewDecisionEngine';
import { MemoryEngine } from './engines/MemoryEngine';
import { AgentMemoryEngine } from './engines/AgentMemoryEngine';
import { PromptEnhancer } from './utils/PromptEnhancer';
import { StateMachine } from './machines/StateMachine';
import { AgentFactory } from './agents/AgentFactory';
import { shouldSkipStage } from './modelRouter';
import { WORKFLOW_CONFIG } from './config';

/**
 * Update workflow state and notify listeners
 */
function updateState(
  context: WorkflowContext,
  state: WorkflowState,
  details?: Record<string, any>
): void {
  context.onStateChange?.(state, details);

  if (WORKFLOW_CONFIG.logStages) {
    
  }
}

/**
 * Enhanced workflow orchestrator with full architecture:
 * USER -> INPUT NORMALIZER -> INTENT ANALYZER -> USER PROFILE ENGINE
 * -> ORCHESTRATOR (Decision Engine + State Machine) -> AGENT FACTORY
 * -> AGENT -> LLM -> OUTPUT -> REVIEW & DECISION -> MEMORY UPDATE -> FINAL RESPONSE
 */

/**
 * Execute the complete workflow with strict agent routing, state management, and revision loop
 */
export async function executeWorkflow(
  context: WorkflowContext
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const stagesExecuted: string[] = [];
  let executionAttempts = 0;
  let revisionAttempts = 0;
  let totalTokensUsed = 0;

  // Initialize State Machine
  const stateMachine = new StateMachine();
  stateMachine.on('IDLE', () => updateState(context, 'IDLE'));
  stateMachine.on('PLANNING', (details) => updateState(context, 'PLANNING', details));
  stateMachine.on('EXECUTING', (details) => updateState(context, 'EXECUTING', details));
  stateMachine.on('REVIEWING', (details) => updateState(context, 'REVIEWING', details));
  stateMachine.on('REVISING', (details) => updateState(context, 'REVISING', details));
  stateMachine.on('DONE', (details) => updateState(context, 'DONE', details));
  stateMachine.on('ERROR', (details) => updateState(context, 'ERROR', details));

  try {
    // Initialize
    stateMachine.transition('IDLE');

    if (WORKFLOW_CONFIG.logStages) {
      // Workflow starting execution silently
    }

    // Stage 1: INPUT NORMALIZER
    context.onStatusUpdate?.('preprocessing', 'Normalizing input...');
    const normalizedInput = InputNormalizer.normalize(context.prompt, context.images);
    stagesExecuted.push('normalize');

    if (WORKFLOW_CONFIG.logStages) {
      // Input Normalizer completed silently
    }

    // Stage 2: INTENT ANALYZER
    context.onStatusUpdate?.('preprocessing', 'Analyzing intent...');
    const intentAnalysis = IntentAnalyzer.analyze(
      normalizedInput,
      context.history,
      context.framework
    );
    stagesExecuted.push('intent_analyze');

    if (WORKFLOW_CONFIG.logStages) {
      // Intent Analyzer completed silently
    }

    // Stage 3: USER PROFILE ENGINE
    context.onStatusUpdate?.('preprocessing', 'Loading user profile...');
    const userProfile = await UserProfileEngine.loadProfile(context.userId, context.history);
    const personalizedContext = UserProfileEngine.getPersonalizedContext(userProfile, intentAnalysis);
    stagesExecuted.push('user_profile');

    if (WORKFLOW_CONFIG.logStages) {
      // User Profile Engine completed silently
    }

    // Stage 3.5: CONTEXT AWARENESS ENGINE
    context.onStatusUpdate?.('preprocessing', 'Building context awareness...');
    let contextAwareness = await ContextAwarenessEngine.buildContext(
      context.userId,
      context.sessionId,
      'IDLE',
      context.history,
      intentAnalysis,
      undefined, // currentTask
      context.userName, // Pass user name from Clerk
      context.userEmail // Pass user email from Clerk
    );
    stagesExecuted.push('context_awareness');

    if (WORKFLOW_CONFIG.logStages) {
      // Context Awareness Engine completed silently
    }

    // Stage 4: DECISION ENGINE
    context.onStatusUpdate?.('routing', 'Making intelligent decisions...');
    const workflowDecision = DecisionEngine.makeDecision(
      intentAnalysis,
      userProfile,
      context.mode
    );
    const routingDecision = workflowDecision.routing;
    stagesExecuted.push('decision');

    if (WORKFLOW_CONFIG.logStages) {
      // Decision Engine completed silently
    }

    // Validate agent routing against config
    if (routingDecision.executorModel !== WORKFLOW_CONFIG.defaultExecutorModel) {
      // Executor using non-default model silently
    }
    if (routingDecision.plannerModel !== WORKFLOW_CONFIG.defaultPlannerModel) {
      // Planner using non-default model silently
    }
    if (routingDecision.reviewerModel !== WORKFLOW_CONFIG.defaultReviewerModel) {
      // Reviewer using non-default model silently
    }

    // Stage 5: MEMORY RETRIEVAL
    const relevantMemory = await MemoryEngine.retrieveRelevantMemory(
      normalizedInput.cleaned,
      context.sessionId || '',
      context.userId,
      intentAnalysis
    );
    const memoryContext = MemoryEngine.getMemoryContext(relevantMemory);

    // Stage 6: AGENT FACTORY (with memory injection and context awareness)
    context.onStatusUpdate?.('routing', 'Creating agents...');

    // Enhance context with context awareness and user info
    const enhancedContext = {
      ...personalizedContext,
      memoryContext,
      contextAwareness: contextAwareness ? JSON.stringify(contextAwareness) : undefined,
      contextAwarenessSummary: contextAwareness ? ContextAwarenessEngine.generateContextSummary(contextAwareness) : undefined,
      userProfile: userProfile ? JSON.stringify(userProfile) : undefined,
      intentAnalysis: JSON.stringify(intentAnalysis),
      // Priority: context.userName (from Clerk) > userProfile > contextAwareness
      userName: context.userName || userProfile?.userName || contextAwareness?.user.name,
      userEmail: context.userEmail,
    };

    const agents = AgentFactory.createAgentsFromRouting(routingDecision, {
      memory: relevantMemory,
      context: enhancedContext,
    });

    // Update context metadata for agents
    context.metadata = {
      ...context.metadata,
      ...enhancedContext,
    };

    if (WORKFLOW_CONFIG.logStages) {
      // Agent Factory created agents silently
    }

    // Stage 7: PLANNING (if not skipped) - ALWAYS GPT-OSS-20B via PlannerAgent
    let plan: EnhancedPlan | null = null;
    if (
      !workflowDecision.skipStages.includes('planner') &&
      WORKFLOW_CONFIG.enablePlanner &&
      agents.planner
    ) {
      try {
        // Update context awareness
        contextAwareness = await ContextAwarenessEngine.updateContext(
          contextAwareness!,
          'PLANNING',
          'Creating execution plan'
        );

        stateMachine.transition('PLANNING', { model: routingDecision.plannerModel });
        context.onStatusUpdate?.('planning', 'Creating execution plan...');

        plan = await agents.planner.execute(context, {
          prompt: normalizedInput.cleaned,
          preprocessed: {
            cleanedPrompt: normalizedInput.cleaned,
            intent: intentAnalysis.primaryIntent,
            context: {
              hasCode: intentAnalysis.context.hasCode,
              hasImages: intentAnalysis.context.hasImages,
              framework: intentAnalysis.requirements.framework as Framework | undefined,
              complexity: normalizedInput.wordCount < 50 ? 'simple' : normalizedInput.wordCount > 200 ? 'complex' : 'medium',
            },
            metadata: {
              ...intentAnalysis.requirements,
              ...personalizedContext,
            },
          },
        });
        stagesExecuted.push('plan');

        if (WORKFLOW_CONFIG.logStages) {
          // PlannerAgent plan created silently
        }
      } catch (error) {
        
        // Continue without plan
      }
    }

    // Stage 8-9: Execution-Review Loop with Revision Control
    let executionResult: ExecutionResult | null = null;
    let review: ReviewResult | null = null;
    let shouldRetry = false;
    const MAX_TOTAL_ATTEMPTS = 10; // Circuit breaker to prevent infinite loops
    let totalAttempts = 0;

    do {
      shouldRetry = false;
      executionAttempts++;
      totalAttempts++;

      // Circuit breaker - prevent infinite loop (highest priority check)
      if (totalAttempts > MAX_TOTAL_ATTEMPTS) {
      // Circuit breaker triggered - max attempts exceeded
        break;
      }

      // Safety check: execution attempts
      if (executionAttempts > workflowDecision.maxRetries + 1) {
      // Max execution attempts exceeded - stopping loop
        break;
      }

      // Safety check: revision attempts
      if (revisionAttempts > workflowDecision.maxRevisions) {
      // Max revision attempts exceeded - stopping loop
        break;
      }

      // Stage 8: EXECUTION - ALWAYS DEVSTRAL via ExecutorAgent
      // Update context awareness
      if (contextAwareness) {
        contextAwareness = await ContextAwarenessEngine.updateContext(
          contextAwareness,
          'EXECUTING',
          context.mode === 'builder' ? 'Building application' : 'Writing response'
        );
        context.metadata = {
          ...context.metadata,
          contextAwareness: JSON.stringify(contextAwareness),
          contextAwarenessSummary: ContextAwarenessEngine.generateContextSummary(contextAwareness),
        };
      }

      stateMachine.transition('EXECUTING', {
        attempt: executionAttempts,
        maxAttempts: workflowDecision.maxRetries + 1,
        revisionAttempts,
        totalAttempts,
      });
      context.onStatusUpdate?.('executing', context.mode === 'builder' ? 'Building application...' : 'Writing response...');

      executionResult = await agents.executor.execute(context, {
        plan,
      });
      stagesExecuted.push('execute');
      totalTokensUsed += executionResult.metadata.tokensUsed;

      if (WORKFLOW_CONFIG.logStages) {
        // ExecutorAgent execution completed silently
      }

      // Stage 9: REVIEW & DECISION (if not skipped) - ALWAYS GPT-OSS-20B via ReviewerAgent
      if (
        !workflowDecision.skipStages.includes('reviewer') &&
        WORKFLOW_CONFIG.enableReviewer &&
        agents.reviewer &&
        (WORKFLOW_CONFIG.requireReviewForLowQuality ||
          executionResult.metadata.qualityScore === undefined ||
          executionResult.metadata.qualityScore < workflowDecision.qualityThreshold)
      ) {
        try {
          // Update context awareness
          if (contextAwareness) {
            contextAwareness = await ContextAwarenessEngine.updateContext(
              contextAwareness,
              'REVIEWING',
              'Reviewing output quality'
            );
            context.metadata = {
              ...context.metadata,
              contextAwareness: JSON.stringify(contextAwareness),
              contextAwarenessSummary: ContextAwarenessEngine.generateContextSummary(contextAwareness),
            };
          }

          stateMachine.transition('REVIEWING', {
            model: routingDecision.reviewerModel,
            qualityScore: executionResult.metadata.qualityScore
          });
          context.onStatusUpdate?.('reviewing', 'Reviewing and improving quality...');

          review = await agents.reviewer.execute(context, {
            executionResult,
            plan,
          });
          stagesExecuted.push('review');

          if (WORKFLOW_CONFIG.logStages) {
            // ReviewerAgent review completed silently
          }

          // Use Review Decision Engine for intelligent decision making
          const reviewDecision = ReviewDecisionEngine.makeDecision(
            review,
            executionResult,
            intentAnalysis,
            userProfile,
            workflowDecision.qualityThreshold
          );

          if (WORKFLOW_CONFIG.logStages) {
            // ReviewDecisionEngine decision made silently
          }

          // Check if needs revision
          if (reviewDecision.needsRevision || reviewDecision.rejected) {
            revisionAttempts++;

            if (revisionAttempts <= workflowDecision.maxRevisions) {
              stateMachine.transition('REVISING', {
                attempt: revisionAttempts,
                maxAttempts: workflowDecision.maxRevisions,
                reason: reviewDecision.revisionReason,
              });
              context.onStatusUpdate?.('revising', `Revision ${revisionAttempts}/${workflowDecision.maxRevisions}: ${reviewDecision.revisionReason || 'Quality too low'}`);

              if (WORKFLOW_CONFIG.logStages) {
                // Review Decision: REVISION NEEDED silently
              }

              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, WORKFLOW_CONFIG.revisionDelay));

              // Retry execution with feedback
              shouldRetry = true;

              // Enhance context with rejection feedback
              if (reviewDecision.revisionReason) {
                context.prompt = `${normalizedInput.original}\\n\\n[REVISION FEEDBACK - Attempt ${revisionAttempts}]\\n${reviewDecision.revisionReason}\\n\\nRecommendations:\\n${reviewDecision.recommendations.join('\\n')}\\n\\nPlease address these issues.`;
              }

              // Update context awareness for revision
              if (contextAwareness) {
                contextAwareness = await ContextAwarenessEngine.updateContext(
                  contextAwareness,
                  'REVISING',
                  `Revision ${revisionAttempts}: ${reviewDecision.revisionReason || 'Quality improvement'}`
                );
                context.metadata = {
                  ...context.metadata,
                  contextAwareness: JSON.stringify(contextAwareness),
                  contextAwarenessSummary: ContextAwarenessEngine.generateContextSummary(contextAwareness),
                };
              }

              // Use improved version if available
              if (ReviewDecisionEngine.shouldUseImprovedVersion(review, reviewDecision.qualityScore, workflowDecision.qualityThreshold)) {
                const improved = ReviewDecisionEngine.getImprovedVersion(review);
                if (improved) {
                  if (executionResult.code) {
                    executionResult.code = improved;
                  } else if (executionResult.explanation) {
                    executionResult.explanation = improved;
                  }
                }
              }

              // Reset execution attempts for revision
              executionAttempts = 0;
            } else {
              if (WORKFLOW_CONFIG.logStages) {
                // Max revisions reached silently
              }
              executionResult.metadata.qualityScore = reviewDecision.qualityScore;
              shouldRetry = false;
            }
          } else {
            // Review passed - use improved version if available
            if (ReviewDecisionEngine.shouldUseImprovedVersion(review, reviewDecision.qualityScore, workflowDecision.qualityThreshold)) {
              const improved = ReviewDecisionEngine.getImprovedVersion(review);
              if (improved) {
                if (executionResult.code) {
                  executionResult.code = improved;
                } else if (executionResult.explanation) {
                  executionResult.explanation = improved;
                }
              }
            }
            executionResult.metadata.qualityScore = reviewDecision.qualityScore;
            shouldRetry = false;
          }
        } catch (error) {
          
          // Continue without review
          shouldRetry = false;
        }
      } else {
        // Review skipped, no retry needed
        shouldRetry = false;
      }

      // Retry executor if needed (for executor errors, not reviewer rejection)
      if (!shouldRetry && executionAttempts < workflowDecision.maxRetries + 1) {
        const hasNoOutput = !executionResult.code && !executionResult.explanation;
        const isBuilderMode = context.mode === 'builder';

        if (hasNoOutput && isBuilderMode) {
          shouldRetry = true;
          await new Promise(resolve => setTimeout(resolve, WORKFLOW_CONFIG.retryDelay));

          if (WORKFLOW_CONFIG.logStages) {
            // Executor failed - Retrying silently
          }
        }
      }

    } while (
      shouldRetry &&
      executionAttempts <= workflowDecision.maxRetries + 1 &&
      revisionAttempts <= workflowDecision.maxRevisions &&
      totalAttempts <= MAX_TOTAL_ATTEMPTS
    );

    // Stage 10: Prepare Result
    stateMachine.transition('DONE', {
      executionAttempts,
      revisionAttempts,
      qualityScore: executionResult.metadata.qualityScore,
    });

    const result: WorkflowResult = {
      response: context.mode === 'builder'
        ? (executionResult.code || '')
        : (executionResult.explanation || ''),
      code: executionResult.code,
      explanation: executionResult.explanation,
      files: executionResult.files,
      plan: plan || undefined,
      review: review || undefined,
      metadata: {
        tokensUsed: totalTokensUsed,
        executionTime: Date.now() - startTime,
        qualityScore: executionResult.metadata.qualityScore || review?.qualityScore,
        stagesExecuted,
        executionAttempts,
        revisionAttempts,
        finalState: 'DONE',
      },
    };

    // Stage 11: SELF-REFLECTION AGENT
    // Update context awareness to DONE state
    if (contextAwareness) {
      contextAwareness = await ContextAwarenessEngine.updateContext(
        contextAwareness,
        'DONE',
        'Workflow completed'
      );
    }

    let reflection: any = null;
    if (agents.reflection && executionResult) {
      try {
        context.onStatusUpdate?.('saving', 'Reflecting on execution...');

        reflection = await agents.reflection.execute(context, {
          executionResult,
          reviewResult: review,
          plan,
          workflowResult: result,
          intentAnalysis,
        });

        if (WORKFLOW_CONFIG.logStages) {
          // SelfReflectionAgent reflection completed silently
        }
      } catch (error: any) {
        // Self-reflection is non-critical - log and continue
        const errorMessage = error?.message || String(error);
        const isRateLimit = errorMessage.includes('Too Many Requests') ||
          errorMessage.includes('429') ||
          errorMessage.includes('rate limit');

        if (isRateLimit) {
          
        } else {
          
        }

        // Continue without reflection - workflow should not fail
        reflection = null;
      }
    }

    // Stage 12: STORE AS AGENT MEMORY (async, don't wait)
    if (context.sessionId && reflection) {
      AgentMemoryEngine.saveAgentMemory(
        context.sessionId,
        context.userId,
        intentAnalysis,
        reflection,
        result
      ).catch(error => {
        
      });
    }

    // Stage 13: MEMORY UPDATE (async, don't wait)
    if (context.sessionId) {
      context.onStatusUpdate?.('saving', 'Saving results...');
      MemoryEngine.saveWorkflowResult(
        context.sessionId,
        context.userId,
        normalizedInput.original,
        result,
        intentAnalysis
      ).catch(error => {
        
      });
    }

    context.onStatusUpdate?.('completed', 'Completed!');

    if (WORKFLOW_CONFIG.logStages) {
      // Workflow completed silently
    }

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    if (WORKFLOW_CONFIG.logStages) {
      console.error('Workflow error', {
        error: errorMessage,
        stack: errorStack,
        stagesExecuted,
        executionAttempts,
        revisionAttempts,
        mode: context.mode,
        provider: context.provider,
        framework: context.framework,
        hadImages: (context.images?.length || 0) > 0,
      });
    }

    stateMachine.transition('ERROR', {
      error: errorMessage,
      stagesExecuted,
      executionAttempts,
      revisionAttempts,
    });
    context.onStatusUpdate?.('error', `Error: ${errorMessage.substring(0, 100)}`);

    // Return error result with detailed context
    return {
      response: context.mode === 'builder'
        ? `// Error: ${errorMessage}\n// Please try again or switch provider.\n// Stages completed: ${stagesExecuted.join(', ')}`
        : `I apologize, but I encountered an error while processing your request.\n\nError: ${errorMessage}\n\nStages completed: ${stagesExecuted.join(', ')}\n\nPlease try again.`,
      metadata: {
        tokensUsed: totalTokensUsed,
        executionTime,
        qualityScore: 0,
        stagesExecuted,
        executionAttempts,
        revisionAttempts,
        finalState: 'ERROR' as WorkflowState,
        errorMessage,
      },
    };
  }
}

/**
 * Workflow Configuration
 * Controls behavior of the multi-stage AI workflow
 */

export const WORKFLOW_CONFIG = {
  // Enable/disable workflow stages
  enablePlanner: true,
  enableReviewer: true,
  
  // Skip stages for simple requests to save time and tokens
  skipPlannerForSimple: true,
  skipReviewerForSimple: true,
  
  // Retry configuration
  maxRetries: 2, // Max retries for executor
  maxRevisions: 2, // Max revisions when reviewer rejects
  retryDelay: 1000, // milliseconds
  revisionDelay: 1500, // milliseconds between revisions
  
  // Timeout configuration (milliseconds)
  timeout: 60000, // 60 seconds total
  plannerTimeout: 15000, // 15 seconds for planning
  executorTimeout: 30000, // 30 seconds for execution
  reviewerTimeout: 15000, // 15 seconds for review
  
  // Quality thresholds
  qualityThreshold: 0.7, // Minimum quality score (0-1)
  requireReviewForLowQuality: true, // Force review if quality < threshold
  
  // Complexity thresholds
  simpleRequestMaxLength: 100, // Characters
  simpleRequestKeywords: ['hello', 'hi', 'thanks', 'ok', 'yes', 'no'],
  
  // Model selection
  defaultPlannerModel: 'anthropic' as const, // GPT-OSS-20B
  defaultExecutorModel: 'deepseek' as const, // DEVSTRAL
  defaultReviewerModel: 'anthropic' as const, // GPT-OSS-20B
  
  // Memory configuration
  enableMemory: true,
  maxMemoryEntries: 100, // Per session
  memoryRetrievalLimit: 5, // Number of past entries to retrieve
  
  // Feature flags
  enableStreaming: false, // Stream responses (future feature)
  enableParallelExecution: false, // Execute some stages in parallel (future feature)
  enableWorkflow: true, // Enable multi-stage workflow (set to false to use direct generation)
  
  // Debug mode
  debug: false,
  logStages: true,
};

export type WorkflowConfig = typeof WORKFLOW_CONFIG;

/**
 * Workflow Configuration
 * Controls behavior of the multi-stage AI workflow
 */

export const WORKFLOW_CONFIG = {
  // Enable/disable workflow stages
  // DISABLED: Planner and Reviewer to save tokens (3 API calls -> 1)
  enablePlanner: false,
  enableReviewer: false,

  // Skip stages for simple requests to save time and tokens
  skipPlannerForSimple: true,
  skipReviewerForSimple: true,

  // Retry configuration
  maxRetries: 1, // Reduced from 2 for faster response
  maxRevisions: 1, // Reduced from 2 for faster response
  retryDelay: 500, // Reduced from 1000ms
  revisionDelay: 500, // Reduced from 1500ms

  // Timeout configuration (milliseconds) - OPTIMIZED FOR SPEED
  timeout: 30000, // 30 seconds total (reduced from 60s)
  plannerTimeout: 8000, // 8 seconds for planning (reduced from 15s)
  executorTimeout: 15000, // 15 seconds for execution (reduced from 30s)
  reviewerTimeout: 7000, // 7 seconds for review (reduced from 15s)

  // Quality thresholds
  qualityThreshold: 0.7, // Minimum quality score (0-1)
  requireReviewForLowQuality: true, // Force review if quality < threshold

  // Complexity thresholds
  simpleRequestMaxLength: 100, // Characters
  simpleRequestKeywords: ['hello', 'hi', 'thanks', 'ok', 'yes', 'no'],

  // Model selection - Use Groq for all stages (fast!)
  defaultPlannerModel: 'groq' as const, // Groq Llama 3.3 70B
  defaultExecutorModel: 'groq' as const, // Groq Llama 3.3 70B
  defaultReviewerModel: 'groq' as const, // Groq Llama 3.3 70B

  // Memory configuration
  enableMemory: true,
  enableMCP: process.env.NODE_ENV !== 'production', // Disable MCP in production (browser incompatible)
  maxMemoryEntries: 100, // Per session
  memoryRetrievalLimit: 5, // Number of past entries to retrieve

  // Feature flags
  enableStreaming: false, // Stream responses (future feature)
  enableParallelExecution: false, // Execute some stages in parallel (future feature)
  enableWorkflow: false, // DISABLED - Gemini/SumoPod handles everything directly

  // Debug mode
  debug: false,
  logStages: true,
};

export type WorkflowConfig = typeof WORKFLOW_CONFIG;

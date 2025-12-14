import { Plan } from '../agenticPlanner';
import { AIProvider, Framework } from '../ai';

// Message type for workflow (compatible with ChatInterface Message)
export interface Message {
  role: 'user' | 'ai';
  content: string;
  code?: string;
  images?: string[];
  timestamp?: Date;
}

// Explicit workflow states for better debugging
export type WorkflowState = 
  | 'IDLE'
  | 'PLANNING'
  | 'EXECUTING'
  | 'REVIEWING'
  | 'REVISING'
  | 'DONE'
  | 'ERROR';

// Status for UI updates (backward compatible)
export type WorkflowStatus = 
  | 'idle'
  | 'preprocessing'
  | 'routing'
  | 'planning'
  | 'executing'
  | 'reviewing'
  | 'revising'
  | 'saving'
  | 'completed'
  | 'error';

export interface WorkflowContext {
  userId?: string;
  sessionId?: string;
  prompt: string;
  mode: 'builder' | 'tutor';
  provider: AIProvider;
  history: Message[];
  images?: string[];
  framework?: Framework;
  metadata?: Record<string, any>;
  onStatusUpdate?: (status: WorkflowStatus, message?: string) => void;
  onStateChange?: (state: WorkflowState, details?: Record<string, any>) => void; // Explicit state changes
}

export interface PreprocessedInput {
  cleanedPrompt: string;
  intent: 'code_generation' | 'question' | 'edit' | 'explanation';
  context: {
    hasCode: boolean;
    hasImages: boolean;
    framework?: Framework;
    complexity: 'simple' | 'medium' | 'complex';
  };
  metadata: Record<string, any>;
}

export interface RoutingDecision {
  plannerModel: 'anthropic' | 'gemini'; // GPT-OSS-20B
  executorModel: 'deepseek'; // DEVSTRAL
  reviewerModel: 'anthropic' | 'gemini'; // GPT-OSS-20B
  skipStages?: ('planner' | 'reviewer')[]; // For simple requests
}

export interface ExecutionStep {
  step: number;
  action: string;
  expectedOutput: string;
  dependencies: number[];
}

export interface EnhancedPlan extends Plan {
  executionSteps: ExecutionStep[];
  qualityCriteria: string[];
  reviewChecklist: string[];
}

export interface ExecutionResult {
  code?: string;
  explanation?: string;
  files?: Array<{ path: string; content: string; type: string }>;
  metadata: {
    tokensUsed: number;
    executionTime: number;
    qualityScore?: number;
  };
}

export interface ReviewIssue {
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  location?: string;
}

export interface ReviewResult {
  improvedCode?: string;
  improvedExplanation?: string;
  issues: ReviewIssue[];
  qualityScore: number;
  suggestions: string[];
  rejected?: boolean; // Reviewer can reject and trigger revision
  rejectionReason?: string; // Reason for rejection
}

export interface WorkflowResult {
  response: string;
  code?: string;
  explanation?: string;
  files?: Array<{ path: string; content: string; type: string }>;
  plan?: EnhancedPlan;
  review?: ReviewResult;
  metadata?: {
    tokensUsed: number;
    executionTime: number;
    qualityScore?: number;
    stagesExecuted: string[];
    executionAttempts?: number; // Number of execution attempts
    revisionAttempts?: number; // Number of revision attempts
    finalState?: WorkflowState; // Final state of workflow
  };
}

export interface MemoryEntry {
  sessionId: string;
  userId?: string;
  timestamp: Date;
  prompt: string;
  response: string;
  code?: string;
  plan?: Plan;
  review?: ReviewResult;
  metadata: Record<string, any>;
}

/**
 * Agent Memory Entry
 * Stores self-reflection and learning for continuous improvement
 */
export interface AgentMemoryEntry {
  id?: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  intent: string;
  whatWorked: string[];
  whatFailed: string[];
  whatToImprove: string[];
  lessonsLearned: string[];
  qualityScore: number;
  confidence: number;
  recommendations: string[];
  metadata: {
    executionAttempts?: number;
    revisionAttempts?: number;
    stagesExecuted?: string[];
    finalState?: WorkflowState;
    [key: string]: any;
  };
}

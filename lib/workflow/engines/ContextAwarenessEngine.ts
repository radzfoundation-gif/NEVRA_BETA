import { Message, WorkflowState } from '../types';
import { getUser } from '../../database';
import { AgentMemoryEntry } from '../types';
import { AgentMemoryEngine } from './AgentMemoryEngine';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';

/**
 * Context Awareness Engine
 * Tracks current state, past history, and future plans for AI awareness
 */
export interface ContextAwareness {
  // Current State
  current: {
    timestamp: Date;
    state: WorkflowState;
    currentTask?: string;
    currentIntent?: string;
    activeSession?: string;
    isProcessing: boolean;
  };
  
  // Past (History & Memory)
  past: {
    recentMessages: Message[];
    recentIntents: Array<{ intent: string; timestamp: Date }>;
    recentWorkflows: Array<{
      intent: string;
      qualityScore: number;
      timestamp: Date;
      whatWorked: string[];
      whatFailed: string[];
    }>;
    agentMemories: AgentMemoryEntry[];
    userHistory: {
      totalSessions: number;
      totalMessages: number;
      commonPatterns: string[];
    };
  };
  
  // Future (Planned/Upcoming)
  future: {
    plannedTasks: Array<{
      task: string;
      priority: 'low' | 'normal' | 'high';
      estimatedTime?: number;
    }>;
    upcomingIntents: string[];
    pendingImprovements: string[];
  };
  
  // User Information
  user: {
    id: string;
    name: string | null;
    email: string | null;
    preferences?: Record<string, any>;
  };
}

export class ContextAwarenessEngine {
  /**
   * Build comprehensive context awareness
   */
  static async buildContext(
    userId: string | undefined,
    sessionId: string | undefined,
    currentState: WorkflowState,
    history: Message[],
    intentAnalysis: IntentAnalysis,
    currentTask?: string
  ): Promise<ContextAwareness | null> {
    if (!userId) {
      return null;
    }

    try {
      // Load user information
      const user = await getUser(userId);
      
      // Load agent memories
      const agentMemories = await AgentMemoryEngine.retrieveAgentMemory(
        intentAnalysis.primaryIntent,
        userId,
        10
      );

      // Analyze past
      const past = this.analyzePast(history, agentMemories);

      // Analyze future
      const future = this.analyzeFuture(agentMemories, intentAnalysis);

      return {
        current: {
          timestamp: new Date(),
          state: currentState,
          currentTask,
          currentIntent: intentAnalysis.primaryIntent,
          activeSession: sessionId,
          isProcessing: currentState !== 'IDLE' && currentState !== 'DONE' && currentState !== 'ERROR',
        },
        past,
        future,
        user: {
          id: userId,
          name: user?.full_name || null,
          email: user?.email || null,
        },
      };
    } catch (error) {
      console.error('ContextAwarenessEngine: Error building context', error);
      return null;
    }
  }

  /**
   * Analyze past (history and memory)
   */
  private static analyzePast(
    history: Message[],
    agentMemories: AgentMemoryEntry[]
  ): ContextAwareness['past'] {
    // Recent messages (last 10)
    const recentMessages = history.slice(-10);

    // Recent intents from agent memories
    const recentIntents = agentMemories
      .slice(0, 5)
      .map(mem => ({
        intent: mem.intent,
        timestamp: mem.timestamp,
      }));

    // Recent workflows from agent memories
    const recentWorkflows = agentMemories
      .slice(0, 5)
      .map(mem => ({
        intent: mem.intent,
        qualityScore: mem.qualityScore,
        timestamp: mem.timestamp,
        whatWorked: mem.whatWorked,
        whatFailed: mem.whatFailed,
      }));

    // User history analysis
    const totalMessages = history.length;
    const totalSessions = new Set(history.map(msg => msg.timestamp?.getTime() || 0)).size;
    
    // Common patterns from messages
    const commonPatterns: string[] = [];
    const messageTexts = history
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content.toLowerCase());
    
    // Extract common phrases/patterns
    const phraseCounts: Record<string, number> = {};
    messageTexts.forEach(text => {
      const words = text.split(/\s+/).filter(w => w.length > 3);
      words.forEach((word, i) => {
        if (i < words.length - 1) {
          const phrase = `${word} ${words[i + 1]}`;
          phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
      });
    });

    const topPhrases = Object.entries(phraseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([phrase]) => phrase);
    
    commonPatterns.push(...topPhrases);

    return {
      recentMessages,
      recentIntents,
      recentWorkflows,
      agentMemories,
      userHistory: {
        totalSessions,
        totalMessages,
        commonPatterns,
      },
    };
  }

  /**
   * Analyze future (planned tasks and improvements)
   */
  private static analyzeFuture(
    agentMemories: AgentMemoryEntry[],
    intentAnalysis: IntentAnalysis
  ): ContextAwareness['future'] {
    // Planned tasks from what to improve
    const allImprovements = agentMemories.flatMap(mem => mem.whatToImprove);
    const improvementCounts: Record<string, number> = {};
    
    allImprovements.forEach(improvement => {
      improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    });

    const plannedTasks = Object.entries(improvementCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([task, count]) => ({
        task,
        priority: count >= 3 ? 'high' as const : count >= 2 ? 'normal' as const : 'low' as const,
      }));

    // Upcoming intents (based on patterns)
    const upcomingIntents: string[] = [];
    if (intentAnalysis.requirements.components && intentAnalysis.requirements.components.length > 0) {
      upcomingIntents.push('component_development');
    }
    if (intentAnalysis.requirements.features && intentAnalysis.requirements.features.length > 0) {
      upcomingIntents.push('feature_implementation');
    }

    // Pending improvements from agent memories
    const pendingImprovements = AgentMemoryEngine.getImprovementSuggestions(agentMemories);

    return {
      plannedTasks,
      upcomingIntents,
      pendingImprovements,
    };
  }

  /**
   * Generate context summary for AI prompts
   */
  static generateContextSummary(context: ContextAwareness): string {
    const parts: string[] = [];

    // User information
    if (context.user.name) {
      parts.push(`\n=== USER INFORMATION ===`);
      parts.push(`User Name: ${context.user.name}`);
      if (context.user.email) {
        parts.push(`Email: ${context.user.email}`);
      }
    }

    // Current state
    parts.push(`\n=== CURRENT STATE ===`);
    parts.push(`Current Time: ${context.current.timestamp.toLocaleString()}`);
    parts.push(`Workflow State: ${context.current.state}`);
    if (context.current.currentTask) {
      parts.push(`Current Task: ${context.current.currentTask}`);
    }
    if (context.current.currentIntent) {
      parts.push(`Current Intent: ${context.current.currentIntent}`);
    }
    parts.push(`Is Processing: ${context.current.isProcessing ? 'Yes' : 'No'}`);

    // Past (what happened before)
    parts.push(`\n=== PAST (What Happened Before) ===`);
    parts.push(`Total Messages: ${context.past.userHistory.totalMessages}`);
    parts.push(`Total Sessions: ${context.past.userHistory.totalSessions}`);
    
    if (context.past.recentIntents.length > 0) {
      parts.push(`\nRecent Intents:`);
      context.past.recentIntents.forEach((intent, i) => {
        parts.push(`${i + 1}. ${intent.intent} (${intent.timestamp.toLocaleDateString()})`);
      });
    }

    if (context.past.recentWorkflows.length > 0) {
      parts.push(`\nRecent Workflows:`);
      context.past.recentWorkflows.forEach((workflow, i) => {
        parts.push(`${i + 1}. ${workflow.intent} - Quality: ${workflow.qualityScore.toFixed(2)}`);
        if (workflow.whatWorked.length > 0) {
          parts.push(`   What Worked: ${workflow.whatWorked[0]}`);
        }
        if (workflow.whatFailed.length > 0) {
          parts.push(`   What Failed: ${workflow.whatFailed[0]}`);
        }
      });
    }

    if (context.past.userHistory.commonPatterns.length > 0) {
      parts.push(`\nCommon Patterns: ${context.past.userHistory.commonPatterns.join(', ')}`);
    }

    // Future (what's planned)
    parts.push(`\n=== FUTURE (What's Planned) ===`);
    if (context.future.plannedTasks.length > 0) {
      parts.push(`Planned Tasks:`);
      context.future.plannedTasks.forEach((task, i) => {
        parts.push(`${i + 1}. [${task.priority.toUpperCase()}] ${task.task}`);
      });
    }

    if (context.future.upcomingIntents.length > 0) {
      parts.push(`\nUpcoming Intents: ${context.future.upcomingIntents.join(', ')}`);
    }

    if (context.future.pendingImprovements.length > 0) {
      parts.push(`\nPending Improvements:`);
      context.future.pendingImprovements.forEach((improvement, i) => {
        parts.push(`${i + 1}. ${improvement}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Update context awareness (call this periodically)
   */
  static async updateContext(
    context: ContextAwareness,
    newState: WorkflowState,
    newTask?: string
  ): Promise<ContextAwareness> {
    return {
      ...context,
      current: {
        ...context.current,
        timestamp: new Date(),
        state: newState,
        currentTask: newTask,
        isProcessing: newState !== 'IDLE' && newState !== 'DONE' && newState !== 'ERROR',
      },
    };
  }
}

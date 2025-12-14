import { ContextAwareness } from '../engines/ContextAwarenessEngine';
import { UserProfile } from '../engines/UserProfileEngine';
import { IntentAnalysis } from '../analyzers/IntentAnalyzer';

/**
 * Prompt Enhancer
 * Enhances system prompts with user name and context awareness
 */
export class PromptEnhancer {
  /**
   * Enhance system prompt with user name and context
   */
  static enhanceSystemPrompt(
    basePrompt: string,
    contextAwareness: ContextAwareness | null,
    userProfile: UserProfile | null,
    intentAnalysis: IntentAnalysis
  ): string {
    let enhanced = basePrompt;

    // Add user name and personalization
    if (contextAwareness?.user.name || userProfile?.userName) {
      const userName = contextAwareness?.user.name || userProfile?.userName;
      enhanced = `You are having a conversation with ${userName}.\n\nRemember their name throughout the conversation and use it naturally when appropriate.\n\n${enhanced}`;
    }

    // Add context awareness section
    if (contextAwareness) {
      const contextSummary = this.generateContextSummary(contextAwareness, intentAnalysis);
      enhanced = `${enhanced}\n\n=== CONTEXT AWARENESS ===\nYou have access to comprehensive context about the current situation:\n\n${contextSummary}\n\nUse this context to:\n- Remember what happened before (PAST)\n- Understand what's happening now (CURRENT)\n- Anticipate what might come next (FUTURE)\n- Personalize responses using the user's name: ${contextAwareness.user.name || 'the user'}\n\nAlways stay aware of the full context and avoid confusion. If you're unsure about something, refer back to the context provided above.`;
    }

    // Add user preferences if available
    if (userProfile) {
      if (userProfile.history.preferredFramework) {
        enhanced = `${enhanced}\n\n=== USER PREFERENCES ===\nPreferred Framework: ${userProfile.history.preferredFramework}\nPreferred Style: ${userProfile.history.preferredStyle || 'modern'}\nDetail Level: ${userProfile.behavior.detailLevel}\n\nConsider these preferences when generating responses.`;
      }
    }

    return enhanced;
  }

  /**
   * Generate context summary for prompt
   */
  private static generateContextSummary(
    context: ContextAwareness,
    intentAnalysis: IntentAnalysis
  ): string {
    const parts: string[] = [];

    // Current state
    parts.push(`📍 CURRENT STATE (What's Happening Now):`);
    parts.push(`- Current Time: ${context.current.timestamp.toLocaleString()}`);
    parts.push(`- Workflow State: ${context.current.state}`);
    if (context.current.currentTask) {
      parts.push(`- Current Task: ${context.current.currentTask}`);
    }
    parts.push(`- Current Intent: ${intentAnalysis.primaryIntent} (confidence: ${(intentAnalysis.confidence * 100).toFixed(0)}%)`);
    parts.push(`- Is Processing: ${context.current.isProcessing ? 'Yes, actively working' : 'No, idle'}`);

    // Past
    parts.push(`\n📚 PAST (What Happened Before):`);
    parts.push(`- Total Messages: ${context.past.userHistory.totalMessages}`);
    parts.push(`- Total Sessions: ${context.past.userHistory.totalSessions}`);
    
    if (context.past.recentIntents.length > 0) {
      parts.push(`- Recent Intents:`);
      context.past.recentIntents.slice(0, 3).forEach((intent, i) => {
        parts.push(`  ${i + 1}. ${intent.intent} (${this.formatTimeAgo(intent.timestamp)})`);
      });
    }

    if (context.past.recentWorkflows.length > 0) {
      parts.push(`- Recent Workflows:`);
      context.past.recentWorkflows.slice(0, 2).forEach((workflow, i) => {
        parts.push(`  ${i + 1}. ${workflow.intent} - Quality: ${(workflow.qualityScore * 100).toFixed(0)}%`);
        if (workflow.whatWorked.length > 0) {
          parts.push(`     ✓ Worked: ${workflow.whatWorked[0].substring(0, 60)}...`);
        }
        if (workflow.whatFailed.length > 0) {
          parts.push(`     ✗ Failed: ${workflow.whatFailed[0].substring(0, 60)}...`);
        }
      });
    }

    if (context.past.userHistory.commonPatterns.length > 0) {
      parts.push(`- Common Patterns: ${context.past.userHistory.commonPatterns.slice(0, 3).join(', ')}`);
    }

    // Future
    parts.push(`\n🔮 FUTURE (What's Planned/Coming Next):`);
    if (context.future.plannedTasks.length > 0) {
      parts.push(`- Planned Tasks:`);
      context.future.plannedTasks.slice(0, 3).forEach((task, i) => {
        parts.push(`  ${i + 1}. [${task.priority.toUpperCase()}] ${task.task}`);
      });
    }

    if (context.future.pendingImprovements.length > 0) {
      parts.push(`- Pending Improvements: ${context.future.pendingImprovements.slice(0, 3).join(', ')}`);
    }

    if (context.future.upcomingIntents.length > 0) {
      parts.push(`- Upcoming Intents: ${context.future.upcomingIntents.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Format time ago
   */
  private static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Enhance user prompt with context awareness
   */
  static enhanceUserPrompt(
    userPrompt: string,
    contextAwareness: ContextAwareness | null
  ): string {
    if (!contextAwareness) {
      return userPrompt;
    }

    // Add subtle context hints if needed
    // Don't overwhelm the prompt, just add relevant context
    let enhanced = userPrompt;

    // If user has pending improvements, subtly hint
    if (contextAwareness.future.pendingImprovements.length > 0 && 
        contextAwareness.future.pendingImprovements[0].toLowerCase().includes('improve')) {
      // Context is already in system prompt, no need to duplicate
    }

    return enhanced;
  }
}

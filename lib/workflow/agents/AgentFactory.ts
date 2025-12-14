import { IAgent } from './BaseAgent';
import { PlannerAgent } from './PlannerAgent';
import { ExecutorAgent } from './ExecutorAgent';
import { ReviewerAgent } from './ReviewerAgent';
import { SelfReflectionAgent } from './SelfReflectionAgent';
import { RoutingDecision, MemoryEntry } from '../types';

/**
 * Agent Tools Interface
 */
export interface AgentTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

/**
 * Agent Configuration
 */
export interface AgentConfig {
  model: string;
  tools?: AgentTool[];
  memory?: MemoryEntry[];
  context?: Record<string, any>;
}

/**
 * Agent Factory
 * Creates and manages agent instances with model binding, tools, and memory injection
 */
export class AgentFactory {
  private static agents: Map<string, IAgent> = new Map();
  private static agentConfigs: Map<string, AgentConfig> = new Map();

  /**
   * Get or create Planner Agent (GPT-OSS-20B) with configuration
   */
  static getPlannerAgent(
    model: 'anthropic' | 'gemini' = 'anthropic',
    config?: Partial<AgentConfig>
  ): PlannerAgent {
    const key = `planner-${model}`;
    
    if (!this.agents.has(key)) {
      const agent = new PlannerAgent(model);
      this.agents.set(key, agent);
      
      // Store configuration
      this.agentConfigs.set(key, {
        model,
        tools: config?.tools,
        memory: config?.memory,
        context: config?.context,
      });
    } else if (config) {
      // Update configuration if provided
      const existingConfig = this.agentConfigs.get(key) || { model };
      this.agentConfigs.set(key, {
        ...existingConfig,
        ...config,
        model, // Ensure model matches
      });
    }
    
    return this.agents.get(key) as PlannerAgent;
  }

  /**
   * Get or create Executor Agent (DEVSTRAL) with configuration
   */
  static getExecutorAgent(
    model: 'deepseek' = 'deepseek',
    config?: Partial<AgentConfig>
  ): ExecutorAgent {
    const key = `executor-${model}`;
    
    if (!this.agents.has(key)) {
      const agent = new ExecutorAgent(model);
      this.agents.set(key, agent);
      
      // Store configuration
      this.agentConfigs.set(key, {
        model,
        tools: config?.tools,
        memory: config?.memory,
        context: config?.context,
      });
    } else if (config) {
      // Update configuration if provided
      const existingConfig = this.agentConfigs.get(key) || { model };
      this.agentConfigs.set(key, {
        ...existingConfig,
        ...config,
        model, // Ensure model matches
      });
    }
    
    return this.agents.get(key) as ExecutorAgent;
  }

  /**
   * Get or create Reviewer Agent (GPT-OSS-20B) with configuration
   */
  static getReviewerAgent(
    model: 'anthropic' | 'gemini' = 'anthropic',
    config?: Partial<AgentConfig>
  ): ReviewerAgent {
    const key = `reviewer-${model}`;
    
    if (!this.agents.has(key)) {
      const agent = new ReviewerAgent(model);
      this.agents.set(key, agent);
      
      // Store configuration
      this.agentConfigs.set(key, {
        model,
        tools: config?.tools,
        memory: config?.memory,
        context: config?.context,
      });
    } else if (config) {
      // Update configuration if provided
      const existingConfig = this.agentConfigs.get(key) || { model };
      this.agentConfigs.set(key, {
        ...existingConfig,
        ...config,
        model, // Ensure model matches
      });
    }
    
    return this.agents.get(key) as ReviewerAgent;
  }

  /**
   * Get or create Self-Reflection Agent (GPT-OSS-20B)
   */
  static getSelfReflectionAgent(
    model: 'anthropic' | 'gemini' = 'anthropic',
    config?: Partial<AgentConfig>
  ): SelfReflectionAgent {
    const key = `reflection-${model}`;
    
    if (!this.agents.has(key)) {
      const agent = new SelfReflectionAgent(model);
      this.agents.set(key, agent);
      
      // Store configuration
      this.agentConfigs.set(key, {
        model,
        tools: config?.tools,
        memory: config?.memory,
        context: config?.context,
      });
    } else if (config) {
      // Update configuration if provided
      const existingConfig = this.agentConfigs.get(key) || { model };
      this.agentConfigs.set(key, {
        ...existingConfig,
        ...config,
        model, // Ensure model matches
      });
    }
    
    return this.agents.get(key) as SelfReflectionAgent;
  }

  /**
   * Create agents from routing decision with full configuration
   */
  static createAgentsFromRouting(
    routing: RoutingDecision,
    config?: {
      tools?: AgentTool[];
      memory?: MemoryEntry[];
      context?: Record<string, any>;
    }
  ): {
    planner?: PlannerAgent;
    executor: ExecutorAgent;
    reviewer?: ReviewerAgent;
    reflection?: SelfReflectionAgent;
  } {
    return {
      planner: this.getPlannerAgent(routing.plannerModel, {
        tools: config?.tools,
        memory: config?.memory,
        context: config?.context,
      }),
      executor: this.getExecutorAgent(routing.executorModel, {
        tools: config?.tools,
        memory: config?.memory,
        context: config?.context,
      }),
      reviewer: this.getReviewerAgent(routing.reviewerModel, {
        tools: config?.tools,
        memory: config?.memory,
        context: config?.context,
      }),
      reflection: this.getSelfReflectionAgent(routing.reviewerModel, {
        tools: config?.tools,
        memory: config?.memory,
        context: config?.context,
      }),
    };
  }

  /**
   * Bind model to agent (ensures strict routing)
   */
  static bindModel(agentKey: string, model: string): void {
    const config = this.agentConfigs.get(agentKey);
    if (config) {
      config.model = model;
      this.agentConfigs.set(agentKey, config);
    }
  }

  /**
   * Inject tools into agent
   */
  static injectTools(agentKey: string, tools: AgentTool[]): void {
    const config = this.agentConfigs.get(agentKey);
    if (config) {
      config.tools = [...(config.tools || []), ...tools];
      this.agentConfigs.set(agentKey, config);
    }
  }

  /**
   * Inject memory into agent
   */
  static injectMemory(agentKey: string, memory: MemoryEntry[]): void {
    const config = this.agentConfigs.get(agentKey);
    if (config) {
      config.memory = [...(config.memory || []), ...memory];
      this.agentConfigs.set(agentKey, config);
    }
  }

  /**
   * Get agent configuration
   */
  static getAgentConfig(agentKey: string): AgentConfig | undefined {
    return this.agentConfigs.get(agentKey);
  }

  /**
   * Clear all cached agents (useful for testing)
   */
  static clearCache(): void {
    this.agents.clear();
    this.agentConfigs.clear();
  }

  /**
   * Get all active agents
   */
  static getActiveAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }
}

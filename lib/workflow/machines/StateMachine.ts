import { WorkflowState } from '../types';

/**
 * State Machine
 * Formal state management for workflow
 */
export type StateTransition = {
  from: WorkflowState;
  to: WorkflowState;
  condition?: () => boolean;
  onTransition?: () => void;
};

export class StateMachine {
  private currentState: WorkflowState = 'IDLE';
  private stateHistory: Array<{ state: WorkflowState; timestamp: number; details?: any }> = [];
  private transitions: Map<string, StateTransition> = new Map();
  private listeners: Map<WorkflowState, Array<(details?: any) => void>> = new Map();

  constructor() {
    this.initializeTransitions();
  }

  /**
   * Initialize valid state transitions
   */
  private initializeTransitions(): void {
    // IDLE -> PLANNING, EXECUTING
    this.addTransition({ from: 'IDLE', to: 'PLANNING' });
    this.addTransition({ from: 'IDLE', to: 'EXECUTING' });

    // PLANNING -> EXECUTING, ERROR
    this.addTransition({ from: 'PLANNING', to: 'EXECUTING' });
    this.addTransition({ from: 'PLANNING', to: 'ERROR' });

    // EXECUTING -> REVIEWING, REVISING, ERROR, DONE
    this.addTransition({ from: 'EXECUTING', to: 'REVIEWING' });
    this.addTransition({ from: 'EXECUTING', to: 'REVISING' });
    this.addTransition({ from: 'EXECUTING', to: 'ERROR' });
    this.addTransition({ from: 'EXECUTING', to: 'DONE' });

    // REVIEWING -> REVISING, DONE, ERROR
    this.addTransition({ from: 'REVIEWING', to: 'REVISING' });
    this.addTransition({ from: 'REVIEWING', to: 'DONE' });
    this.addTransition({ from: 'REVIEWING', to: 'ERROR' });

    // REVISING -> EXECUTING, DONE, ERROR
    this.addTransition({ from: 'REVISING', to: 'EXECUTING' });
    this.addTransition({ from: 'REVISING', to: 'DONE' });
    this.addTransition({ from: 'REVISING', to: 'ERROR' });

    // ERROR -> IDLE, DONE
    this.addTransition({ from: 'ERROR', to: 'IDLE' });
    this.addTransition({ from: 'ERROR', to: 'DONE' });

    // DONE -> IDLE
    this.addTransition({ from: 'DONE', to: 'IDLE' });
  }

  /**
   * Add a state transition
   */
  private addTransition(transition: StateTransition): void {
    const key = `${transition.from}->${transition.to}`;
    this.transitions.set(key, transition);
  }

  /**
   * Get current state
   */
  getState(): WorkflowState {
    return this.currentState;
  }

  /**
   * Get state history
   */
  getHistory(): Array<{ state: WorkflowState; timestamp: number; details?: any }> {
    return [...this.stateHistory];
  }

  /**
   * Transition to a new state
   */
  transition(to: WorkflowState, details?: any): boolean {
    const key = `${this.currentState}->${to}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      console.warn(`Invalid state transition: ${this.currentState} -> ${to}`);
      return false;
    }

    // Check condition if exists
    if (transition.condition && !transition.condition()) {
      console.warn(`State transition condition not met: ${this.currentState} -> ${to}`);
      return false;
    }

    // Execute onTransition callback
    if (transition.onTransition) {
      transition.onTransition();
    }

    // Update state
    const previousState = this.currentState;
    this.currentState = to;
    
    // Record in history
    this.stateHistory.push({
      state: to,
      timestamp: Date.now(),
      details,
    });

    // Notify listeners
    this.notifyListeners(to, details);

    return true;
  }

  /**
   * Add state listener
   */
  on(state: WorkflowState, callback: (details?: any) => void): () => void {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, []);
    }
    this.listeners.get(state)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(state);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(state: WorkflowState, details?: any): void {
    const callbacks = this.listeners.get(state);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(details);
        } catch (error) {
          console.error('State listener error:', error);
        }
      });
    }
  }

  /**
   * Reset state machine
   */
  reset(): void {
    this.currentState = 'IDLE';
    this.stateHistory = [];
  }

  /**
   * Check if transition is valid
   */
  canTransition(to: WorkflowState): boolean {
    const key = `${this.currentState}->${to}`;
    return this.transitions.has(key);
  }

  /**
   * Get possible next states
   */
  getPossibleNextStates(): WorkflowState[] {
    const possible: WorkflowState[] = [];
    
    this.transitions.forEach((transition, key) => {
      if (key.startsWith(`${this.currentState}->`)) {
        const to = transition.to;
        if (!possible.includes(to)) {
          possible.push(to);
        }
      }
    });

    return possible;
  }
}

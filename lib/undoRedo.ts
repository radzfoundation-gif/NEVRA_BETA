export interface Operation {
  type: 'edit' | 'create' | 'delete' | 'rename';
  file: string;
  oldContent?: string;
  newContent?: string;
  oldPath?: string;
  newPath?: string;
  timestamp: Date;
}

export class UndoRedoManager {
  private undoStack: Operation[] = [];
  private redoStack: Operation[] = [];
  private maxStackSize: number = 100;

  /**
   * Push an operation to undo stack
   */
  push(operation: Operation): void {
    this.undoStack.push(operation);
    
    // Clear redo stack when new operation is pushed
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo last operation
   */
  undo(): Operation | null {
    if (this.undoStack.length === 0) return null;

    const operation = this.undoStack.pop()!;
    this.redoStack.push(operation);

    return this.reverseOperation(operation);
  }

  /**
   * Redo last undone operation
   */
  redo(): Operation | null {
    if (this.redoStack.length === 0) return null;

    const operation = this.redoStack.pop()!;
    this.undoStack.push(operation);

    return operation;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all operations
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Reverse an operation (for undo)
   */
  private reverseOperation(operation: Operation): Operation {
    switch (operation.type) {
      case 'edit':
        return {
          ...operation,
          oldContent: operation.newContent,
          newContent: operation.oldContent,
        };
      case 'create':
        return {
          ...operation,
          type: 'delete',
        };
      case 'delete':
        return {
          ...operation,
          type: 'create',
        };
      case 'rename':
        return {
          ...operation,
          oldPath: operation.newPath,
          newPath: operation.oldPath,
        };
      default:
        return operation;
    }
  }

  /**
   * Merge consecutive edit operations on same file
   */
  mergeConsecutiveEdits(file: string, newContent: string): void {
    const lastOp = this.undoStack[this.undoStack.length - 1];
    
    if (
      lastOp &&
      lastOp.type === 'edit' &&
      lastOp.file === file &&
      Date.now() - lastOp.timestamp.getTime() < 1000 // Within 1 second
    ) {
      // Merge with last operation
      lastOp.newContent = newContent;
      lastOp.timestamp = new Date();
    } else {
      // Create new operation
      this.push({
        type: 'edit',
        file,
        oldContent: lastOp?.newContent || '',
        newContent,
        timestamp: new Date(),
      });
    }
  }
}

// Singleton instance
let undoRedoInstance: UndoRedoManager | null = null;

export function getUndoRedoManager(): UndoRedoManager {
  if (!undoRedoInstance) {
    undoRedoInstance = new UndoRedoManager();
  }
  return undoRedoInstance;
}

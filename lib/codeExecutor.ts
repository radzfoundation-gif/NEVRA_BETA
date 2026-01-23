/**
 * Code Execution Sandbox for NOIR AI Tutor
 * Provides safe code execution in browser for educational purposes
 */

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  language: string;
}

export interface CodeCell {
  id: string;
  code: string;
  language: 'javascript' | 'python' | 'typescript';
  result?: ExecutionResult;
}

/**
 * Execute JavaScript/TypeScript code in browser
 */
export function executeJavaScript(code: string): ExecutionResult {
  const startTime = performance.now();
  let output = '';
  let error: string | undefined;

  try {
    // Create a safe execution context
    const consoleLog = console.log;
    const logs: string[] = [];

    // Override console.log to capture output
    const originalConsoleLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    // Execute code in try-catch with timeout
    try {
      // Validate code first
      const validation = validateCode(code, 'javascript');
      if (!validation.valid) {
        error = `Code validation failed: ${validation.warnings.join(', ')}`;
      } else {
        // Use Function constructor with restricted scope
        // Note: This is still not fully secure - consider using Web Workers for production
        const func = new Function(`
          'use strict';
          ${code}
        `);

        // Execute with timeout (5 seconds max)
        const timeoutId = setTimeout(() => {
          throw new Error('Execution timeout: Code took too long to execute');
        }, 5000);

        try {
          func();
          clearTimeout(timeoutId);
        } catch (execError: unknown) {
          clearTimeout(timeoutId);
          const errorMessage = execError instanceof Error ? execError.message : String(execError);
          error = errorMessage;
        }
      }
    } catch (execError: unknown) {
      const errorMessage = execError instanceof Error ? execError.message : String(execError);
      error = errorMessage;
    } finally {
      // Always restore console.log
      console.log = originalConsoleLog;
    }

    output = logs.join('\n');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error = errorMessage;
  }

  const executionTime = performance.now() - startTime;

  return {
    output: output || (error ? '' : 'Code executed successfully (no output)'),
    error,
    executionTime,
    language: 'javascript',
  };
}

/**
 * Execute Python code (requires backend API)
 */
export async function executePython(code: string): Promise<ExecutionResult> {
  const startTime = performance.now();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

  try {
    const response = await fetch(`${API_BASE}/execute-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language: 'python',
      }),
    });

    if (!response.ok) {
      throw new Error(`Execution failed: ${response.statusText}`);
    }

    const data = await response.json();
    const executionTime = performance.now() - startTime;

    return {
      output: data.output || '',
      error: data.error,
      executionTime,
      language: 'python',
    };
  } catch (error: unknown) {
    const executionTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Failed to execute Python code';
    return {
      output: '',
      error: errorMessage,
      executionTime,
      language: 'python',
    };
  }
}

/**
 * Execute code based on language
 */
export async function executeCode(
  code: string,
  language: 'javascript' | 'python' | 'typescript'
): Promise<ExecutionResult> {
  if (language === 'python') {
    return executePython(code);
  } else {
    // JavaScript and TypeScript both execute as JS
    return executeJavaScript(code);
  }
}

/**
 * Format execution result for display
 */
export function formatExecutionResult(result: ExecutionResult): string {
  let formatted = '';

  if (result.error) {
    formatted += `❌ **Error:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
  }

  if (result.output) {
    formatted += `📤 **Output:**\n\`\`\`\n${result.output}\n\`\`\`\n\n`;
  }

  formatted += `⏱️ Execution time: ${result.executionTime.toFixed(2)}ms`;

  return formatted;
}

/**
 * Validate code for safety (basic checks)
 */
export function validateCode(code: string, language: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /document\.cookie/,
    /localStorage\.clear/,
    /sessionStorage\.clear/,
    /XMLHttpRequest/,
    /fetch\s*\(/,
  ];

  dangerousPatterns.forEach((pattern) => {
    if (pattern.test(code)) {
      warnings.push(`Potentially unsafe pattern detected: ${pattern}`);
    }
  });

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

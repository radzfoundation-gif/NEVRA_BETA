/**
 * ESLint integration utilities
 * Note: Full ESLint requires ESLint library in browser
 * This is a simplified version for basic linting rules
 */

export interface LintError {
  line: number;
  column: number;
  message: string;
  ruleId: string;
  severity: 'error' | 'warning';
  fixable?: boolean;
}

/**
 * Basic ESLint rules for React/TypeScript
 */
export function lintCode(code: string): LintError[] {
  const errors: LintError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Rule: No console.log in production
    if (line.includes('console.log') && !line.includes('// eslint-disable')) {
      errors.push({
        line: lineNum,
        column: line.indexOf('console.log') || 0,
        message: 'Unexpected console statement',
        ruleId: 'no-console',
        severity: 'warning',
        fixable: true,
      });
    }

    // Rule: Use const instead of let when possible
    if (/let\s+\w+\s*=\s*[^=]+;/.test(line) && !line.includes('=')) {
      errors.push({
        line: lineNum,
        column: 0,
        message: 'Prefer const over let',
        ruleId: 'prefer-const',
        severity: 'warning',
        fixable: true,
      });
    }

    // Rule: Missing key prop in map
    if (line.includes('.map(') && !line.includes('key=') && !line.includes('key =')) {
      errors.push({
        line: lineNum,
        column: 0,
        message: 'Missing "key" prop in map',
        ruleId: 'react/jsx-key',
        severity: 'error',
        fixable: false,
      });
    }

    // Rule: Unused variables (basic check)
    const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
    if (varMatch) {
      const varName = varMatch[1];
      // Check if variable is used later (simplified)
      const laterCode = lines.slice(index + 1).join('\n');
      if (!laterCode.includes(varName) && !line.includes('export')) {
        errors.push({
          line: lineNum,
          column: 0,
          message: `'${varName}' is assigned a value but never used`,
          ruleId: 'no-unused-vars',
          severity: 'warning',
          fixable: true,
        });
      }
    }

    // Rule: Missing dependencies in useEffect
    if (line.includes('useEffect') && !line.includes('// eslint-disable')) {
      const nextLines = lines.slice(index, index + 10).join('\n');
      if (nextLines.includes('useEffect') && !nextLines.includes('[]') && !nextLines.includes('[deps]')) {
        errors.push({
          line: lineNum,
          column: 0,
          message: 'React Hook useEffect has missing dependencies',
          ruleId: 'react-hooks/exhaustive-deps',
          severity: 'warning',
          fixable: false,
        });
      }
    }

    // Rule: Inline styles (prefer className)
    if (line.includes('style={{') && !line.includes('// eslint-disable')) {
      errors.push({
        line: lineNum,
        column: line.indexOf('style') || 0,
        message: 'Inline styles are not allowed. Use className instead.',
        ruleId: 'react/no-inline-styles',
        severity: 'warning',
        fixable: false,
      });
    }
  });

  return errors;
}

/**
 * Auto-fix common linting issues
 */
export function autoFix(code: string, errors: LintError[]): string {
  let fixed = code;
  const lines = fixed.split('\n');

  errors.forEach(error => {
    if (!error.fixable) return;

    const lineIndex = error.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    let line = lines[lineIndex];

    switch (error.ruleId) {
      case 'no-console':
        // Comment out console.log
        line = line.replace(/console\.log/g, '// console.log');
        lines[lineIndex] = line;
        break;

      case 'prefer-const':
        // Change let to const
        line = line.replace(/^(\s*)let\s+/, '$1const ');
        lines[lineIndex] = line;
        break;

      case 'no-unused-vars':
        // Remove unused variable (if it's a simple declaration)
        if (/^(const|let|var)\s+\w+\s*=/.test(line.trim())) {
          lines[lineIndex] = `// ${line} // Removed: unused variable`;
        }
        break;
    }
  });

  return lines.join('\n');
}

/**
 * Get linting summary
 */
export function getLintSummary(errors: LintError[]): {
  total: number;
  errors: number;
  warnings: number;
  fixable: number;
} {
  return {
    total: errors.length,
    errors: errors.filter(e => e.severity === 'error').length,
    warnings: errors.filter(e => e.severity === 'warning').length,
    fixable: errors.filter(e => e.fixable).length,
  };
}

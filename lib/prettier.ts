/**
 * Prettier formatting utilities
 * Note: Full Prettier requires Prettier library
 * This is a simplified version for basic formatting
 */

/**
 * Basic code formatting
 */
export function formatCode(code: string, language: 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'css' | 'html' = 'typescript'): string {
  let formatted = code;

  // Remove extra blank lines (max 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Fix indentation (basic)
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indentSize = 2;

  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';

    // Decrease indent for closing brackets
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indented = ' '.repeat(indentLevel * indentSize) + trimmed;
    
    // Increase indent for opening brackets
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      indentLevel++;
    }

    return indented;
  });

  formatted = formattedLines.filter(l => l !== '').join('\n');

  // Fix spacing around operators
  formatted = formatted.replace(/\s*=\s*/g, ' = ');
  formatted = formatted.replace(/\s*\+\s*/g, ' + ');
  formatted = formatted.replace(/\s*-\s*/g, ' - ');
  formatted = formatted.replace(/\s*\*\s*/g, ' * ');
  formatted = formatted.replace(/\s*\/\s*/g, ' / ');

  // Fix spacing in JSX
  formatted = formatted.replace(/<\s+/g, '<');
  formatted = formatted.replace(/\s+>/g, '>');
  formatted = formatted.replace(/\s+\/>/g, ' />');

  // Fix semicolons
  formatted = formatted.replace(/;\s*}/g, ';\n}');
  formatted = formatted.replace(/;\s*]/g, ';\n]');

  // Fix function declarations
  formatted = formatted.replace(/function\s+(\w+)\s*\(/g, 'function $1(');
  formatted = formatted.replace(/const\s+(\w+)\s*=\s*\(/g, 'const $1 = (');
  formatted = formatted.replace(/const\s+(\w+)\s*=\s*{/g, 'const $1 = {');

  // Fix object properties
  formatted = formatted.replace(/{\s*(\w+):/g, '{ $1:');
  formatted = formatted.replace(/(\w+):\s*([^,}]+)/g, '$1: $2');

  return formatted;
}

/**
 * Format JSX specifically
 */
export function formatJSX(jsx: string): string {
  let formatted = jsx;

  // Fix JSX attributes spacing
  formatted = formatted.replace(/(\w+)=\{/g, '$1={');
  formatted = formatted.replace(/(\w+)="/g, '$1="');
  formatted = formatted.replace(/="([^"]+)"/g, '="$1"');

  // Fix self-closing tags
  formatted = formatted.replace(/<\s*(\w+)([^>]*)\s*\/\s*>/g, '<$1$2 />');

  // Fix component spacing
  formatted = formatted.replace(/<\s*(\w+)/g, '<$1');
  formatted = formatted.replace(/(\w+)\s*>/g, '$1>');

  return formatCode(formatted, 'jsx');
}

/**
 * Format CSS
 */
export function formatCSS(css: string): string {
  let formatted = css;

  // Fix selector spacing
  formatted = formatted.replace(/([^{])\s*{/g, '$1 {');
  formatted = formatted.replace(/}\s*([^}])/g, '}\n$1');

  // Fix property spacing
  formatted = formatted.replace(/(\w+):\s*([^;]+);/g, '  $1: $2;');

  // Fix closing braces
  formatted = formatted.replace(/}\s*}/g, '}\n}');

  return formatted;
}

/**
 * Check if code needs formatting
 */
export function needsFormatting(code: string, formatted: string): boolean {
  return code.trim() !== formatted.trim();
}

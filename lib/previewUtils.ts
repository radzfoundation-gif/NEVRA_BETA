import * as Babel from '@babel/standalone';

// Helper function to extract readable text from error HTML
export const extractTextFromErrorHtml = (html: string): string => {
    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Try to get text content
        let text = tempDiv.textContent || tempDiv.innerText || '';

        // If we got text, clean it up but preserve structure
        if (text.trim().length > 0) {
            // Preserve line breaks for better readability
            text = text
                .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
                .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
                .trim();

            // If text is meaningful (more than just whitespace), return it
            if (text.length > 20) {
                return text;
            }
        }

        // Enhanced extraction: get all important elements
        const parts: string[] = [];

        // Extract strong/heading elements (error titles)
        const strongMatches = html.match(/<strong[^>]*>([^<]+)<\/strong>/gi);
        if (strongMatches) {
            strongMatches.forEach(m => {
                const content = m.replace(/<[^>]+>/g, '').trim();
                if (content && !parts.includes(content)) {
                    parts.push(content);
                }
            });
        }

        // Extract paragraph elements
        const pMatches = html.match(/<p[^>]*class="[^"]*text-sm[^"]*"[^>]*>([^<]+)<\/p>/gi);
        if (pMatches) {
            pMatches.forEach(m => {
                const content = m.replace(/<[^>]+>/g, '').trim();
                if (content && content.length > 10) {
                    parts.push(content);
                }
            });
        }

        // Extract list items (suggestions)
        const liMatches = html.match(/<li[^>]*>([^<]+)<\/li>/gi);
        if (liMatches) {
            liMatches.forEach(m => {
                const content = m.replace(/<[^>]+>/g, '').trim();
                if (content && content.length > 5) {
                    parts.push(`• ${content}`);
                }
            });
        }

        // Extract span elements (notes)
        const spanMatches = html.match(/<span[^>]*class="[^"]*text-xs[^"]*"[^>]*>([^<]+)<\/span>/gi);
        if (spanMatches) {
            spanMatches.forEach(m => {
                const content = m.replace(/<[^>]+>/g, '').trim();
                if (content && content.length > 10) {
                    parts.push(`Note: ${content}`);
                }
            });
        }

        // If we extracted meaningful parts, join them
        if (parts.length > 0) {
            const result = parts.join('\n\n');
            if (result.trim().length > 20) {
                return result;
            }
        }

        // Last resort: try to extract any text from HTML
        const allText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (allText.length > 20) {
            return allText;
        }

        // Final fallback: return original HTML (will be displayed as-is)
        return html;
    } catch (error) {
        console.error('Error extracting text from HTML:', error);
        // Try simple regex extraction as fallback
        const simpleText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return simpleText.length > 0 ? simpleText : html;
    }
};

export const extractCode = (response: string): { text: string; code: string | null } => {
    if (!response || typeof response !== 'string') {
        return { text: 'No response received.', code: null };
    }

    // Try to match markdown code blocks with various languages or no language
    // Support both ```html and ``` with newline or without
    const codeBlockMatch = response.match(/```(?:html|xml|jsx|tsx|react)?\s*\n?([\s\S]*?)\n?```/);

    if (codeBlockMatch && codeBlockMatch[1]) {
        const code = codeBlockMatch[1].trim();
        // Validate: code should not be empty or only whitespace/newlines
        if (!code || code.length === 0 || /^[\s\n\r\t]+$/.test(code)) {
            // Invalid code, return null
            const text = response.replace(codeBlockMatch[0], '').trim() || response || 'No valid code found.';
            return { text, code: null };
        }

        const text = response.replace(codeBlockMatch[0], '').trim();
        // If code looks like HTML, return it
        if (code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<div') || code.includes('<body')) {
            // CRITICAL: If text is empty after removing code block, use original response
            // This prevents losing content when code block extraction removes everything
            return {
                text: text || response || 'Generated app successfully.',
                code
            };
        }
    }

    // Check for raw HTML structure (with or without DOCTYPE)
    if (response.includes('<!DOCTYPE html>') || response.includes('<html') || response.includes('<body')) {
        // Extract HTML from response (might have text before/after)
        const htmlMatch = response.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i) ||
            response.match(/(<html[\s\S]*?<\/html>)/i) ||
            response.match(/(<body[\s\S]*?<\/body>)/i);

        if (htmlMatch && htmlMatch[1]) {
            const code = htmlMatch[1].trim();
            // Validate: code should not be empty or only whitespace/newlines
            if (!code || code.length === 0 || /^[\s\n\r\t]+$/.test(code)) {
                const text = response.replace(htmlMatch[0], '').trim() || response || 'No valid code found.';
                return { text, code: null };
            }
            const text = response.replace(htmlMatch[0], '').trim();
            return { text: text || 'Generated app successfully.', code };
        }

        // If entire response looks like HTML, use it directly
        if (response.trim().startsWith('<')) {
            const trimmedResponse = response.trim();
            // Validate: response should not be empty or only whitespace/newlines
            if (trimmedResponse.length > 0 && !/^[\s\n\r\t]+$/.test(trimmedResponse)) {
                return { text: 'Generated app successfully.', code: trimmedResponse };
            }
        }
    }

    // Last resort: if response contains HTML tags, try to extract
    if (response.includes('<') && response.includes('>')) {
        // Try to find complete HTML document
        const htmlStart = response.indexOf('<html');
        const htmlEnd = response.lastIndexOf('</html>');
        if (htmlStart !== -1 && htmlEnd !== -1) {
            const code = response.substring(htmlStart, htmlEnd + 7).trim();
            // Validate: code should not be empty or only whitespace/newlines
            if (code && code.length > 0 && !/^[\s\n\r\t]+$/.test(code)) {
                return { text: 'Generated app successfully.', code };
            }
        }

        // Try to find body content
        const bodyStart = response.indexOf('<body');
        const bodyEnd = response.lastIndexOf('</body>');
        if (bodyStart !== -1 && bodyEnd !== -1) {
            const bodyContent = response.substring(bodyStart, bodyEnd + 7);
            // Wrap in minimal HTML structure
            const code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${bodyContent}
</body>
</html>`;
            return { text: 'Generated app successfully.', code };
        }
    }

    return { text: response, code: null };
};

// Helper to create React preview HTML (direct React execution, no conversion)
export const createReactPreviewHTML = (componentCode: string, framework?: string): string => {
    // CRITICAL: Validate that code is not an error HTML message
    const isErrorCode = componentCode.includes('<!-- Error Generating Code -->') ||
        componentCode.includes('text-red-500') ||
        componentCode.includes('bg-red-900') ||
        componentCode.includes('ANTHROPIC Error') ||
        componentCode.includes('OpenRouter API Error') ||
        componentCode.includes('This operation was aborted');

    if (isErrorCode) {
        // Return error HTML instead of trying to compile error message as React
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; background: #050505; color: #fff; }
    .error { background: #7f1d1d; border: 1px solid #ef4444; padding: 16px; border-radius: 8px; }
    h1 { color: #ef4444; margin: 0 0 12px 0; }
    p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="error">
    <h1>Error Rendering Component</h1>
    <p>Code generation failed. Please try again with a different prompt or provider.</p>
  </div>
</body>
</html>`;
    }

    // Extract component name - try multiple patterns
    let componentName = 'App';
    const patterns = [
        /export\s+default\s+function\s+(\w+)/,
        /export\s+default\s+const\s+(\w+)/,
        /export\s+function\s+(\w+)/,
        /export\s+const\s+(\w+)\s*=/,
        /function\s+(\w+)\s*\(/,
        /const\s+(\w+)\s*=\s*(?:\(|function)/,
    ];

    for (const pattern of patterns) {
        const match = componentCode.match(pattern);
        if (match && match[1]) {
            componentName = match[1];
            break;
        }
    }

    // Helper function to strip TypeScript type annotations
    const stripTypeScript = (code: string): string => {
        let stripped = code;

        // Remove generic type parameters from hooks and functions: useState<Type[]>() => useState()
        // Be careful with JSX tags, so we match specific patterns
        stripped = stripped.replace(/(useState|useEffect|useRef|useMemo|useCallback|useReducer|useContext)\s*<[^>]+>/g, '$1');

        // Remove generic type parameters from other function calls: func<Type>() => func()
        // But avoid JSX tags by checking if it's followed by ( or whitespace
        stripped = stripped.replace(/(\w+)\s*<[^>]+>\s*(?=[(\s])/g, '$1 ');

        // Remove type annotations from variable declarations: const x: Type[] = value => const x = value
        stripped = stripped.replace(/(const|let|var)\s+(\w+)\s*:\s*[^=]+=/g, '$1 $2 =');

        // Remove type annotations from destructured assignments: const [x, y]: [Type, Type] = value => const [x, y] = value
        stripped = stripped.replace(/(const|let|var)\s+(\[[^\]]+\])\s*:\s*[^=]+=/g, '$1 $2 =');

        // Remove type annotations from object destructuring: const { x, y }: { x: Type, y: Type } = value => const { x, y } = value
        stripped = stripped.replace(/(const|let|var)\s+(\{[^}]+\})\s*:\s*[^=]+=/g, '$1 $2 =');

        // Remove type annotations from function parameters: (param: Type) => (param)
        // Handle complex cases with nested parentheses
        stripped = stripped.replace(/\(([^)]*)\)/g, (match, params) => {
            if (!params.includes(':')) return match; // No type annotations

            return '(' + params
                .split(',')
                .map((p: string) => {
                    const trimmed = p.trim();
                    if (!trimmed.includes(':')) return trimmed;

                    // Handle default values: param: Type = value => param = value
                    if (trimmed.includes('=')) {
                        const [namePart, ...defaultParts] = trimmed.split('=');
                        const name = namePart.trim().split(':')[0].trim();
                        return `${name} = ${defaultParts.join('=').trim()} `;
                    }

                    // Remove type annotation: param: Type => param
                    return trimmed.split(':')[0].trim();
                })
                .join(', ') + ')';
        });

        // Remove type assertions: value as Type => value
        stripped = stripped.replace(/\s+as\s+[A-Z][a-zA-Z0-9<>[\],\s|&]*/g, '');

        // Remove return type annotations: function name(): Type { => function name() {
        stripped = stripped.replace(/\)\s*:\s*[A-Z][a-zA-Z0-9<>[\],\s|&]*\s*{/g, ') {');
        stripped = stripped.replace(/\)\s*:\s*[A-Z][a-zA-Z0-9<>[\],\s|&]*\s*=>/g, ') =>');

        // Remove interface definitions (multi-line)
        stripped = stripped.replace(/interface\s+\w+\s*[^{]*\{[^}]*\}/gs, '');

        // Remove type aliases
        stripped = stripped.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');

        return stripped;
    };

    // Keep component code as-is, only remove external imports
    let cleanedCode = componentCode
        .replace(/^import\s+.*?from\s+['"](?!react|react-dom)[^'"]*['"];?$/gm, '') // Remove non-react imports
        .replace(/export\s+(default\s+)?/g, '') // Remove export keywords
        .trim();

    // Strip TypeScript type annotations for Babel compatibility
    cleanedCode = stripTypeScript(cleanedCode);

    // Escape code for safe embedding in HTML/JS (escape backticks, ${}, and </script>)
    const escapedCode = cleanedCode
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/`/g, '\\`')    // Escape backticks
        .replace(/\${/g, '\\${') // Escape template literal expressions
        .replace(/<\/script>/gi, '<\\/script>'); // Escape script closing tags

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #050505; color: #fff; font-family: 'Inter', sans-serif; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <script>
    (function() {
      // Get component code directly from template literal (no JSON.parse needed)
      const componentCode = \`${escapedCode}\`;
      const componentName = ${JSON.stringify(componentName)};
      
      // Transform with Babel
      try {
        // Try with TypeScript preset first, fallback to react/env if not available
        let transformed;
        try {
          transformed = Babel.transform(componentCode, {
            presets: ['react', 'typescript', 'env'],
            filename: 'component.tsx'
          }).code;
        } catch (tsError) {
          // If TypeScript preset not available, use react/env (code should already be stripped)
          transformed = Babel.transform(componentCode, {
          presets: ['react', 'env'],
          filename: 'component.tsx'
        }).code;
        }
        
        // Execute transformed code with React hooks available
        const executeCode = new Function(
          'React', 'ReactDOM', 
          'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 
          'forwardRef', 'Fragment', 'createElement',
          transformed + '\\n' +
          'const root = ReactDOM.createRoot(document.getElementById("root"));\\n' +
          'const AppComponent = typeof ' + componentName + ' !== "undefined" ? ' + componentName + ' : ' +
          '(typeof App !== "undefined" ? App : ' +
          '(() => React.createElement("div", {className: "p-8 text-red-400"}, "Component: ' + componentName + ' not found")));\\n' +
          'root.render(React.createElement(AppComponent));'
        );
        
        executeCode(
          React, ReactDOM,
          React.useState, React.useEffect, React.useRef,
          React.useMemo, React.useCallback, React.forwardRef,
          React.Fragment, React.createElement
        );
      } catch (error) {
        console.error('Error:', error);
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement('div', { 
          className: 'p-8 text-red-400'
        }, 
          React.createElement('h1', null, 'Error rendering component'),
          React.createElement('pre', { style: { whiteSpace: 'pre-wrap', fontSize: '12px' } }, error.toString())
        ));
      }
    })();
  </script>
</body>
</html>`;
};

export const getIframeSrc = (code: string, entryPath?: string, framework?: string) => {
    // Clean and validate code
    const cleanedCode = code ? code.trim() : '';

    // Check if code is empty or only contains whitespace/newlines
    if (!cleanedCode || cleanedCode.length === 0 || /^[\s\n\r\t]+$/.test(cleanedCode)) {
        console.warn('⚠️ getIframeSrc called with empty or whitespace-only code');
        return 'data:text/html;charset=utf-8,<!DOCTYPE html><html><body><p>No code to display</p></body></html>';
    }

    try {
        // Check if entry is React/TSX/JSX file or framework project
        const isReactFile = entryPath && /\.(tsx|jsx|ts|js)$/.test(entryPath);
        const isFrameworkProject = framework && framework !== 'html';

        // If already HTML, return as is
        if (cleanedCode.includes('<!DOCTYPE') || cleanedCode.includes('<html')) {
            const encoded = encodeURIComponent(cleanedCode);
            return `data:text/html;charset=utf-8,${encoded}`;
        }

        // For React/Next.js/Vite: Use direct React execution (no HTML conversion)
        let htmlCode = cleanedCode;
        if (isReactFile || isFrameworkProject) {
            htmlCode = createReactPreviewHTML(cleanedCode, framework);
            console.log('⚛️ Using direct React execution for preview');
        } else {
            // Wrap plain content in HTML
            // Ensure code doesn't start/end with only newlines
            const contentCode = cleanedCode.replace(/^\s+|\s+$/g, '');
            htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${contentCode}
</body>
</html>`;
        }

        // Final validation: ensure htmlCode is not empty
        if (!htmlCode || htmlCode.trim().length === 0) {
            console.warn('⚠️ Generated HTML code is empty');
            return 'data:text/html;charset=utf-8,<!DOCTYPE html><html><body><p>No code to display</p></body></html>';
        }

        const encoded = encodeURIComponent(htmlCode);
        const dataUrl = `data:text/html;charset=utf-8,${encoded}`;
        return dataUrl;
    } catch (error) {
        console.error('❌ Error encoding iframe src:', error);
        return 'data:text/html;charset=utf-8,<!DOCTYPE html><html><body><p>Error loading preview</p></body></html>';
    }
};

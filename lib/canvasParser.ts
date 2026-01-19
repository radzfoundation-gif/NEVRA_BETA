/**
 * Canvas Parser - Excalidraw JSON to AI Prompt Converter
 * Extracts text, equations, and diagram relationships from canvas
 */

interface ExcalidrawElement {
    type: string;
    text?: string;
    x: number;
    y: number;
    id: string;
    width?: number;
    height?: number;
    boundElements?: Array<{ id: string; type: string }>;
    startBinding?: { elementId: string; focus: number; gap: number };
    endBinding?: { elementId: string; focus: number; gap: number };
}

export interface CanvasAnalysis {
    textElements: string[];
    equations: string[];
    relationships: Array<{ from: string; to: string; label?: string }>;
    shapes: Array<{ type: string; text?: string }>;
    structure: string;
    isEmpty: boolean;
}

/**
 * Parse Excalidraw canvas JSON and extract meaningful content
 */
export function parseCanvas(canvasJSON: { elements: ExcalidrawElement[] }): CanvasAnalysis {
    const elements = canvasJSON.elements || [];

    const textElements: string[] = [];
    const equations: string[] = [];
    const arrows: ExcalidrawElement[] = [];
    const shapes = new Map<string, ExcalidrawElement>();
    const shapesList: Array<{ type: string; text?: string }> = [];

    // First pass: categorize elements
    elements.forEach((el) => {
        if (el.type === 'text' && el.text) {
            const text = el.text.trim();

            // Detect LaTeX equations (contains math operators or dollar signs)
            if (
                text.includes('$') ||
                /[=+\-*/^√∫∑∏∂∇]/.test(text) ||
                /\\(frac|sqrt|sum|int|lim)/.test(text)
            ) {
                equations.push(text);
            } else {
                textElements.push(text);
            }

            shapes.set(el.id, el);
        } else if (el.type === 'arrow' || el.type === 'line') {
            arrows.push(el);
        } else if (['rectangle', 'ellipse', 'diamond', 'freedraw'].includes(el.type)) {
            shapes.set(el.id, el);
            shapesList.push({ type: el.type, text: el.text });
        }
    });

    // Second pass: extract relationships from arrows
    const relationships: Array<{ from: string; to: string; label?: string }> = [];

    arrows.forEach((arrow) => {
        let fromId: string | undefined;
        let toId: string | undefined;

        // Try different binding formats
        if (arrow.startBinding?.elementId && arrow.endBinding?.elementId) {
            fromId = arrow.startBinding.elementId;
            toId = arrow.endBinding.elementId;
        } else if (arrow.boundElements && arrow.boundElements.length >= 2) {
            fromId = arrow.boundElements[0]?.id;
            toId = arrow.boundElements[1]?.id;
        }

        if (fromId && toId) {
            const fromEl = shapes.get(fromId);
            const toEl = shapes.get(toId);

            if (fromEl || toEl) {
                relationships.push({
                    from: fromEl?.text || `${fromEl?.type || 'Element'} ${fromId.substring(0, 8)}`,
                    to: toEl?.text || `${toEl?.type || 'Element'} ${toId.substring(0, 8)}`,
                    label: arrow.text,
                });
            }
        }
    });

    // Generate structure description
    const structure = generateStructureDescription(textElements, equations, relationships, shapesList);
    const isEmpty = textElements.length === 0 && equations.length === 0 && relationships.length === 0;

    return {
        textElements,
        equations,
        relationships,
        shapes: shapesList,
        structure,
        isEmpty,
    };
}

/**
 * Generate human-readable structure description
 */
function generateStructureDescription(
    texts: string[],
    equations: string[],
    rels: Array<{ from: string; to: string; label?: string }>,
    shapes: Array<{ type: string; text?: string }>
): string {
    const parts: string[] = [];

    if (texts.length > 0) {
        parts.push(`**Text Notes:**`);
        texts.forEach((t, i) => parts.push(`${i + 1}. ${t}`));
        parts.push('');
    }

    if (equations.length > 0) {
        parts.push(`**Mathematical Expressions:**`);
        equations.forEach((eq, i) => parts.push(`${i + 1}. ${eq}`));
        parts.push('');
    }

    if (shapes.length > 0) {
        const shapeCount = shapes.reduce((acc, s) => {
            acc[s.type] = (acc[s.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        parts.push(`**Canvas Elements:**`);
        Object.entries(shapeCount).forEach(([type, count]) => {
            parts.push(`- ${count} ${type}(s)`);
        });
        parts.push('');
    }

    if (rels.length > 0) {
        parts.push(`**Diagram Relationships:**`);
        rels.forEach((rel, i) => {
            const arrow = rel.label ? ` --[${rel.label}]-->` : ' -->';
            parts.push(`${i + 1}. ${rel.from}${arrow} ${rel.to}`);
        });
        parts.push('');
    }

    return parts.length > 0 ? parts.join('\n') : 'Empty canvas - no content to analyze.';
}

/**
 * Build AI prompt from canvas analysis
 */
export function buildAIPrompt(
    analysis: CanvasAnalysis,
    userQuestion?: string
): { system: string; user: string } {
    const systemPrompt = `You are Nevra Tutor AI, an expert educator and problem solver.

Your role is to analyze student whiteboard/canvas input and provide:
1. **Step-by-step solution** - Break down the problem clearly
2. **Mistake detection** - Point out any errors in student work (if any)
3. **Final answer** - Provide the correct answer
4. **Teaching explanation** - Explain concepts to enhance understanding

Current date: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}

Guidelines:
- Use LaTeX notation for mathematical expressions: $x^2 + y^2 = r^2$
- For complex equations, use display mode: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- Be encouraging and patient in explanations
- If the canvas is empty, ask the student to draw or write their question
- If the question is unclear, ask for clarification`;

    let userPrompt = '';

    if (analysis.isEmpty) {
        userPrompt = `The student opened a blank canvas. Please greet them and ask what they would like help with.`;
    } else {
        userPrompt = `**Canvas Content Analysis:**\n\n${analysis.structure}\n`;

        if (userQuestion) {
            userPrompt += `\n**Student Question:**\n${userQuestion}\n\n`;
        }

        userPrompt += `\nPlease analyze this canvas content and provide a detailed educational response with step-by-step guidance.`;
    }

    return {
        system: systemPrompt,
        user: userPrompt,
    };
}

/**
 * Validate canvas JSON structure
 */
export function isValidCanvasJSON(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false;

    const canvas = data as any;

    // Check if it has elements array
    if (!Array.isArray(canvas.elements)) return false;

    // Basic validation of elements
    return canvas.elements.every((el: any) =>
        typeof el === 'object' &&
        el !== null &&
        typeof el.type === 'string' &&
        typeof el.id === 'string'
    );
}

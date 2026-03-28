export interface ClarificationData {
  hasClarification: boolean;
  question?: string;
  options?: string[];
  cleanText: string;
}

/**
 * Parses the AI response to extract the <!--CLARIFY ... --> block.
 * Returns the clarification question, options, and the cleaned text.
 */
export function parseClarificationFromAIResponse(responseText: string): ClarificationData {
  // Regex to match the clarification block
  // Pattern: <!--CLARIFY followed by any whitespace, then JSON, then -->
  // Using [\s\S]*? to match across newlines lazily
  const clarifyRegex = /<!--\s*CLARIFY\s*([\s\S]*?)\s*-->/i;
  const match = responseText.match(clarifyRegex);

  if (!match) {
    return {
      hasClarification: false,
      cleanText: responseText
    };
  }

  const jsonString = match[1].trim();
  const cleanText = responseText.replace(clarifyRegex, '').trim();

  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate the parsed structure
    if (parsed && typeof parsed.question === 'string' && Array.isArray(parsed.options)) {
      return {
        hasClarification: true,
        question: parsed.question,
        options: parsed.options,
        cleanText: cleanText
      };
    }
  } catch (error) {
    console.warn('Failed to parse CLARIFY block JSON:', error);
  }

  // If parsing failed or structure is invalid, return original text unchanged without extracting
  return {
    hasClarification: false,
    cleanText: responseText
  };
}

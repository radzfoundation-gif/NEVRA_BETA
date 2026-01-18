import { generateCode } from '../ai';

export interface PracticeProblem {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  problem: string;
  hints: string[];
  solution: string;
  explanation: string;
  testCases?: TestCase[];
  problemType: 'conceptual' | 'code' | 'calculation' | 'design';
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

/**
 * Generate practice problem from topic using AI
 */
export async function generatePracticeProblem(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  problemType: 'conceptual' | 'code' | 'calculation' | 'design' = 'conceptual',
  provider: string = 'groq'
): Promise<PracticeProblem | null> {
  try {
    const prompt = `Generate a ${difficulty} level ${problemType} practice problem about "${topic}".

REQUIREMENTS:
1. Create a clear, well-defined problem statement
2. Provide 3-5 progressive hints (from subtle to more revealing)
3. Include a complete solution
4. Provide detailed explanation of the solution
5. For code problems: include 2-3 test cases

The problem should:
- Test understanding, not memorization
- Be challenging but solvable for ${difficulty} level
- Build on core concepts
- Have clear success criteria

RETURN FORMAT (JSON):
{
  "problem": "Problem statement here",
  "difficulty": "easy|medium|hard",
  "problemType": "conceptual|code|calculation|design",
  "hints": ["Hint 1", "Hint 2", "Hint 3", ...],
  "solution": "Complete solution",
  "explanation": "Detailed explanation of the solution and approach",
  "testCases": [
    {
      "input": "test input",
      "expectedOutput": "expected output",
      "explanation": "why this test case matters"
    }
  ]
}`;

    const response = await generateCode({
      prompt,
      mode: 'tutor',
      provider: provider as any,
      history: [],
      systemPrompt: `You are an expert problem creator. Generate educational practice problems that test deep understanding and problem-solving skills.`,
    });

    if (!response || typeof response !== 'string') return null;

    // Try to parse JSON from response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) return null;

    const problemData = JSON.parse(jsonMatch[1]);
    return formatPracticeProblem(problemData, topic);
  } catch (error) {
    console.error('Error generating practice problem:', error);
    return null;
  }
}

/**
 * Format AI response into PracticeProblem format
 */
function formatPracticeProblem(data: any, topic: string): PracticeProblem {
  return {
    id: `problem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    topic,
    difficulty: data.difficulty || 'medium',
    problem: data.problem || '',
    hints: data.hints || [],
    solution: data.solution || '',
    explanation: data.explanation || '',
    testCases: data.testCases || [],
    problemType: data.problemType || 'conceptual',
  };
}

/**
 * Check solution for code problems
 */
export function checkSolution(
  problem: PracticeProblem,
  userSolution: string
): { correct: boolean; feedback: string; testResults?: TestResult[] } {
  if (problem.problemType !== 'code') {
    // For non-code problems, compare solutions (fuzzy matching)
    const user = userSolution.toLowerCase().trim();
    const solution = problem.solution.toLowerCase().trim();
    const similar = calculateSimilarity(user, solution);
    
    return {
      correct: similar > 0.8, // 80% similarity threshold
      feedback: similar > 0.8
        ? 'Correct! Your solution is correct.'
        : 'Not quite right. Review the solution and try again.',
    };
  }

  // For code problems, run test cases (simplified - in production, use proper code execution)
  if (!problem.testCases || problem.testCases.length === 0) {
    return {
      correct: false,
      feedback: 'No test cases available for this problem.',
    };
  }

  // In a real implementation, you would execute the code and run test cases
  // For now, return feedback based on structure
  const testResults: TestResult[] = problem.testCases.map((testCase, index) => {
    // This is a placeholder - actual implementation would execute code
    return {
      testCaseIndex: index,
      passed: false, // Would be determined by actual execution
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: null, // Would come from execution
    };
  });

  const allPassed = testResults.every(r => r.passed);

  return {
    correct: allPassed,
    feedback: allPassed
      ? 'Excellent! All test cases passed.'
      : 'Some test cases failed. Review your solution and try again.',
    testResults,
  };
}

interface TestResult {
  testCaseIndex: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
}

/**
 * Calculate string similarity (simple implementation)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Get next hint
 */
export function getNextHint(
  problem: PracticeProblem,
  currentHintIndex: number
): string | null {
  if (currentHintIndex >= problem.hints.length) return null;
  return problem.hints[currentHintIndex];
}

/**
 * Generate multiple practice problems
 */
export async function generatePracticeProblems(
  topic: string,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  provider: string = 'groq'
): Promise<PracticeProblem[]> {
  const problems: PracticeProblem[] = [];
  
  for (let i = 0; i < count; i++) {
    const problem = await generatePracticeProblem(topic, difficulty, 'conceptual', provider);
    if (problem) {
      problems.push(problem);
    }
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return problems;
}


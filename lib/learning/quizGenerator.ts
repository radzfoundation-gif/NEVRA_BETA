import { generateCode } from '../ai';

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'code';
  question: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string | number | boolean;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  hints: string[];
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questions: QuizQuestion[];
  timeLimit?: number; // minutes
  passingScore: number; // 0-100
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

/**
 * Generate quiz from topic using AI
 */
export async function generateQuiz(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  numQuestions: number = 5,
  provider: string = 'groq'
): Promise<Quiz | null> {
  try {
    const prompt = `Generate a ${difficulty} level quiz about "${topic}" with ${numQuestions} questions.

REQUIREMENTS:
1. Mix of question types: multiple-choice (60%), true-false (20%), short-answer (15%), code (5%)
2. Questions should test understanding, not just memorization
3. Each question must have:
   - Clear question text
   - Correct answer
   - Detailed explanation
   - 2-3 progressive hints
   - Difficulty level (easy/medium/hard)

4. For multiple-choice: 4 options, only one correct
5. For code questions: provide code snippet and ask what it does or to fix/complete it
6. Questions should progress from basic to advanced

RETURN FORMAT (JSON):
{
  "title": "Quiz Title",
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation",
      "hints": ["Hint 1", "Hint 2", "Hint 3"],
      "difficulty": "easy"
    }
  ]
}`;

    const response = await generateCode({
      prompt,
      mode: 'tutor',
      provider: provider as any,
      history: [],
      systemPrompt: `You are an expert quiz generator. Generate educational quizzes that test understanding, not memorization.`,
    });

    if (!response || typeof response === 'string') {
      // Try to parse JSON from response
      const jsonMatch = response?.match(/```json\s*([\s\S]*?)\s*```/) || response?.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const quizData = JSON.parse(jsonMatch[1]);
        return formatQuiz(quizData, topic, difficulty);
      }
      return null;
    }

    return null;
  } catch (error) {
    console.error('Error generating quiz:', error);
    return null;
  }
}

/**
 * Format AI response into Quiz format
 */
function formatQuiz(data: any, topic: string, difficulty: 'easy' | 'medium' | 'hard'): Quiz {
  const questions: QuizQuestion[] = (data.questions || []).map((q: any, index: number) => ({
    id: `q${index + 1}`,
    type: q.type || 'multiple-choice',
    question: q.question || '',
    options: q.options || [],
    correctAnswer: q.correctAnswer ?? 0,
    explanation: q.explanation || '',
    difficulty: q.difficulty || difficulty,
    topic,
    hints: q.hints || [],
  }));

  return {
    id: `quiz_${Date.now()}`,
    title: data.title || `Quiz: ${topic}`,
    topic,
    questions,
    passingScore: 70,
    estimatedTime: Math.ceil(questions.length * 2), // 2 minutes per question
    difficulty,
    createdAt: new Date(),
  };
}

/**
 * Generate quiz from conversation history
 */
export async function generateQuizFromConversation(
  topic: string,
  conversationHistory: Array<{ role: string; content: string }>,
  provider: string = 'groq'
): Promise<Quiz | null> {
  try {
    const summaryPrompt = `Based on the following conversation about "${topic}", generate a quiz that tests understanding of the concepts discussed.

Conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Generate 5-8 questions that test the key concepts from this conversation.`;

    return generateQuiz(topic, 'medium', 5, provider);
  } catch (error) {
    console.error('Error generating quiz from conversation:', error);
    return null;
  }
}

/**
 * Create simple quiz from questions array
 */
export function createQuiz(
  title: string,
  topic: string,
  questions: Omit<QuizQuestion, 'id' | 'topic'>[],
  options?: Partial<Quiz>
): Quiz {
  const quizQuestions: QuizQuestion[] = questions.map((q, index) => ({
    ...q,
    id: `q${index + 1}`,
    topic,
  }));

  return {
    id: `quiz_${Date.now()}`,
    title,
    topic,
    questions: quizQuestions,
    passingScore: options?.passingScore ?? 70,
    estimatedTime: options?.estimatedTime ?? Math.ceil(quizQuestions.length * 2),
    difficulty: options?.difficulty ?? 'medium',
    timeLimit: options?.timeLimit,
    createdAt: new Date(),
  };
}

/**
 * Calculate quiz score
 */
export function calculateQuizScore(
  quiz: Quiz,
  answers: Record<string, string | number | boolean>
): { score: number; correct: number; total: number; percentage: number } {
  let correct = 0;
  const total = quiz.questions.length;

  quiz.questions.forEach(q => {
    const userAnswer = answers[q.id];
    const correctAnswer = q.correctAnswer;

    let isCorrect = false;
    if (q.type === 'multiple-choice') {
      isCorrect = userAnswer === correctAnswer;
    } else if (q.type === 'true-false') {
      isCorrect = userAnswer === correctAnswer;
    } else if (q.type === 'short-answer') {
      // Fuzzy matching for short answers
      const user = String(userAnswer || '').toLowerCase().trim();
      const correct = String(correctAnswer || '').toLowerCase().trim();
      isCorrect = user === correct || correct.includes(user) || user.includes(correct);
    } else if (q.type === 'code') {
      // For code questions, require exact match or manual review
      isCorrect = String(userAnswer || '').trim() === String(correctAnswer || '').trim();
    }

    if (isCorrect) correct++;
  });

  const percentage = Math.round((correct / total) * 100);
  const score = percentage >= quiz.passingScore ? 1 : 0; // Pass/fail

  return { score, correct, total, percentage };
}

/**
 * Get next hint for question
 */
export function getNextHint(question: QuizQuestion, currentHintIndex: number): string | null {
  if (!question.hints || question.hints.length === 0) return null;
  if (currentHintIndex >= question.hints.length) return null;
  return question.hints[currentHintIndex];
}


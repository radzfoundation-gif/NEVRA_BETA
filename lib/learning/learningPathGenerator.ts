import { generateCode } from '../ai';

export interface LearningMilestone {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedHours: number;
  topics: string[];
  prerequisites?: string[];
  completed: boolean;
  completedAt?: Date;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  topics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  milestones: LearningMilestone[];
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Generate learning path from topic using AI
 */
export async function generateLearningPath(
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  provider: string = 'groq'
): Promise<LearningPath | null> {
  try {
    const prompt = `Create a comprehensive ${difficulty} level learning path for "${topic}".

REQUIREMENTS:
1. Break down the topic into logical milestones (5-8 milestones)
2. Each milestone should:
   - Have a clear title and description
   - Include specific topics to cover
   - Have estimated hours (1-5 hours per milestone)
   - List prerequisites (if any)
   - Be in a logical learning order

3. The learning path should:
   - Start with fundamentals
   - Progress from basic to advanced
   - Build upon previous milestones
   - Include practical applications
   - End with mastery-level content

RETURN FORMAT (JSON):
{
  "title": "Learning Path Title",
  "description": "Brief description of the learning path",
  "topics": ["topic1", "topic2", ...],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedHours": 20,
  "prerequisites": ["prerequisite1", ...],
  "milestones": [
    {
      "title": "Milestone Title",
      "description": "What you'll learn",
      "order": 1,
      "estimatedHours": 3,
      "topics": ["topic1", "topic2"],
      "prerequisites": []
    }
  ]
}`;

    const response = await generateCode({
      prompt,
      mode: 'tutor',
      provider: provider as any,
      history: [],
      systemPrompt: `You are an expert educational curriculum designer. Create structured, progressive learning paths that guide learners from beginner to advanced levels.`,
    });

    if (!response || typeof response !== 'string') return null;

    // Try to parse JSON from response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) return null;

    const pathData = JSON.parse(jsonMatch[1]);
    return formatLearningPath(pathData);
  } catch (error) {
    console.error('Error generating learning path:', error);
    return null;
  }
}

/**
 * Format AI response into LearningPath format
 */
function formatLearningPath(data: any): LearningPath {
  const milestones: LearningMilestone[] = (data.milestones || []).map((m: any, index: number) => ({
    id: `milestone_${index + 1}`,
    title: m.title || `Milestone ${index + 1}`,
    description: m.description || '',
    order: m.order ?? index + 1,
    estimatedHours: m.estimatedHours || 2,
    topics: m.topics || [],
    prerequisites: m.prerequisites || [],
    completed: false,
  }));

  const totalHours = milestones.reduce((sum, m) => sum + m.estimatedHours, 0);

  return {
    id: `path_${Date.now()}`,
    title: data.title || 'Learning Path',
    description: data.description || '',
    topics: data.topics || [],
    difficulty: data.difficulty || 'beginner',
    estimatedHours: data.estimatedHours || totalHours,
    prerequisites: data.prerequisites || [],
    milestones,
    progress: 0,
    createdAt: new Date(),
  };
}

/**
 * Create custom learning path
 */
export function createLearningPath(
  title: string,
  description: string,
  milestones: Omit<LearningMilestone, 'id' | 'completed'>[],
  options?: Partial<LearningPath>
): LearningPath {
  const formattedMilestones: LearningMilestone[] = milestones.map((m, index) => ({
    ...m,
    id: `milestone_${index + 1}`,
    completed: false,
  }));

  const totalHours = formattedMilestones.reduce((sum, m) => sum + m.estimatedHours, 0);

  return {
    id: `path_${Date.now()}`,
    title,
    description,
    topics: formattedMilestones.flatMap(m => m.topics),
    difficulty: options?.difficulty || 'beginner',
    estimatedHours: options?.estimatedHours || totalHours,
    prerequisites: options?.prerequisites || [],
    milestones: formattedMilestones,
    progress: 0,
    createdAt: new Date(),
  };
}

/**
 * Calculate learning path progress
 */
export function calculatePathProgress(path: LearningPath): number {
  if (path.milestones.length === 0) return 0;
  
  const completed = path.milestones.filter(m => m.completed).length;
  return Math.round((completed / path.milestones.length) * 100);
}

/**
 * Get next milestone
 */
export function getNextMilestone(path: LearningPath): LearningMilestone | null {
  return path.milestones.find(m => !m.completed) || null;
}

/**
 * Check if prerequisites are met
 */
export function checkPrerequisites(
  milestone: LearningMilestone,
  completedMilestones: string[]
): boolean {
  if (!milestone.prerequisites || milestone.prerequisites.length === 0) return true;
  return milestone.prerequisites.every(prereq => completedMilestones.includes(prereq));
}

/**
 * Get recommended learning paths based on user progress
 */
export async function getRecommendedPaths(
  userTopics: string[],
  userDifficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<LearningPath[]> {
  // For now, return empty array
  // In production, use AI to generate recommendations based on user's learning history
  return [];
}


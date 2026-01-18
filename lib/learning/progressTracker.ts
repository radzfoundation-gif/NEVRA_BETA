import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { firebaseMock } from '../firebaseFake';

// Types
export interface LearningProgress {
  id: string;
  userId: string;
  topics: TopicProgress[];
  totalStudyTime: number; // minutes
  totalQuestions: number;
  totalTopics: number;
  streak: number; // days
  currentStreakStart?: Date;
  lastStudied?: Date;
  achievements: Achievement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicProgress {
  topic: string;
  proficiency: number; // 0-100
  lastStudied: Date;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number; // 0-100
  studyTime: number; // minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'streak' | 'topics' | 'questions' | 'time' | 'special';
}

export interface StudySession {
  id: string;
  userId: string;
  topic?: string;
  duration: number; // minutes
  questionsAnswered: number;
  correctAnswers: number;
  sessionType: 'qna' | 'quiz' | 'practice' | 'review';
  startedAt: Date;
  endedAt?: Date;
}

// Check if using mock
let useFirebaseMock = false;
try {
  if (!db) useFirebaseMock = true;
} catch {
  useFirebaseMock = true;
}

/**
 * Get or create learning progress for user
 */
export async function getLearningProgress(userId: string): Promise<LearningProgress | null> {
  try {
    if (useFirebaseMock) {
      const progress = await firebaseMock.getDoc('learning_progress', userId);
      if (progress) {
        return progress as LearningProgress;
      }
      // Create default progress
      const defaultProgress: LearningProgress = {
        id: userId,
        userId,
        topics: [],
        totalStudyTime: 0,
        totalQuestions: 0,
        totalTopics: 0,
        streak: 0,
        achievements: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await firebaseMock.setDoc('learning_progress', userId, defaultProgress);
      return defaultProgress;
    }

    const progressRef = doc(db, 'learning_progress', userId);
    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) {
      // Create default progress
      const defaultProgress: LearningProgress = {
        id: userId,
        userId,
        topics: [],
        totalStudyTime: 0,
        totalQuestions: 0,
        totalTopics: 0,
        streak: 0,
        achievements: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(progressRef, {
        ...defaultProgress,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return defaultProgress;
    }

    const data = progressSnap.data();
    return {
      id: progressSnap.id,
      userId: data.userId,
      topics: (data.topics || []).map((t: any) => ({
        ...t,
        lastStudied: t.lastStudied?.toDate() || new Date(),
      })),
      totalStudyTime: data.totalStudyTime || 0,
      totalQuestions: data.totalQuestions || 0,
      totalTopics: data.totalTopics || 0,
      streak: data.streak || 0,
      currentStreakStart: data.currentStreakStart?.toDate(),
      lastStudied: data.lastStudied?.toDate(),
      achievements: (data.achievements || []).map((a: any) => ({
        ...a,
        unlockedAt: a.unlockedAt?.toDate() || new Date(),
      })),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting learning progress:', error);
    return null;
  }
}

/**
 * Update topic progress
 */
export async function updateTopicProgress(
  userId: string,
  topic: string,
  updates: Partial<TopicProgress>
): Promise<boolean> {
  try {
    const progress = await getLearningProgress(userId);
    if (!progress) return false;

    const existingTopicIndex = progress.topics.findIndex(t => t.topic === topic);
    const now = new Date();

    let topicProgress: TopicProgress;
    if (existingTopicIndex >= 0) {
      // Update existing topic
      const existing = progress.topics[existingTopicIndex];
      topicProgress = {
        ...existing,
        ...updates,
        lastStudied: now,
        proficiency: Math.min(100, Math.max(0, updates.proficiency ?? existing.proficiency)),
      };
      progress.topics[existingTopicIndex] = topicProgress;
    } else {
      // Create new topic
      topicProgress = {
        topic,
        proficiency: updates.proficiency ?? 0,
        lastStudied: now,
        questionsAnswered: updates.questionsAnswered ?? 0,
        correctAnswers: updates.correctAnswers ?? 0,
        accuracy: updates.accuracy ?? 0,
        studyTime: updates.studyTime ?? 0,
        difficultyLevel: updates.difficultyLevel ?? 'beginner',
      };
      progress.topics.push(topicProgress);
      progress.totalTopics = progress.topics.length;
    }

    // Recalculate accuracy if answers provided
    if (updates.questionsAnswered !== undefined || updates.correctAnswers !== undefined) {
      topicProgress.accuracy =
        topicProgress.questionsAnswered > 0
          ? Math.round((topicProgress.correctAnswers / topicProgress.questionsAnswered) * 100)
          : 0;
    }

    // Update total questions
    if (updates.questionsAnswered !== undefined) {
      const diff = existingTopicIndex >= 0
        ? updates.questionsAnswered - progress.topics[existingTopicIndex].questionsAnswered
        : updates.questionsAnswered;
      progress.totalQuestions = Math.max(0, progress.totalQuestions + diff);
    }

    // Update study time
    if (updates.studyTime !== undefined) {
      const diff = existingTopicIndex >= 0
        ? updates.studyTime - progress.topics[existingTopicIndex].studyTime
        : updates.studyTime;
      progress.totalStudyTime = Math.max(0, progress.totalStudyTime + diff);
    }

    progress.updatedAt = now;
    progress.lastStudied = now;

    // Update streak
    await updateStreak(progress, now);

    // Save to Firebase
    if (useFirebaseMock) {
      await firebaseMock.setDoc('learning_progress', userId, progress);
    } else {
      const progressRef = doc(db, 'learning_progress', userId);
      await updateDoc(progressRef, {
        topics: progress.topics.map(t => ({
          ...t,
          lastStudied: Timestamp.fromDate(t.lastStudied),
        })),
        totalStudyTime: progress.totalStudyTime,
        totalQuestions: progress.totalQuestions,
        totalTopics: progress.totalTopics,
        streak: progress.streak,
        currentStreakStart: progress.currentStreakStart
          ? Timestamp.fromDate(progress.currentStreakStart)
          : null,
        lastStudied: Timestamp.fromDate(progress.lastStudied),
        updatedAt: Timestamp.now(),
      });
    }

    // Check for achievements
    await checkAchievements(userId, progress);

    return true;
  } catch (error) {
    console.error('Error updating topic progress:', error);
    return false;
  }
}

/**
 * Update learning streak
 */
async function updateStreak(progress: LearningProgress, now: Date): Promise<void> {
  const lastStudied = progress.lastStudied;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!lastStudied) {
    // First study session
    progress.streak = 1;
    progress.currentStreakStart = today;
  } else {
    const lastStudiedDate = new Date(lastStudied);
    lastStudiedDate.setHours(0, 0, 0, 0);

    if (lastStudiedDate.getTime() === today.getTime()) {
      // Same day, no change
      return;
    } else if (lastStudiedDate.getTime() === yesterday.getTime()) {
      // Studied yesterday, continue streak
      progress.streak += 1;
    } else {
      // Gap in streak, reset
      progress.streak = 1;
      progress.currentStreakStart = today;
    }
  }
}

/**
 * Record study session
 */
export async function recordStudySession(session: Omit<StudySession, 'id'>): Promise<string | null> {
  try {
    const sessionData = {
      ...session,
      startedAt: Timestamp.fromDate(session.startedAt),
      endedAt: session.endedAt ? Timestamp.fromDate(session.endedAt) : null,
    };

    let sessionId: string;
    if (useFirebaseMock) {
      sessionId = await firebaseMock.addDoc('study_sessions', sessionData);
    } else {
      const sessionsRef = collection(db, 'study_sessions');
      const docRef = await addDoc(sessionsRef, sessionData);
      sessionId = docRef.id;
    }

    // Update progress
    if (session.topic) {
      await updateTopicProgress(session.userId, session.topic, {
        questionsAnswered: session.questionsAnswered,
        correctAnswers: session.correctAnswers,
        studyTime: session.duration,
      });
    }

    return sessionId;
  } catch (error) {
    console.error('Error recording study session:', error);
    return null;
  }
}

/**
 * Check and unlock achievements
 */
async function checkAchievements(userId: string, progress: LearningProgress): Promise<void> {
  const achievements: Achievement[] = [];
  const now = new Date();

  // Streak achievements
  if (progress.streak >= 7 && !progress.achievements.find(a => a.id === 'streak_7')) {
    achievements.push({
      id: 'streak_7',
      title: 'Week Warrior',
      description: '7 day streak!',
      icon: '🔥',
      unlockedAt: now,
      category: 'streak',
    });
  }
  if (progress.streak >= 30 && !progress.achievements.find(a => a.id === 'streak_30')) {
    achievements.push({
      id: 'streak_30',
      title: 'Monthly Master',
      description: '30 day streak!',
      icon: '⭐',
      unlockedAt: now,
      category: 'streak',
    });
  }

  // Topic achievements
  if (progress.totalTopics >= 10 && !progress.achievements.find(a => a.id === 'topics_10')) {
    achievements.push({
      id: 'topics_10',
      title: 'Jack of All Trades',
      description: 'Studied 10 topics',
      icon: '📚',
      unlockedAt: now,
      category: 'topics',
    });
  }

  // Question achievements
  if (progress.totalQuestions >= 100 && !progress.achievements.find(a => a.id === 'questions_100')) {
    achievements.push({
      id: 'questions_100',
      title: 'Centurion',
      description: 'Answered 100 questions',
      icon: '💯',
      unlockedAt: now,
      category: 'questions',
    });
  }

  // Time achievements
  if (progress.totalStudyTime >= 60 && !progress.achievements.find(a => a.id === 'time_60')) {
    achievements.push({
      id: 'time_60',
      title: 'Hour Hero',
      description: '1 hour of study time',
      icon: '⏰',
      unlockedAt: now,
      category: 'time',
    });
  }

  // Add new achievements
  if (achievements.length > 0) {
    progress.achievements.push(...achievements);

    if (useFirebaseMock) {
      await firebaseMock.setDoc('learning_progress', userId, progress);
    } else {
      const progressRef = doc(db, 'learning_progress', userId);
      await updateDoc(progressRef, {
        achievements: progress.achievements.map(a => ({
          ...a,
          unlockedAt: Timestamp.fromDate(a.unlockedAt),
        })),
      });
    }
  }
}

/**
 * Get weekly progress
 */
export async function getWeeklyProgress(userId: string): Promise<{ date: string; studyTime: number; questions: number }[]> {
  try {
    // For now, return mock data structure
    // In production, query study_sessions collection grouped by date
    const week: { date: string; studyTime: number; questions: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      week.push({
        date: date.toISOString().split('T')[0],
        studyTime: 0,
        questions: 0,
      });
    }

    return week;
  } catch (error) {
    console.error('Error getting weekly progress:', error);
    return [];
  }
}


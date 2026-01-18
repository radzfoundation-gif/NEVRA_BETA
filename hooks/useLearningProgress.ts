import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/authContext';
import {
  getLearningProgress,
  updateTopicProgress,
  recordStudySession,
  getWeeklyProgress,
  type LearningProgress,
  type TopicProgress,
  type StudySession,
  type Achievement,
} from '@/lib/learning/progressTracker';

/**
 * Hook for learning progress tracking
 */
export function useLearningProgress() {
  const { user } = useUser();
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load progress
  useEffect(() => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getLearningProgress(user.id)
      .then(data => {
        setProgress(data);
        setError(null);
      })
      .catch(err => {
        console.error('Error loading progress:', err);
        setError(err instanceof Error ? err.message : 'Failed to load progress');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  // Update topic progress
  const updateProgress = useCallback(
    async (topic: string, updates: Partial<TopicProgress>) => {
      if (!user || !progress) return false;

      const success = await updateTopicProgress(user.id, topic, updates);
      if (success) {
        // Reload progress
        const updated = await getLearningProgress(user.id);
        if (updated) setProgress(updated);
      }
      return success;
    },
    [user, progress]
  );

  // Record study session
  const recordSession = useCallback(
    async (session: Omit<StudySession, 'id' | 'userId'>) => {
      if (!user) return null;

      const sessionId = await recordStudySession({
        ...session,
        userId: user.id,
      });

      // Reload progress after session
      if (sessionId) {
        const updated = await getLearningProgress(user.id);
        if (updated) setProgress(updated);
      }

      return sessionId;
    },
    [user]
  );

  // Get weekly progress
  const [weeklyProgress, setWeeklyProgress] = useState<
    { date: string; studyTime: number; questions: number }[]
  >([]);

  useEffect(() => {
    if (!user) return;

    getWeeklyProgress(user.id).then(setWeeklyProgress);
  }, [user, progress]);

  return {
    progress,
    weeklyProgress,
    loading,
    error,
    updateProgress,
    recordSession,
    refresh: async () => {
      if (!user) return;
      const updated = await getLearningProgress(user.id);
      if (updated) setProgress(updated);
    },
  };
}

/**
 * Hook for topic-specific progress
 */
export function useTopicProgress(topic: string) {
  const { progress, updateProgress } = useLearningProgress();
  const topicProgress = progress?.topics.find(t => t.topic === topic);

  const update = useCallback(
    async (updates: Partial<TopicProgress>) => {
      return updateProgress(topic, updates);
    },
    [topic, updateProgress]
  );

  return {
    progress: topicProgress,
    update,
  };
}

/**
 * Hook for achievements
 */
export function useAchievements() {
  const { progress } = useLearningProgress();
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!progress) return;

    // Get achievements from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recent = progress.achievements.filter(
      a => a.unlockedAt >= weekAgo
    );
    setRecentAchievements(recent);
  }, [progress]);

  return {
    achievements: progress?.achievements || [],
    recentAchievements,
    totalAchievements: progress?.achievements.length || 0,
  };
}


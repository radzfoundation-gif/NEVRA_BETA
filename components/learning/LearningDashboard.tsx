import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  BookOpen,
  Clock,
  Target,
  Award,
  Calendar,
  BarChart3,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useLearningProgress, useAchievements } from '@/hooks/useLearningProgress';
import { getUserNotes } from '@/lib/learning/notesManager';
import { getDueFlashcards } from '@/lib/learning/flashcardManager';
import { useUser } from '@/lib/authContext';
import { Note } from '@/lib/learning/notesManager';

export default function LearningDashboard() {
  const { user } = useUser();
  const { progress, weeklyProgress, loading } = useLearningProgress();
  const { achievements, recentAchievements, totalAchievements } = useAchievements();
  const [notes, setNotes] = useState<Note[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'achievements'>('overview');

  useEffect(() => {
    if (!user) return;

    // Load notes count
    getUserNotes(user.id, { limit: 10 }).then(setNotes);

    // Load due flashcards count
    getDueFlashcards(user.id).then(flashcards => setDueFlashcards(flashcards.length));
  }, [user]);

  if (loading || !progress) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Study Time',
      value: `${Math.round(progress.totalStudyTime)} min`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Questions Answered',
      value: progress.totalQuestions.toString(),
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Topics Covered',
      value: progress.totalTopics.toString(),
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Day Streak',
      value: progress.streak.toString(),
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const topTopics = progress.topics
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Learning Dashboard</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        {(['overview', 'progress', 'achievements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${stat.bgColor} rounded-lg p-4 space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen size={20} />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded hover:bg-blue-100 cursor-pointer">
                  <span className="text-sm">Review Flashcards</span>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    {dueFlashcards} due
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded hover:bg-green-100 cursor-pointer">
                  <span className="text-sm">My Notes</span>
                  <span className="text-xs text-gray-600">{notes.length} notes</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded hover:bg-purple-100 cursor-pointer">
                  <span className="text-sm">Recent Achievements</span>
                  <span className="text-xs text-gray-600">{recentAchievements.length} new</span>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Award size={20} />
                Recent Achievements
              </h3>
              {recentAchievements.length > 0 ? (
                <div className="space-y-2">
                  {recentAchievements.slice(0, 3).map(achievement => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-2 bg-yellow-50 rounded"
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{achievement.title}</p>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent achievements</p>
              )}
            </div>
          </div>

          {/* Top Topics */}
          {topTopics.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp size={20} />
                Top Topics
              </h3>
              <div className="space-y-2">
                {topTopics.map((topic, index) => (
                  <div key={topic.topic} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{topic.topic}</span>
                      <span className="text-gray-600">{topic.proficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.proficiency}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Weekly Progress Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 size={20} />
              Weekly Progress
            </h3>
            <div className="space-y-4">
              {weeklyProgress.map((day, index) => (
                <div key={day.date} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">{day.studyTime} min</span>
                      <span className="text-xs text-gray-500">{day.questions} questions</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className="bg-blue-600 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (day.studyTime / 60) * 100)}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Details */}
          {progress.topics.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">All Topics</h3>
              <div className="space-y-3">
                {progress.topics.map(topic => (
                  <div key={topic.topic} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{topic.topic}</span>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{topic.questionsAnswered} questions</span>
                        <span>{topic.accuracy}% accuracy</span>
                        <span className="font-semibold">{topic.proficiency}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${topic.proficiency}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">All Achievements</h3>
              <span className="text-sm text-gray-600">
                {progress.achievements.length} / {totalAchievements} unlocked
              </span>
            </div>
            {progress.achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {progress.achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  >
                    <span className="text-3xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{achievement.title}</p>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Unlocked: {achievement.unlockedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No achievements yet. Keep learning!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


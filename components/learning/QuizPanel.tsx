import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Clock,
  Trophy,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { generateQuiz, calculateQuizScore, getNextHint, type Quiz, type QuizQuestion } from '@/lib/learning/quizGenerator';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import AILoading from '../ui/AILoading';

interface QuizPanelProps {
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  onClose?: () => void;
  provider?: string;
}

export default function QuizPanel({
  topic,
  difficulty = 'medium',
  onClose,
  provider = 'groq',
}: QuizPanelProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<{ score: number; correct: number; total: number; percentage: number } | null>(null);
  const { updateProgress, recordSession } = useLearningProgress();

  // Generate quiz on mount
  useEffect(() => {
    loadQuiz();
  }, [topic, difficulty]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const generatedQuiz = await generateQuiz(topic, difficulty, 5, provider);
      if (generatedQuiz) {
        setQuiz(generatedQuiz);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setShowExplanation(false);
        setCompleted(false);
        setScore(null);
        setCurrentHintIndex({});
      } else {
        setError('Failed to generate quiz. Please try again.');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  const handleAnswer = (answer: string | number | boolean) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
      setCurrentHintIndex(prev => ({
        ...prev,
        [currentQuestion.id]: 0,
      }));
    } else {
      // Quiz completed
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const handleComplete = () => {
    if (!quiz) return;
    const result = calculateQuizScore(quiz, answers);
    setScore(result);
    setCompleted(true);

    // Update progress
    updateProgress(topic, {
      questionsAnswered: quiz.questions.length,
      correctAnswers: result.correct,
      proficiency: Math.min(100, result.percentage),
    });

    // Record session
    recordSession({
      topic,
      duration: 10, // Estimate
      questionsAnswered: quiz.questions.length,
      correctAnswers: result.correct,
      sessionType: 'quiz',
      startedAt: new Date(),
      endedAt: new Date(),
    });
  };

  const handleShowHint = () => {
    if (!currentQuestion) return;
    const currentHint = currentHintIndex[currentQuestion.id] || 0;
    const hint = getNextHint(currentQuestion, currentHint);
    if (hint) {
      setCurrentHintIndex(prev => ({
        ...prev,
        [currentQuestion.id]: currentHint + 1,
      }));
    }
  };

  const getCurrentHint = () => {
    if (!currentQuestion) return null;
    const index = currentHintIndex[currentQuestion.id] || 0;
    return getNextHint(currentQuestion, index - 1);
  };

  const isCorrect = currentQuestion
    ? answers[currentQuestion.id] === currentQuestion.correctAnswer
    : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <AILoading message="Generating quiz..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadQuiz}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  if (completed && score) {
    const passed = score.percentage >= quiz.passingScore;
    return (
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className={`text-6xl ${passed ? 'text-green-500' : 'text-orange-500'}`}>
            {passed ? '🎉' : '📚'}
          </div>
          <h3 className="text-2xl font-bold">Quiz Completed!</h3>
          <div className="flex items-center justify-center gap-4">
            <Trophy className={`w-8 h-8 ${passed ? 'text-yellow-500' : 'text-gray-400'}`} />
            <span className="text-3xl font-bold">{score.percentage}%</span>
          </div>
          <p className="text-gray-600">
            You got {score.correct} out of {score.total} questions correct
          </p>
          {passed ? (
            <p className="text-green-600 font-semibold">Great job! You passed! 🎊</p>
          ) : (
            <p className="text-orange-600 font-semibold">
              Keep studying! You need {quiz.passingScore}% to pass.
            </p>
          )}
        </motion.div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={loadQuiz}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RotateCcw size={20} />
            Retake Quiz
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {quiz.estimatedTime} min
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-semibold flex-1">{currentQuestion.question}</h3>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                currentQuestion.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : currentQuestion.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {currentQuestion.difficulty}
            </span>
          </div>

          {/* Multiple Choice Options */}
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;
                const showCorrect = showExplanation && index === currentQuestion.correctAnswer;
                const showIncorrect = showExplanation && isSelected && index !== currentQuestion.correctAnswer;

                return (
                  <button
                    key={index}
                    onClick={() => !showExplanation && handleAnswer(index)}
                    disabled={showExplanation}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      showCorrect
                        ? 'border-green-500 bg-green-50'
                        : showIncorrect
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:cursor-default`}
                  >
                    <div className="flex items-center gap-3">
                      {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                      <span>{String.fromCharCode(65 + index)}. {option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.type === 'true-false' && (
            <div className="grid grid-cols-2 gap-3">
              {[true, false].map((value, index) => {
                const isSelected = answers[currentQuestion.id] === value;
                const showCorrect = showExplanation && value === currentQuestion.correctAnswer;
                const showIncorrect = showExplanation && isSelected && value !== currentQuestion.correctAnswer;

                return (
                  <button
                    key={index}
                    onClick={() => !showExplanation && handleAnswer(value)}
                    disabled={showExplanation}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      showCorrect
                        ? 'border-green-500 bg-green-50'
                        : showIncorrect
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:cursor-default font-semibold`}
                  >
                    {value ? 'True' : 'False'}
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer */}
          {currentQuestion.type === 'short-answer' && (
            <div className="space-y-3">
              <textarea
                value={String(answers[currentQuestion.id] || '')}
                onChange={e => !showExplanation && setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                disabled={showExplanation}
                placeholder="Type your answer..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                rows={3}
              />
              {!showExplanation && (
                <button
                  onClick={() => setShowExplanation(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}

          {/* Hints */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div className="space-y-2">
              {getCurrentHint() && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">{getCurrentHint()}</p>
                  </div>
                </div>
              )}
              {(!getCurrentHint() || (currentHintIndex[currentQuestion.id] || 0) < currentQuestion.hints.length) && (
                <button
                  onClick={handleShowHint}
                  disabled={showExplanation}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb size={16} />
                  Show Hint
                </button>
              )}
            </div>
          )}

          {/* Explanation */}
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg ${
                isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                )}
                <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-orange-800'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
              </div>
              <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!showExplanation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <>
                  Next
                  <ChevronRight size={20} />
                </>
              ) : (
                'Complete Quiz'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


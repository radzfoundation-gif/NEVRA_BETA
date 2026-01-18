import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Check, X, Lightbulb, TrendingUp, Calendar } from 'lucide-react';
import { getDueFlashcards, reviewFlashcard, type Flashcard } from '@/lib/learning/flashcardManager';
import { useUser } from '@/lib/authContext';

interface FlashcardReviewProps {
  topic?: string;
  limit?: number;
  onComplete?: () => void;
}

export default function FlashcardReview({
  topic,
  limit = 10,
  onComplete,
}: FlashcardReviewProps) {
  const { user } = useUser();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlashcards();
  }, [user, topic]);

  const loadFlashcards = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const due = await getDueFlashcards(user.id);
      let filtered = topic ? due.filter(c => c.topic === topic) : due;

      if (limit) {
        filtered = filtered.slice(0, limit);
      }

      setFlashcards(filtered);
      setCurrentIndex(0);
      setFlipped(false);
      setShowAnswer(false);
      setReviewedCount(0);
      setCorrectCount(0);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    setFlipped(!flipped);
    setShowAnswer(true);
  };

  const handleReview = async (success: boolean) => {
    if (!currentCard || !user) return;

    await reviewFlashcard(currentCard.id, success);

    if (success) {
      setCorrectCount(prev => prev + 1);
    }
    setReviewedCount(prev => prev + 1);

    // Move to next card
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
      setShowAnswer(false);
    } else {
      // All cards reviewed
      onComplete?.();
    }
  };

  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;
  const accuracy = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center p-8 space-y-4">
        <div className="text-4xl">🎉</div>
        <h3 className="text-xl font-semibold">All caught up!</h3>
        <p className="text-gray-600">No flashcards due for review.</p>
        <button
          onClick={loadFlashcards}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (reviewedCount >= flashcards.length) {
    return (
      <div className="text-center p-8 space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className="text-6xl">🎉</div>
          <h3 className="text-2xl font-bold">Review Complete!</h3>
          <div className="flex items-center justify-center gap-6 text-lg">
            <div>
              <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{accuracy}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{reviewedCount}</p>
              <p className="text-sm text-gray-600">Reviewed</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={loadFlashcards}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RotateCcw size={20} />
              Review More
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Card {currentIndex + 1} of {flashcards.length}</span>
          {reviewedCount > 0 && (
            <span className="flex items-center gap-2">
              <TrendingUp size={14} />
              {accuracy}% accuracy
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <motion.div
        key={currentCard.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative h-64 perspective-1000"
        onClick={handleFlip}
      >
        <motion.div
          className="absolute inset-0 preserve-3d cursor-pointer"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white border-2 border-blue-200 rounded-xl p-6 shadow-lg flex flex-col justify-center items-center">
            <div className="text-sm text-gray-500 mb-2">{currentCard.topic}</div>
            <h3 className="text-xl font-semibold text-center">{currentCard.front}</h3>
            <div className="mt-4 text-sm text-gray-400 flex items-center gap-2">
              <Lightbulb size={14} />
              Click to flip
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg flex flex-col justify-center items-center rotate-y-180">
            <div className="text-sm text-blue-600 mb-2">Answer</div>
            <p className="text-lg text-center">{currentCard.back}</p>
            {currentCard.successRate > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Success rate: {Math.round(currentCard.successRate * 100)}%
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Actions */}
      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4"
        >
          <button
            onClick={() => handleReview(false)}
            className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <X size={20} />
            Got it wrong
          </button>
          <button
            onClick={() => handleReview(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Check size={20} />
            Got it right
          </button>
        </motion.div>
      )}

      {/* Card Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Calendar size={12} />
          <span>
            Next review: {new Date(currentCard.nextReview).toLocaleDateString()}
          </span>
        </div>
        <span>Review #{currentCard.reviewCount + 1}</span>
      </div>
    </div>
  );
}


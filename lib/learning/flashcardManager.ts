import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { firebaseMock } from '../firebaseFake';

export interface Flashcard {
  id: string;
  userId: string;
  front: string;
  back: string;
  topic: string;
  difficulty: number; // 0-5 (for spaced repetition)
  lastReviewed: Date;
  nextReview: Date; // Calculated using spaced repetition
  reviewCount: number;
  successCount: number;
  failCount: number;
  successRate: number; // 0-1
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// Spaced Repetition Algorithm (SM-2 based)
const calculateNextReview = (
  lastReview: Date,
  difficulty: number,
  reviewCount: number,
  success: boolean
): Date => {
  const now = new Date();
  
  if (reviewCount === 0) {
    // First review: review again in 1 day
    return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  }
  
  if (!success) {
    // Reset: review again tomorrow
    return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  }
  
  // Calculate interval based on difficulty and review count
  // Difficulty ranges from 0-5 (ease factor in SM-2)
  const easeFactor = difficulty === 0 ? 2.5 : difficulty / 2 + 1.5; // 1.5 to 4.0
  const interval = reviewCount === 1
    ? 1 // 1 day
    : reviewCount === 2
    ? 3 // 3 days
    : Math.ceil((reviewCount - 1) * easeFactor);
  
  return new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
};

const updateDifficulty = (
  currentDifficulty: number,
  success: boolean
): number => {
  // Difficulty adjustment (ease factor in SM-2)
  // Higher difficulty = easier to remember = longer intervals
  if (success) {
    // Increase difficulty (easier to remember)
    return Math.min(5, currentDifficulty + 0.1 + (currentDifficulty > 2.5 ? 0.05 : 0));
  } else {
    // Decrease difficulty (harder to remember)
    return Math.max(0, currentDifficulty - 0.15);
  }
};

let useFirebaseMock = false;
try {
  if (!db) useFirebaseMock = true;
} catch {
  useFirebaseMock = true;
}

/**
 * Create a flashcard
 */
export async function createFlashcard(
  userId: string,
  flashcardData: Omit<Flashcard, 'id' | 'userId' | 'lastReviewed' | 'nextReview' | 'reviewCount' | 'successCount' | 'failCount' | 'successRate' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const flashcard: Flashcard = {
      ...flashcardData,
      id: `card_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      lastReviewed: now,
      nextReview: tomorrow,
      reviewCount: 0,
      successCount: 0,
      failCount: 0,
      successRate: 0,
      difficulty: flashcardData.difficulty || 2.5,
      createdAt: now,
      updatedAt: now,
    };

    if (useFirebaseMock) {
      await firebaseMock.setDoc('flashcards', flashcard.id, flashcard);
    } else {
      const cardRef = doc(db, 'flashcards', flashcard.id);
      await setDoc(cardRef, {
        ...flashcard,
        lastReviewed: Timestamp.fromDate(flashcard.lastReviewed),
        nextReview: Timestamp.fromDate(flashcard.nextReview),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return flashcard.id;
  } catch (error) {
    console.error('Error creating flashcard:', error);
    return null;
  }
}

/**
 * Get user flashcards
 */
export async function getUserFlashcards(
  userId: string,
  options?: {
    topic?: string;
    dueForReview?: boolean;
    tag?: string;
    limit?: number;
  }
): Promise<Flashcard[]> {
  try {
    if (useFirebaseMock) {
      let flashcards = await firebaseMock.getAll('flashcards');
      let filtered = (flashcards as Flashcard[]).filter(f => f.userId === userId);

      if (options?.topic) {
        filtered = filtered.filter(f => f.topic === options.topic);
      }
      if (options?.tag && options.tag !== 'all') {
        filtered = filtered.filter(f => f.tags?.includes(options.tag!));
      }
      if (options?.dueForReview) {
        const now = new Date();
        filtered = filtered.filter(f => new Date(f.nextReview) <= now);
      }

      // Sort by nextReview
      filtered.sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());

      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered.map(f => ({
        ...f,
        lastReviewed: f.lastReviewed instanceof Date ? f.lastReviewed : new Date(f.lastReviewed),
        nextReview: f.nextReview instanceof Date ? f.nextReview : new Date(f.nextReview),
        createdAt: f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt),
        updatedAt: f.updatedAt instanceof Date ? f.updatedAt : new Date(f.updatedAt),
      }));
    }

    let q: any = query(collection(db, 'flashcards'), where('userId', '==', userId));

    if (options?.topic) {
      q = query(q, where('topic', '==', options.topic));
    }
    if (options?.dueForReview) {
      const now = Timestamp.now();
      q = query(q, where('nextReview', '<=', now));
    }

    q = query(q, orderBy('nextReview', 'asc'));

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastReviewed: data.lastReviewed?.toDate() || new Date(),
        nextReview: data.nextReview?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Flashcard;
    });
  } catch (error) {
    console.error('Error getting flashcards:', error);
    return [];
  }
}

/**
 * Review a flashcard
 */
export async function reviewFlashcard(
  flashcardId: string,
  success: boolean
): Promise<boolean> {
  try {
    if (useFirebaseMock) {
      const flashcard = await firebaseMock.getDoc('flashcards', flashcardId);
      if (!flashcard) return false;

      const now = new Date();
      const reviewCount = (flashcard as Flashcard).reviewCount + 1;
      const successCount = (flashcard as Flashcard).successCount + (success ? 1 : 0);
      const failCount = (flashcard as Flashcard).failCount + (success ? 0 : 1);
      const successRate = reviewCount > 0 ? successCount / reviewCount : 0;
      
      const newDifficulty = updateDifficulty((flashcard as Flashcard).difficulty, success);
      const nextReview = calculateNextReview(
        now,
        newDifficulty,
        reviewCount,
        success
      );

      const updated: Flashcard = {
        ...(flashcard as Flashcard),
        difficulty: newDifficulty,
        lastReviewed: now,
        nextReview,
        reviewCount,
        successCount,
        failCount,
        successRate,
        updatedAt: now,
      };

      await firebaseMock.setDoc('flashcards', flashcardId, updated);
      return true;
    }

    const cardRef = doc(db, 'flashcards', flashcardId);
    const cardSnap = await getDoc(cardRef);

    if (!cardSnap.exists()) return false;

    const data = cardSnap.data();
    const now = new Date();
    const reviewCount = (data.reviewCount || 0) + 1;
    const successCount = (data.successCount || 0) + (success ? 1 : 0);
    const failCount = (data.failCount || 0) + (success ? 0 : 1);
    const successRate = reviewCount > 0 ? successCount / reviewCount : 0;
    
    const newDifficulty = updateDifficulty(data.difficulty || 2.5, success);
    const nextReview = calculateNextReview(
      data.lastReviewed?.toDate() || now,
      newDifficulty,
      reviewCount,
      success
    );

    await updateDoc(cardRef, {
      difficulty: newDifficulty,
      lastReviewed: Timestamp.now(),
      nextReview: Timestamp.fromDate(nextReview),
      reviewCount,
      successCount,
      failCount,
      successRate,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('Error reviewing flashcard:', error);
    return false;
  }
}

/**
 * Get flashcards due for review
 */
export async function getDueFlashcards(userId: string): Promise<Flashcard[]> {
  return getUserFlashcards(userId, { dueForReview: true });
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(flashcardId: string): Promise<boolean> {
  try {
    if (useFirebaseMock) {
      await firebaseMock.deleteDoc('flashcards', flashcardId);
      return true;
    }

    const cardRef = doc(db, 'flashcards', flashcardId);
    await deleteDoc(cardRef);
    return true;
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return false;
  }
}

/**
 * Generate flashcards from conversation
 */
export async function generateFlashcardsFromConversation(
  userId: string,
  topic: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<Flashcard[]> {
  // Extract key concepts and facts from conversation
  // This is a simplified version - in production, use AI to extract key points
  const flashcards: Omit<Flashcard, 'id' | 'userId' | 'lastReviewed' | 'nextReview' | 'reviewCount' | 'successCount' | 'failCount' | 'successRate' | 'createdAt' | 'updatedAt'>[] = [];

  // Simple extraction - just create a few flashcards
  // In production, use AI to generate Q&A pairs
  const concepts = [
    { front: `What is ${topic}?`, back: `Definition of ${topic}` },
    { front: `Why is ${topic} important?`, back: `Importance of ${topic}` },
  ];

  const created: Flashcard[] = [];
  for (const concept of concepts) {
    const cardId = await createFlashcard(userId, {
      front: concept.front,
      back: concept.back,
      topic,
      difficulty: 2.5,
      tags: [topic],
    });

    if (cardId) {
      const card = await getFlashcard(cardId);
      if (card) created.push(card);
    }
  }

  return created;
}

/**
 * Get a single flashcard
 */
export async function getFlashcard(flashcardId: string): Promise<Flashcard | null> {
  try {
    if (useFirebaseMock) {
      const card = await firebaseMock.getDoc('flashcards', flashcardId);
      return card as Flashcard | null;
    }

    const cardRef = doc(db, 'flashcards', flashcardId);
    const cardSnap = await getDoc(cardRef);

    if (!cardSnap.exists()) return null;

    const data = cardSnap.data();
    return {
      id: cardSnap.id,
      ...data,
      lastReviewed: data.lastReviewed?.toDate() || new Date(),
      nextReview: data.nextReview?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Flashcard;
  } catch (error) {
    console.error('Error getting flashcard:', error);
    return null;
  }
}


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
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { firebaseMock } from '../firebaseFake';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  linkedTopics: string[];
  relatedConversations: string[]; // Chat session IDs
  createdAt: Date;
  updatedAt: Date;
  attachments?: NoteAttachment[];
  isFavorite?: boolean;
  category?: 'study' | 'review' | 'reference' | 'todo';
}

export interface NoteAttachment {
  type: 'image' | 'code' | 'link';
  content: string;
  metadata?: Record<string, any>;
}

let useFirebaseMock = false;
try {
  if (!db) useFirebaseMock = true;
} catch {
  useFirebaseMock = true;
}

/**
 * Create a new note
 */
export async function createNote(
  userId: string,
  noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    const note: Note = {
      ...noteData,
      id: `note_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (useFirebaseMock) {
      await firebaseMock.setDoc('notes', note.id, note);
    } else {
      const noteRef = doc(db, 'notes', note.id);
      await setDoc(noteRef, {
        ...note,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return note.id;
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
}

/**
 * Get user notes
 */
export async function getUserNotes(userId: string, options?: {
  tag?: string;
  topic?: string;
  category?: string;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
}): Promise<Note[]> {
  try {
    if (useFirebaseMock) {
      const notes = await firebaseMock.getAll('notes');
      let filtered = (notes as Note[]).filter(n => n.userId === userId);

      if (options?.tag) {
        filtered = filtered.filter(n => n.tags.includes(options.tag!));
      }
      if (options?.topic) {
        filtered = filtered.filter(n => n.linkedTopics.includes(options.topic!));
      }
      if (options?.category) {
        filtered = filtered.filter(n => n.category === options.category);
      }

      // Sort
      const sortBy = options?.orderBy || 'updatedAt';
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal instanceof Date && bVal instanceof Date) {
          return bVal.getTime() - aVal.getTime();
        }
        return String(aVal).localeCompare(String(bVal));
      });

      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered;
    }

    let q: any = query(collection(db, 'notes'), where('userId', '==', userId));

    if (options?.tag) {
      q = query(q, where('tags', 'array-contains', options.tag));
    }
    if (options?.topic) {
      q = query(q, where('linkedTopics', 'array-contains', options.topic));
    }
    if (options?.category) {
      q = query(q, where('category', '==', options.category));
    }

    if (options?.orderBy) {
      q = query(q, orderBy(options.orderBy, 'desc'));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Note;
    });
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
}

/**
 * Get a single note
 */
export async function getNote(noteId: string): Promise<Note | null> {
  try {
    if (useFirebaseMock) {
      const note = await firebaseMock.getDoc('notes', noteId);
      return note as Note | null;
    }

    const noteRef = doc(db, 'notes', noteId);
    const noteSnap = await getDoc(noteRef);

    if (!noteSnap.exists()) return null;

    const data = noteSnap.data();
    return {
      id: noteSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Note;
  } catch (error) {
    console.error('Error getting note:', error);
    return null;
  }
}

/**
 * Update a note
 */
export async function updateNote(
  noteId: string,
  updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt'>> & { updatedAt?: Date }
): Promise<boolean> {
  try {
    if (useFirebaseMock) {
      const note = await firebaseMock.getDoc('notes', noteId);
      if (!note) return false;

      const updated = {
        ...note,
        ...updates,
        updatedAt: new Date(),
      };
      await firebaseMock.setDoc('notes', noteId, updated);
      return true;
    }

    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('Error updating note:', error);
    return false;
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    if (useFirebaseMock) {
      await firebaseMock.deleteDoc('notes', noteId);
      return true;
    }

    const noteRef = doc(db, 'notes', noteId);
    await deleteDoc(noteRef);
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
}

/**
 * Search notes
 */
export async function searchNotes(
  userId: string,
  searchQuery: string
): Promise<Note[]> {
  try {
    const notes = await getUserNotes(userId);
    const query = searchQuery.toLowerCase();

    return notes.filter(note => {
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(query));
      return titleMatch || contentMatch || tagMatch;
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    return [];
  }
}

/**
 * Export note as Markdown
 */
export function exportNoteAsMarkdown(note: Note): string {
  let markdown = `# ${note.title}\n\n`;
  
  if (note.tags.length > 0) {
    markdown += `Tags: ${note.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
  }
  
  if (note.linkedTopics.length > 0) {
    markdown += `Topics: ${note.linkedTopics.join(', ')}\n\n`;
  }
  
  markdown += `${note.content}\n\n`;
  
  if (note.attachments && note.attachments.length > 0) {
    markdown += `## Attachments\n\n`;
    note.attachments.forEach(att => {
      if (att.type === 'code') {
        markdown += `\`\`\`\n${att.content}\n\`\`\`\n\n`;
      } else if (att.type === 'link') {
        markdown += `[${att.metadata?.title || 'Link'}](${att.content})\n\n`;
      }
    });
  }
  
  markdown += `---\n\n`;
  markdown += `Created: ${note.createdAt.toLocaleDateString()}\n`;
  markdown += `Updated: ${note.updatedAt.toLocaleDateString()}\n`;
  
  return markdown;
}

/**
 * Export all notes as Markdown
 */
export async function exportAllNotesAsMarkdown(userId: string): Promise<string> {
  const notes = await getUserNotes(userId, { orderBy: 'updatedAt' });
  return notes.map(note => exportNoteAsMarkdown(note)).join('\n\n---\n\n');
}


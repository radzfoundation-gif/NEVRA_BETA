import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Tag, Link, Code, Image, Star } from 'lucide-react';
import { createNote, updateNote, getUserNotes, type Note } from '@/lib/learning/notesManager';
import { useUser } from '@/lib/authContext';

interface NoteEditorProps {
  note?: Note;
  topic?: string;
  conversationId?: string;
  onSave?: (note: Note) => void;
  onClose?: () => void;
}

export default function NoteEditor({
  note,
  topic,
  conversationId,
  onSave,
  onClose,
}: NoteEditorProps) {
  const { user } = useUser();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [linkedTopics, setLinkedTopics] = useState<string[]>(
    note?.linkedTopics || (topic ? [topic] : [])
  );
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
  const [category, setCategory] = useState<Note['category']>(note?.category || 'study');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        content: content.trim(),
        tags,
        linkedTopics,
        relatedConversations: conversationId
          ? [...(note?.relatedConversations || []), conversationId]
          : note?.relatedConversations || [],
        isFavorite,
        category,
      };

      let savedNote: Note;
      if (note) {
        // Update existing note
        await updateNote(note.id, noteData);
        savedNote = { ...note, ...noteData, updatedAt: new Date() };
      } else {
        // Create new note
        const noteId = await createNote(user.id, noteData);
        if (!noteId) throw new Error('Failed to create note');
        savedNote = {
          ...noteData,
          id: noteId,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      onSave?.(savedNote);
      onClose?.();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{note ? 'Edit Note' : 'New Note'}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-lg transition-colors ${isFavorite
                ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
              }`}
          >
            <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Note title..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
        />
      </div>

      {/* Category */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Category:</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as Note['category'])}
          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="study">Study</option>
          <option value="review">Review</option>
          <option value="reference">Reference</option>
          <option value="todo">Todo</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Tags:</label>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              <Tag size={12} />
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-blue-900"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAddTag()}
            placeholder="Add tag..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {/* Linked Topics */}
      {linkedTopics.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Topics:</label>
          <div className="flex items-center gap-2 flex-wrap">
            {linkedTopics.map(topic => (
              <span
                key={topic}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Content:</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your notes here... (Ctrl+Enter to save)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={12}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim() || !content.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {saving ? 'Saving...' : note ? 'Update Note' : 'Save Note'}
        </button>
      </div>
    </motion.div>
  );
}


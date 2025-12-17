'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookmarkSimple, X, Check, BookOpen, Pencil } from '@phosphor-icons/react';
import { Suggestion } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

interface LunaSuggestionCardProps {
  suggestion: Suggestion;
  userMessage?: string;  // The parent's original message for context
  onSave?: (suggestion: Suggestion) => Promise<void>;
}

/**
 * Suggestion card with Save/Ignore/Create actions
 * 
 * - Title, why_this_might_help, steps
 * - [Create Assignment/Lesson] → navigates to form with pre-filled data
 * - [Save to my ideas] → calls onSave (writes to ideas table)
 * - [Ignore] → removes from view (no DB write)
 */
export function LunaSuggestionCard({ suggestion, userMessage, onSave }: LunaSuggestionCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'visible' | 'saving' | 'saved' | 'ignored'>('visible');

  const hasAssignmentData = !!suggestion.assignment_data;
  const hasLessonData = !!suggestion.lesson_data;

  const handleCreateAssignment = () => {
    if (suggestion.assignment_data) {
      // Store pre-fill data in sessionStorage
      sessionStorage.setItem('luna-prefill', JSON.stringify({
        type: 'assignment',
        data: {
          title: suggestion.assignment_data.title,
          type: suggestion.assignment_data.type,
          deliverable: suggestion.assignment_data.deliverable,
          rubric: suggestion.assignment_data.rubric.map(text => ({ text })),
          steps: suggestion.assignment_data.steps.map(text => ({ text })),
          tags: suggestion.assignment_data.tags,
          estimatedMinutes: suggestion.assignment_data.estimatedMinutes,
          parentNotes: suggestion.assignment_data.parentNotes || '',
        }
      }));
      router.push('/parent/assignments?from=luna');
    }
  };

  const handleCreateLesson = () => {
    if (suggestion.lesson_data) {
      sessionStorage.setItem('luna-prefill', JSON.stringify({
        type: 'lesson',
        data: {
          title: suggestion.lesson_data.title,
          type: suggestion.lesson_data.type,
          keyQuestions: suggestion.lesson_data.keyQuestions.map(text => ({ text })),
          materials: suggestion.lesson_data.materials,
          tags: suggestion.lesson_data.tags,
          estimatedMinutes: suggestion.lesson_data.estimatedMinutes,
          parentNotes: suggestion.lesson_data.parentNotes || '',
        }
      }));
      router.push('/parent/lessons?from=luna');
    }
  };

  const handleSave = async () => {
    setStatus('saving');
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: suggestion.title,
          content: suggestion.why_this_might_help,
          user_message: userMessage,
          suggestion_data: suggestion,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      if (onSave) {
        await onSave(suggestion);
      }
      setStatus('saved');
    } catch {
      setStatus('visible');
    }
  };

  const handleIgnore = () => {
    setStatus('ignored');
  };

  if (status === 'ignored') {
    return null;
  }

  if (status === 'saved') {
    return (
      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
        <Check size={16} weight="bold" />
        Saved to your ideas
      </div>
    );
  }

  return (
    <div className={cn(
      "card p-4 space-y-3",
      "border-l-2 border-[var(--fabric-lilac)]"
    )}>
      {/* Title */}
      <h4 className="font-medium text-gray-900 dark:text-white">
        {suggestion.title}
      </h4>

      {/* Why this might help */}
      <p className="text-sm text-muted">
        {suggestion.why_this_might_help}
      </p>

      {/* Steps */}
      {(suggestion.steps?.length ?? 0) > 0 && (
        <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
          {suggestion.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[var(--paper-100)] dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-muted">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
      )}

      {/* Create Actions - shown when form data is available */}
      {(hasAssignmentData || hasLessonData) && (
        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {hasAssignmentData && (
            <button
              type="button"
              onClick={handleCreateAssignment}
              className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all inline-flex items-center gap-1.5 bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-white shadow-sm cursor-pointer"
            >
              <Pencil size={16} weight="duotone" />
              Create Assignment
            </button>
          )}
          {hasLessonData && (
            <button
              type="button"
              onClick={handleCreateLesson}
              className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all inline-flex items-center gap-1.5 bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-white shadow-sm cursor-pointer"
            >
              <BookOpen size={16} weight="duotone" />
              Create Lesson
            </button>
          )}
        </div>
      )}

      {/* Other Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="btn-sm bg-[var(--fabric-lilac)]/10 hover:bg-[var(--fabric-lilac)]/20 text-[var(--fabric-lilac)] dark:text-[var(--fabric-lilac)]"
        >
          <BookmarkSimple size={16} weight="duotone" />
          {status === 'saving' ? 'Saving...' : 'Save to my ideas'}
        </button>
        <button
          onClick={handleIgnore}
          className="btn-sm text-muted hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X size={16} />
          Ignore
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted pt-1">
        Just a thought — your judgment is what matters.
      </p>
    </div>
  );
}


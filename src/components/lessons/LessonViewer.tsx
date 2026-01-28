'use client';

import { Clock, BookOpen, LinkSimple, Question, Sparkle, Package } from '@phosphor-icons/react';
import { MarkdownText } from '@/components/ui/MarkdownText';

interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    type: string;
    description?: string;
    instructions?: string;
    estimated_minutes?: number;
    keyQuestions?: (string | { text: string })[];
    key_questions?: (string | { text: string })[];
    materials?: string;
    links?: { url: string; label: string }[];
  };
}

/**
 * Read-only view of lesson details
 * Similar to how kids see lessons in their schedule
 */
export function LessonViewer({ lesson }: LessonViewerProps) {
  const content = lesson.description || lesson.instructions || '';
  const questions = lesson.keyQuestions || lesson.key_questions || [];
  
  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-[var(--celestial-500)]/20 text-[var(--celestial-500)]">
          {lesson.type}
        </span>
        {lesson.estimated_minutes && (
          <span className="text-sm text-muted flex items-center gap-1">
            <Clock size={18} weight="duotone" className="text-amber-400" />
            {lesson.estimated_minutes} min
          </span>
        )}
      </div>

      {/* Instructions / Content */}
      {content && (
        <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <BookOpen size={24} weight="duotone" className="text-[var(--celestial-400)]" />
            Lesson Content
          </h4>
          <MarkdownText content={content} />
        </div>
      )}

      {/* Key Questions */}
      {questions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Question size={24} weight="duotone" className="text-amber-400" />
            Key Questions
          </h4>
          <div className="space-y-2">
            {questions.map((q, i) => {
              const text = typeof q === 'string' ? q : q.text;
              return text ? (
                <div key={i} className="flex gap-3 p-3 bg-[var(--background-elevated)] rounded-lg border border-[var(--border)]">
                  <span className="font-bold text-amber-500 w-6 text-right">{i + 1}.</span>
                  <p className="text-heading dark:text-muted flex-1">{text}</p>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Materials */}
      {lesson.materials && (
        <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <Package size={24} weight="duotone" className="text-green-400" />
            Materials Needed
          </h4>
          <MarkdownText content={lesson.materials} />
        </div>
      )}

      {/* Links */}
      {lesson.links && lesson.links.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
            Resources & Links
          </h4>
          <div className="space-y-2">
            {lesson.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-[var(--background-elevated)] rounded-lg border border-[var(--border)] hover:border-[var(--ember-300)] hover:bg-[var(--ember-50)] dark:hover:bg-[var(--ember-900)]/20 transition-all group"
              >
                <LinkSimple size={18} weight="duotone" className="text-[var(--ember-500)]" />
                <span className="text-heading dark:text-muted flex-1 group-hover:text-[var(--ember-600)]">
                  {link.label || link.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Info message */}
      <div className="bg-[var(--celestial-500)]/10 p-4 rounded-xl text-center">
        <p className="text-[var(--celestial-600)] dark:text-[var(--celestial-400)] font-medium flex items-center justify-center gap-2 text-sm">
          <Sparkle size={18} weight="fill" className="text-yellow-500" />
          This is how students see this lesson
        </p>
      </div>
    </div>
  );
}

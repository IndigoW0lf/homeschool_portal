'use client';

import { Clock, BookOpen, PencilSimple, CheckSquare, FileText, LinkSimple, Tag } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Lesson, AssignmentItemRow } from '@/types';
import { MarkdownText } from '@/components/ui/MarkdownText';

export interface ItemDetailViewProps {
  /** Full lesson or assignment from DB */
  item: Lesson | AssignmentItemRow | null;
  itemType: 'lesson' | 'assignment';
  /** Optional: show compact (e.g. in DayModal side panel) */
  compact?: boolean;
}

function safeArray<T>(arr: unknown): T[] {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr as T[];
  try {
    return JSON.parse(String(arr)) as T[];
  } catch {
    return [];
  }
}

/**
 * Single read-only view of a lesson or assignment.
 * Used in ItemDetailModal (library) and DayModal (day view) so content is identical.
 */
export function ItemDetailView({ item, itemType, compact = false }: ItemDetailViewProps) {
  if (!item) {
    return (
      <div className="py-8 text-center text-muted text-sm">
        No details available for this item.
      </div>
    );
  }

  const isLesson = itemType === 'lesson';
  const lesson = isLesson ? (item as Lesson) : null;
  const assignment = !isLesson ? (item as AssignmentItemRow) : null;

  // Normalize lesson fields (direct + legacy JSON in instructions)
  let description = '';
  let keyQuestions: Array<string | { text: string }> = [];
  let materials = '';
  let links: { label: string; url: string }[] = [];

  if (lesson) {
    description = lesson.description || '';
    keyQuestions = Array.isArray(lesson.keyQuestions) ? lesson.keyQuestions : [];
    materials = lesson.materials || '';
    links = Array.isArray(lesson.links) ? lesson.links : [];
    if (!description && lesson.instructions) {
      try {
        const parsed = JSON.parse(lesson.instructions);
        if (parsed.description) description = parsed.description;
        if (!keyQuestions.length && parsed.keyQuestions) keyQuestions = parsed.keyQuestions;
        if (!materials && parsed.materials) materials = parsed.materials;
        if (!links.length && parsed.links) links = parsed.links;
      } catch {
        description = lesson.instructions;
      }
    }
  }

  const steps = assignment ? safeArray<{ text?: string }>(assignment.steps) : [];
  const rubric = assignment ? safeArray<{ text?: string }>(assignment.rubric) : [];
  const assignmentLinks = assignment ? safeArray<{ label?: string; url?: string }>(assignment.links) : [];
  const tags = (lesson?.tags ?? assignment?.tags ?? []) as string[];

  const estimatedMinutes = isLesson
    ? (lesson as Lesson).estimatedMinutes ?? (lesson as unknown as { estimated_minutes?: number }).estimated_minutes
    : assignment?.estimated_minutes ?? 20;

  const sectionClass = compact
    ? 'rounded-lg border border-[var(--border)] p-3'
    : 'bg-[var(--background-elevated)] rounded-xl border border-[var(--border)] p-5';
  const headingClass = 'text-sm font-semibold text-muted uppercase tracking-wider mb-2';

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {/* Description */}
      {description && (
        <div className={sectionClass}>
          <h3 className={headingClass}>Description</h3>
          <MarkdownText
            content={description}
            className={cn('text-heading dark:text-muted', !compact && 'prose prose-sm max-w-none')}
          />
        </div>
      )}

      {/* Key Questions (lessons) */}
      {isLesson && keyQuestions.length > 0 && (
        <div className={sectionClass}>
          <h3 className={headingClass}>Key Questions</h3>
          <ul className="space-y-2">
            {keyQuestions.map((q, i) => {
              const text = typeof q === 'string' ? q : (q as { text?: string })?.text || '';
              return text ? (
                <li key={i} className="flex gap-2 text-heading dark:text-muted">
                  <span className="text-[var(--celestial-500)]">•</span>
                  {text}
                </li>
              ) : null;
            })}
          </ul>
        </div>
      )}

      {/* Materials (lessons) */}
      {isLesson && materials && (
        <div className={sectionClass}>
          <h3 className={headingClass}>Materials</h3>
          <MarkdownText content={materials} className="text-heading dark:text-muted" />
        </div>
      )}

      {/* Deliverable (assignments) */}
      {assignment?.deliverable && (
        <div className={sectionClass}>
          <h3 className={headingClass}>Expected Deliverable</h3>
          <MarkdownText content={assignment.deliverable} className="text-heading dark:text-muted" />
        </div>
      )}

      {/* Steps (assignments) */}
      {steps.length > 0 && (
        <div className={sectionClass}>
          <h3 className={headingClass}>Steps</h3>
          <ul className="space-y-2">
            {steps.map((step, i) =>
              step?.text ? (
                <li key={i} className="flex gap-3 p-2 rounded-lg bg-[var(--background-secondary)]/50">
                  <span className="font-bold text-muted w-6 text-right">{i + 1}.</span>
                  <span className="text-heading dark:text-muted">{step.text}</span>
                </li>
              ) : null
            )}
          </ul>
        </div>
      )}

      {/* Rubric (assignments) */}
      {rubric.length > 0 && (
        <div className={sectionClass}>
          <h3 className={headingClass}>Success Criteria</h3>
          <ul className="space-y-2">
            {rubric.map((r, i) =>
              r?.text ? (
                <li key={i} className="flex items-center gap-2 text-heading dark:text-muted">
                  <div className="w-4 h-4 rounded border-2 border-[var(--border)]" />
                  {r.text}
                </li>
              ) : null
            )}
          </ul>
        </div>
      )}

      {/* Links */}
      {((isLesson && links.length > 0) || (!isLesson && assignmentLinks.length > 0)) && (
        <div className={sectionClass}>
          <h3 className={headingClass}>Links & Resources</h3>
          <div className="flex flex-wrap gap-2">
            {(isLesson ? links : assignmentLinks).map((link, i) => {
              const url = 'url' in link ? link.url : (link as { url?: string }).url;
              const label = 'label' in link ? link.label : (link as { label?: string }).label;
              if (!url) return null;
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--celestial-500)] hover:bg-[var(--celestial-50)] dark:hover:bg-[var(--celestial-900)]/20 transition-colors"
                >
                  <LinkSimple size={16} weight="duotone" />
                  {label || 'Link'}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className={sectionClass}>
          <h3 className={headingClass}>Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-[var(--background-secondary)] text-muted rounded text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Parent Notes */}
      {(lesson?.parentNotes ?? assignment?.parent_notes) && (
        <div className="bg-[var(--solar-50)] dark:bg-[var(--solar-900)]/20 rounded-xl border border-[var(--solar-100)] dark:border-[var(--solar-900)]/30 p-4">
          <h3 className="text-sm font-semibold text-[var(--solar-700)] dark:text-[var(--solar-400)] uppercase tracking-wider mb-2">
            Parent Notes (Private)
          </h3>
          <MarkdownText
            content={String(lesson?.parentNotes ?? assignment?.parent_notes ?? '')}
            className="text-[var(--solar-800)] dark:text-[var(--solar-300)] text-sm"
          />
        </div>
      )}

      {/* Empty state */}
      {!description && !keyQuestions.length && !materials && steps.length === 0 && rubric.length === 0 &&
       links.length === 0 && assignmentLinks.length === 0 && tags.length === 0 &&
       !lesson?.parentNotes && !assignment?.parent_notes && (
        <div className="py-6 text-center text-muted text-sm">
          No additional details for this item.
        </div>
      )}
    </div>
  );
}

/** Header strip for the detail view (title, type badge, duration) - shared so modal and day view look the same */
export function ItemDetailHeader({
  item,
  itemType,
  onEdit,
  onBack,
  compact,
}: {
  item: Lesson | AssignmentItemRow | null;
  itemType: 'lesson' | 'assignment';
  onEdit?: () => void;
  onBack?: () => void;
  compact?: boolean;
}) {
  if (!item) return null;

  const isLesson = itemType === 'lesson';
  const estimatedMinutes = isLesson
    ? (item as Lesson).estimatedMinutes ?? (item as unknown as { estimated_minutes?: number }).estimated_minutes
    : (item as AssignmentItemRow).estimated_minutes ?? 20;

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 hover:bg-[var(--background-secondary)] rounded-full transition-colors"
          aria-label="Back"
        >
          <span className="text-muted text-xl leading-none">←</span>
        </button>
      )}
      <div
        className={cn(
          'rounded-lg flex items-center justify-center flex-shrink-0',
          compact ? 'w-9 h-9' : 'w-10 h-10',
          isLesson ? 'bg-[var(--celestial-400)]/20 text-[var(--celestial-500)]' : 'bg-[var(--nebula-purple)]/20 text-[var(--nebula-purple)]'
        )}
      >
        {isLesson ? <BookOpen size={compact ? 18 : 22} weight="duotone" /> : <PencilSimple size={compact ? 18 : 22} weight="duotone" />}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mb-0.5',
            isLesson ? 'bg-[var(--celestial-400)]/20 text-[var(--celestial-500)]' : 'bg-[var(--nebula-purple)]/20 text-[var(--nebula-purple)]'
          )}
        >
          {item.type || (isLesson ? 'Lesson' : 'Assignment')}
        </span>
        <h2 className="font-bold text-heading truncate">{item.title}</h2>
        <span className="text-xs text-muted flex items-center gap-1">
          <Clock size={12} weight="duotone" />
          {estimatedMinutes} min
        </span>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex-shrink-0 px-3 py-1.5 bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-[var(--foreground)] rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          Edit
        </button>
      )}
    </div>
  );
}

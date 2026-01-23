'use client';

import { CheckSquare, FileText, LinkSimple, Clock, Sparkle } from '@phosphor-icons/react';
import { MarkdownText } from '@/components/ui/MarkdownText';

interface AssignmentViewerProps {
  assignment: {
    id: string;
    title: string;
    type: string;
    deliverable: string;
    estimated_minutes?: number;
    steps?: { text: string }[];
    rubric?: { text: string }[];
    links?: { url: string; label: string }[];
  };
}

/**
 * Read-only view of assignment details
 * Similar to how kids see assignments in ScheduleItemsList
 */
export function AssignmentViewer({ assignment }: AssignmentViewerProps) {
  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          {assignment.type}
        </span>
        {assignment.estimated_minutes && (
          <span className="text-sm text-muted flex items-center gap-1">
            <Clock size={18} weight="duotone" color="#e7b58d" />
            {assignment.estimated_minutes} min
          </span>
        )}
      </div>

      {/* Deliverable */}
      {assignment.deliverable && (
        <div className="bg-[var(--background-elevated)] p-4 rounded-xl border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText size={24} weight="duotone" color="#b6e1d8" />
            What to Turn In
          </h4>
          <MarkdownText content={assignment.deliverable} />
        </div>
      )}

      {/* Steps */}
      {assignment.steps && assignment.steps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Steps to Complete
          </h4>
          <div className="space-y-2">
            {assignment.steps.map((step, i) => (
              step.text && (
                <div key={i} className="flex gap-3 p-3 bg-[var(--background-elevated)] rounded-lg border border-[var(--border)]">
                  <span className="font-bold text-[var(--ember-500)] w-6 text-right">{i + 1}.</span>
                  <p className="text-heading dark:text-muted flex-1">{step.text}</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Rubric / Success Criteria */}
      {assignment.rubric && assignment.rubric.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckSquare size={24} weight="duotone" color="#b6e1d8" />
            Success Criteria
          </h4>
          <div className="space-y-2">
            {assignment.rubric.map((item, i) => (
              item.text && (
                <div key={i} className="flex items-center gap-2 text-heading dark:text-muted">
                  <div className="w-4 h-4 rounded border-2 border-[var(--border)] dark:border-[var(--border)]" />
                  <span>{item.text}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {assignment.links && assignment.links.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
            Resources & Links
          </h4>
          <div className="space-y-2">
            {assignment.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-[var(--background-elevated)] rounded-lg border border-[var(--border)] hover:border-[var(--ember-300)] hover:bg-[var(--ember-50)] dark:hover:bg-[var(--ember-900)/20] transition-all group"
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
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center">
        <p className="text-purple-600 dark:text-purple-400 font-medium flex items-center justify-center gap-2 text-sm">
          <Sparkle size={18} weight="fill" className="text-yellow-500" />
          This is how students see this assignment
        </p>
      </div>
    </div>
  );
}

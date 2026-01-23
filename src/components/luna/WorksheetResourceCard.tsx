'use client';

import { Files, ArrowSquareOut } from '@phosphor-icons/react';
import type { WorksheetResource } from '@/lib/resources/tavily';

interface WorksheetResourceCardProps {
  worksheet: WorksheetResource;
}

/**
 * Card component to display a worksheet/printable resource
 */
export function WorksheetResourceCard({ worksheet }: WorksheetResourceCardProps) {
  return (
    <a
      href={worksheet.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
    >
      <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
        <Files size={18} weight="duotone" className="text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-heading truncate group-hover:text-green-600 dark:group-hover:text-green-400">
          {worksheet.title}
        </p>
        <p className="text-xs text-muted truncate">
          {worksheet.source}
        </p>
      </div>
      <ArrowSquareOut size={14} className="text-muted group-hover:text-green-600 flex-shrink-0" />
    </a>
  );
}

interface WorksheetResourceListProps {
  worksheets: WorksheetResource[];
}

/**
 * List of worksheet resources
 */
export function WorksheetResourceList({ worksheets }: WorksheetResourceListProps) {
  if (!worksheets?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted font-medium uppercase tracking-wide">
        <Files size={14} weight="duotone" className="text-green-500" />
        <span>Worksheets & Printables</span>
      </div>
      <div className="space-y-1.5">
        {worksheets.map((worksheet, i) => (
          <WorksheetResourceCard key={i} worksheet={worksheet} />
        ))}
      </div>
    </div>
  );
}

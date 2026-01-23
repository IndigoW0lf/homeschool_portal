'use client';

import { cn } from '@/lib/utils';

interface LunaQuestionChipProps {
  question: string;
  onClick: () => void;
}

/**
 * Clickable question pill
 * 
 * When clicked, inserts the question into the input field.
 * Accessible: focusable, keyboard enter activates.
 */
export function LunaQuestionChip({ question, onClick }: LunaQuestionChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left text-sm px-3 py-2 rounded-lg",
        "bg-[var(--paper-100)] dark:bg-[var(--background-secondary)]",
        "hover:bg-[var(--fabric-lilac)]/10 dark:hover:bg-[var(--fabric-lilac)]/20",
        "border border-transparent hover:border-[var(--fabric-lilac)]/30",
        "text-heading dark:text-muted",
        "transition-all cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-[var(--fabric-lilac)]/50"
      )}
    >
      {question}
    </button>
  );
}

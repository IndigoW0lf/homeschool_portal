'use client';

import { Sparkle } from '@phosphor-icons/react';
import { useLuna } from './LunaContext';
import { ThinkContext } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

interface LunaTriggerButtonProps {
  context: ThinkContext;
  childProfileId?: string;
  lessonId?: string;
  weekStartDate?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

/**
 * Subtle button to open Luna panel
 * 
 * Placed in WeekView header, lesson detail, etc.
 * Opens panel with pre-configured context.
 */
export function LunaTriggerButton({
  context,
  childProfileId,
  lessonId,
  weekStartDate,
  label = 'Think with Luna',
  className,
  iconOnly = false,
}: LunaTriggerButtonProps) {
  const { openPanel } = useLuna();

  const handleClick = () => {
    openPanel({
      context,
      childProfileId,
      lessonId,
      weekStartDate,
    });
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "btn-ghost text-sm gap-1.5",
        iconOnly && "btn-icon",
        className
      )}
      aria-label={label}
      title={label}
    >
      <Sparkle size={18} weight="duotone" className="text-[var(--fabric-lilac)]" />
      {!iconOnly && <span className="text-muted">{label}</span>}
    </button>
  );
}

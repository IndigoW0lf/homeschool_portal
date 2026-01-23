'use client';

import { Bank, Wrench, Palette, CalendarBlank } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

interface ThemeCardProps {
  theme: string;
}

const themeColors: Record<string, { bg: string; text: string; Icon: Icon }> = {
  'Foundation Day': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-200',
    Icon: Bank,
  },
  'Skill Day': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-200',
    Icon: Wrench,
  },
  'Expression Day': {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-200',
    Icon: Palette,
  },
};

const defaultTheme = {
  bg: 'bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)]',
  text: 'text-heading dark:text-heading',
  Icon: CalendarBlank,
};

export function ThemeCard({ theme }: ThemeCardProps) {
  const themeStyle = themeColors[theme] || defaultTheme;

  return (
    <div className={`${themeStyle.bg} rounded-xl p-4 shadow-sm flex items-center gap-3`}>
      <themeStyle.Icon size={28} weight="duotone" className={themeStyle.text} />
      <div>
        <p className="text-sm text-muted">Today&apos;s Theme</p>
        <p className={`font-semibold ${themeStyle.text}`}>{theme}</p>
      </div>
    </div>
  );
}

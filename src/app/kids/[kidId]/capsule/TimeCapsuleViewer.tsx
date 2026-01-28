'use client';

import { useState } from 'react';
import { Sparkle, Calendar, ArrowLeft, ArrowRight, Tag } from '@phosphor-icons/react';
import { format, parseISO, subMonths, addMonths, subYears, addYears } from 'date-fns';
import Link from 'next/link';

interface JournalEntry {
  id: string;
  kid_id: string;
  date: string;
  prompt: string;
  response: string | null;
  mood: string | null;
  tags: string[] | null;
}

interface TimeCapsuleViewerProps {
  entries: JournalEntry[];
  kidName: string;
  kidId: string;
  periodLabel: string;
  entryCount: number;
  topMood?: string;
  topTags: string[];
  currentPeriod: 'month' | 'year';
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  thoughtful: '🤔',
  frustrated: '😤',
  sad: '😢',
};

const MOOD_LABELS: Record<string, string> = {
  happy: 'Happy',
  calm: 'Calm',
  thoughtful: 'Thoughtful',
  frustrated: 'Challenged',
  sad: 'Reflective',
};

export function TimeCapsuleViewer({
  entries,
  kidName,
  kidId,
  periodLabel,
  entryCount,
  topMood,
  topTags,
  currentPeriod,
}: TimeCapsuleViewerProps) {
  const [showAllEntries, setShowAllEntries] = useState(false);

  // Get a random highlight entry
  const highlightEntry = entries.length > 0 
    ? entries[Math.floor(Math.random() * entries.length)]
    : null;

  // Navigation helpers
  const now = new Date();
  const currentDateParam = currentPeriod === 'year' 
    ? periodLabel 
    : format(parseISO(periodLabel.includes(',') ? '2024-01-01' : `${periodLabel.split(' ')[1]}-${format(parseISO(`2024-${periodLabel.split(' ')[0]}-01`), 'MM')}`), 'yyyy-MM');

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          No memories from {periodLabel}
        </h3>
        <p className="text-muted mb-6">
          Keep writing in your journal to fill this time capsule!
        </p>
        <Link
          href={`/kids/${kidId}/journal`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--nebula-purple)] text-[var(--foreground)] rounded-lg hover:bg-[var(--nebula-purple)]"
        >
          View My Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Period Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button className="p-2 rounded-lg bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] hover:bg-[var(--moon-200)] dark:hover:bg-[var(--background-secondary)]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <Link
            href={`/kids/${kidId}/capsule?period=month`}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPeriod === 'month'
                ? 'bg-amber-500 text-[var(--foreground)]'
                : 'bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] hover:bg-[var(--moon-200)]'
            }`}
          >
            Monthly
          </Link>
          <Link
            href={`/kids/${kidId}/capsule?period=year`}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPeriod === 'year'
                ? 'bg-amber-500 text-[var(--foreground)]'
                : 'bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] hover:bg-gray-200'
            }`}
          >
            Yearly
          </Link>
        </div>
        <button className="p-2 rounded-lg bg-[var(--background-secondary)] dark:bg-[var(--background-elevated)] hover:bg-[var(--moon-200)] dark:hover:bg-[var(--background-secondary)]">
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 mb-4">
          <Sparkle size={20} weight="fill" className="text-amber-500" />
          <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">
            Your {periodLabel} Memories
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Entries count */}
          <div className="text-center p-4 bg-[var(--background-elevated)]/50 dark:bg-[var(--background-elevated)]/50 rounded-lg">
            <div className="text-3xl font-bold text-amber-600">{entryCount}</div>
            <div className="text-sm text-muted">Entries</div>
          </div>

          {/* Top mood */}
          <div className="text-center p-4 bg-[var(--background-elevated)]/50 dark:bg-[var(--background-elevated)]/50 rounded-lg">
            <div className="text-3xl">{topMood ? MOOD_EMOJIS[topMood] : '—'}</div>
            <div className="text-sm text-muted">
              {topMood ? MOOD_LABELS[topMood] : 'No mood data'}
            </div>
          </div>

          {/* Top theme */}
          <div className="text-center p-4 bg-[var(--background-elevated)]/50 dark:bg-[var(--background-elevated)]/50 rounded-lg">
            <div className="text-xl font-medium text-amber-600 capitalize">
              {topTags[0] || '—'}
            </div>
            <div className="text-sm text-muted">Top Theme</div>
          </div>
        </div>

        {/* AI Message */}
        <div className="p-4 bg-[var(--background-elevated)] rounded-lg border border-amber-100 dark:border-amber-800">
          <p className="text-[var(--foreground)] italic">
            "Dear {kidName}, in {periodLabel} you wrote {entryCount} journal {entryCount === 1 ? 'entry' : 'entries'}
            {topMood && ` and felt mostly ${MOOD_LABELS[topMood].toLowerCase()}`}
            {topTags.length > 0 && `. You thought a lot about ${topTags.join(', ')}`}. 
            Keep filling your journal with your thoughts and memories! ✨"
          </p>
        </div>
      </div>

      {/* Highlight Entry */}
      {highlightEntry && (
        <div className="p-6 bg-[var(--background-elevated)] rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💫</span>
            <h3 className="font-semibold text-[var(--foreground)]">Memory Highlight</h3>
            <span className="text-sm text-muted">
              {format(parseISO(highlightEntry.date), 'MMMM d')}
            </span>
          </div>
          <p className="text-sm text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] mb-2 italic">
            "{highlightEntry.prompt}"
          </p>
          <p className="text-[var(--foreground)]">
            {highlightEntry.response}
          </p>
        </div>
      )}

      {/* Tags Cloud */}
      {topTags.length > 0 && (
        <div className="p-4 bg-[var(--background-elevated)] rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-muted" />
            <h3 className="font-semibold text-[var(--foreground)]">Themes from {periodLabel}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {topTags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* All Entries */}
      <div>
        <button
          onClick={() => setShowAllEntries(!showAllEntries)}
          className="w-full py-3 text-center text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] hover:underline"
        >
          {showAllEntries ? 'Hide all entries' : `View all ${entryCount} entries`}
        </button>

        {showAllEntries && (
          <div className="space-y-4 mt-4">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="p-4 bg-[var(--background-elevated)] rounded-lg border border-[var(--border)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted">
                    {format(parseISO(entry.date), 'EEEE, MMMM d')}
                  </span>
                  {entry.mood && (
                    <span className="text-xl">{MOOD_EMOJIS[entry.mood]}</span>
                  )}
                </div>
                <p className="text-sm text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] mb-2 italic">
                  "{entry.prompt}"
                </p>
                <p className="text-[var(--foreground)]">{entry.response}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link to full journal */}
      <div className="text-center">
        <Link
          href={`/kids/${kidId}/journal`}
          className="inline-flex items-center gap-2 text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] hover:underline"
        >
          <Calendar size={16} />
          View full journal
        </Link>
      </div>
    </div>
  );
}

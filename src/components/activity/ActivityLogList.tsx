'use client';

import { useState } from 'react';
import { Trash, PencilSimple, Clock, Calendar, BookOpen } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';

interface ActivityLogEntry {
  id: string;
  kidId: string;
  date: string;
  subject: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  source: string;
}

interface Kid {
  id: string;
  name: string;
}

interface ActivityLogListProps {
  entries: ActivityLogEntry[];
  kids: Kid[];
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (entry: ActivityLogEntry) => void;
  showKidName?: boolean;
}

// Subject to color mapping
const subjectColors: Record<string, string> = {
  'Math': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Reading': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Writing': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Language Arts': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Science': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Social Studies': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'History': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Art': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Music': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'PE': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Life Skills': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Foreign Language': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Technology': 'bg-[var(--background-secondary)] text-heading dark:bg-[var(--background-secondary)]/50 dark:text-muted',
  'Field Trip': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Other': 'bg-[var(--background-secondary)] text-heading dark:bg-[var(--background-secondary)]/50 dark:text-muted',
};

function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function ActivityLogList({ 
  entries, 
  kids, 
  onDelete, 
  onEdit,
  showKidName = false 
}: ActivityLogListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        <BookOpen size={48} className="mx-auto mb-2 opacity-30" />
        <p>No activities logged yet.</p>
        <p className="text-sm">Click "Log an Activity" to get started!</p>
      </div>
    );
  }

  // Group entries by date
  const entriesByDate: Record<string, ActivityLogEntry[]> = {};
  for (const entry of entries) {
    if (!entriesByDate[entry.date]) {
      entriesByDate[entry.date] = [];
    }
    entriesByDate[entry.date].push(entry);
  }

  const kidMap = Object.fromEntries(kids.map(k => [k.id, k.name]));

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(entriesByDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dateEntries]) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-muted" />
              <span className="text-sm font-medium text-muted">
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="text-xs text-muted">
                ({dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'})
              </span>
            </div>

            {/* Entries for this date */}
            <div className="space-y-2">
              {dateEntries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 bg-[var(--background-elevated)] rounded-lg border border-[var(--border)] hover:border-[var(--border)] dark:hover:border-[var(--border)] transition-colors group"
                >
                  {/* Subject badge */}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${subjectColors[entry.subject] || subjectColors['Other']}`}>
                    {entry.subject}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-heading dark:text-white font-medium">
                          {entry.title}
                        </p>
                        {entry.description && (
                          <p className="text-sm text-muted mt-0.5">
                            {entry.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(entry)}
                            className="p-1.5 text-muted hover:text-blue-500 rounded"
                            title="Edit"
                          >
                            <PencilSimple size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="p-1.5 text-muted hover:text-red-500 rounded disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                      {entry.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(entry.durationMinutes)}
                        </span>
                      )}
                      {showKidName && kidMap[entry.kidId] && (
                        <span>• {kidMap[entry.kidId]}</span>
                      )}
                      {entry.source !== 'manual' && (
                        <span className="text-indigo-400">• via {entry.source}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

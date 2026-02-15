import Link from 'next/link';
import { format } from 'date-fns';
import type { TodayKidSummary } from '@/lib/supabase/data';
import { cn } from '@/lib/utils';

interface TodaySectionProps {
  summaries: TodayKidSummary[];
  todayLabel: string;
}

export function TodaySection({ summaries, todayLabel }: TodaySectionProps) {
  if (summaries.length === 0) return null;

  const gridCols = summaries.length === 1 ? 'lg:grid-cols-1' : summaries.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-2 xl:grid-cols-3';

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
        Today
      </h2>
      <div className={cn('grid grid-cols-1 gap-4', gridCols)}>
        {summaries.map((s) => (
          <TodayKidTile key={s.kidId} summary={s} todayLabel={todayLabel} />
        ))}
      </div>
    </section>
  );
}

function TodayKidTile({ summary, todayLabel }: { summary: TodayKidSummary; todayLabel: string }) {
  const completedToday = summary.todayItems.filter((i) => i.status === 'completed').length;
  const totalToday = summary.todayItems.length;

  return (
    <div className="bg-[var(--night-700)] rounded-xl border border-[var(--night-600)] overflow-hidden shadow-lg">
      <div className="p-4 border-b border-[var(--night-600)] flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--foreground)]">{summary.kidName}</h3>
          <p className="text-xs text-[var(--muted)]">{todayLabel}</p>
        </div>
        <Link
          href={`/kids/${summary.kidId}`}
          className="text-sm text-[var(--nebula-pink)] hover:underline"
        >
          Open their view →
        </Link>
      </div>
      <div className="p-4 space-y-4">
        {/* Today's list */}
        <div>
          <p className="text-xs font-medium text-[var(--muted)] mb-2">
            Today&apos;s tasks ({completedToday}/{totalToday})
          </p>
          {summary.todayItems.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nothing scheduled</p>
          ) : (
            <ul className="space-y-1">
              {summary.todayItems.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    'text-sm flex items-center gap-2',
                    item.status === 'completed' ? 'text-[var(--muted)] line-through' : 'text-[var(--foreground)]'
                  )}
                >
                  <span className={item.status === 'completed' ? 'text-green-500' : ''}>
                    {item.status === 'completed' ? '✓' : '○'}
                  </span>
                  {item.title}
                </li>
              ))}
              {summary.todayItems.length > 6 && (
                <li className="text-xs text-[var(--muted)]">
                  +{summary.todayItems.length - 6} more
                </li>
              )}
            </ul>
          )}
        </div>

        {/* This week */}
        <div className="pt-2 border-t border-[var(--night-600)]">
          <p className="text-xs font-medium text-[var(--muted)] mb-1">This week</p>
          <p className="text-sm text-[var(--foreground)]">
            {summary.thisWeekCompleted} completed · {summary.thisWeekMoons} moons
          </p>
        </div>

        {/* Recent activity */}
        {summary.recentCompletions.length > 0 && (
          <div className="pt-2 border-t border-[var(--night-600)]">
            <p className="text-xs font-medium text-[var(--muted)] mb-1">Recent</p>
            <ul className="space-y-0.5">
              {summary.recentCompletions.slice(0, 3).map((r, i) => (
                <li key={i} className="text-sm text-[var(--foreground)] truncate">
                  {r.title} · {format(new Date(r.date), 'MMM d')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

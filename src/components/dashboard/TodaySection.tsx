import Link from 'next/link';
import { format } from 'date-fns';
import { ListChecks, ChartBar, ClockCounterClockwise, ArrowRight } from '@phosphor-icons/react/dist/ssr';
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
      <h2 className="heading-md text-[var(--foreground)] mb-3">
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
      {/* Header: name, date, link */}
      <div className="p-4 border-b border-[var(--night-600)] flex items-center justify-between gap-3">
        <div>
          <h3 className="heading-sm text-[var(--foreground)]">{summary.kidName}</h3>
          <p className="text-sm text-[var(--muted)] mt-0.5">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/parent?student=${summary.kidId}`}
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
          >
            View week
          </Link>
          <Link
            href={`/kids/${summary.kidId}`}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--nebula-pink)] hover:underline"
          >
            Open their view
            <ArrowRight size={16} weight="bold" aria-hidden />
          </Link>
        </div>
      </div>
      {/* Two columns: Today's tasks | This week + Recent */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Today's tasks */}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
            <ListChecks size={14} weight="duotone" className="text-[var(--celestial-400)]" aria-hidden />
            Today&apos;s tasks ({completedToday}/{totalToday})
          </p>
          {summary.todayItems.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nothing scheduled</p>
          ) : (
            <ul className="space-y-1">
              {summary.todayItems.slice(0, 5).map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    'text-sm flex items-center gap-2 truncate',
                    item.status === 'completed' ? 'text-[var(--muted)] line-through' : 'text-[var(--foreground)]'
                  )}
                >
                  <span className={item.status === 'completed' ? 'text-green-500 shrink-0' : 'shrink-0'}>
                    {item.status === 'completed' ? '✓' : '○'}
                  </span>
                  <span className="truncate">{item.title}</span>
                </li>
              ))}
              {summary.todayItems.length > 5 && (
                <li className="text-xs text-[var(--muted)]">
                  +{summary.todayItems.length - 5} more
                </li>
              )}
            </ul>
          )}
        </div>
        {/* Right: This week + Recent */}
        <div className="min-w-0 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center gap-2">
              <ChartBar size={14} weight="duotone" className="text-[var(--ember-500)]" aria-hidden />
              This week
            </p>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {summary.thisWeekCompleted} completed · {summary.thisWeekMoons} moons
            </p>
          </div>
          {summary.recentCompletions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center gap-2">
                <ClockCounterClockwise size={14} weight="duotone" className="text-[var(--nebula-purple)]" aria-hidden />
                Recent
              </p>
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
    </div>
  );
}

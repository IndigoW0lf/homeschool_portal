'use client';

import { useState, useEffect } from 'react';
import { Clock, BookOpen, Palette, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/browser';

interface HoursSummary {
  subject: string;
  is_core: boolean;
  total_minutes: number;
  total_hours: number;
  entry_count: number;
}

interface HoursTotals {
  core_minutes: number;
  core_hours: number;
  noncore_minutes: number;
  noncore_hours: number;
  total_minutes: number;
  total_hours: number;
  entry_count: number;
}

interface HoursTrackerProps {
  kidId: string;
  kidName: string;
  yearStart?: string; // YYYY-MM-DD, defaults to current school year
  yearEnd?: string;
  coreGoal?: number; // Default 600
  noncoreGoal?: number; // Default 400
}

export function HoursTracker({
  kidId,
  kidName: _kidName, // Currently unused but available for future use
  yearStart,
  yearEnd,
  coreGoal = 600,
  noncoreGoal = 400,
}: HoursTrackerProps) {
  const [totals, setTotals] = useState<HoursTotals | null>(null);
  const [breakdown, setBreakdown] = useState<HoursSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Default to current school year (July 1 - June 30)
  const getDefaultDates = () => {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return {
      start: yearStart || `${year}-07-01`,
      end: yearEnd || `${year + 1}-06-30`,
    };
  };

  const dates = getDefaultDates();
  const totalGoal = coreGoal + noncoreGoal;

  useEffect(() => {
    async function fetchHours() {
      setLoading(true);

      try {
        // Fetch totals
        const { data: totalsData, error: totalsError } = await supabase
          .rpc('get_hours_totals', {
            p_kid_id: kidId,
            p_start_date: dates.start,
            p_end_date: dates.end,
          });

        if (totalsError) {
          console.error('Error fetching hours totals:', totalsError);
        } else if (totalsData && totalsData.length > 0) {
          setTotals(totalsData[0]);
        }

        // Fetch breakdown
        const { data: breakdownData, error: breakdownError } = await supabase
          .rpc('get_hours_summary', {
            p_kid_id: kidId,
            p_start_date: dates.start,
            p_end_date: dates.end,
          });

        if (breakdownError) {
          console.error('Error fetching hours breakdown:', breakdownError);
        } else if (breakdownData) {
          setBreakdown(breakdownData);
        }
      } catch (err) {
        console.error('Error fetching hours:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHours();
  }, [kidId, dates.start, dates.end]);

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-[var(--background-secondary)] rounded w-1/3 mb-4" />
        <div className="h-4 bg-[var(--background-secondary)] rounded w-full mb-2" />
        <div className="h-4 bg-[var(--background-secondary)] rounded w-2/3" />
      </div>
    );
  }

  const coreHours = totals?.core_hours || 0;
  const noncoreHours = totals?.noncore_hours || 0;
  const totalHours = totals?.total_hours || 0;

  const corePercent = Math.min((coreHours / coreGoal) * 100, 100);
  const noncorePercent = Math.min((noncoreHours / noncoreGoal) * 100, 100);
  const totalPercent = Math.min((totalHours / totalGoal) * 100, 100);

  // Separate core and non-core subjects for the breakdown
  const coreSubjects = breakdown.filter((s) => s.is_core);
  const noncoreSubjects = breakdown.filter((s) => !s.is_core);

  return (
    <div className="card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="font-semibold">School Hours</h3>
        </div>
        <span className="text-xs text-muted">
          {dates.start.slice(0, 4)}-{dates.end.slice(0, 4)} School Year
        </span>
      </div>

      {/* Total Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Total Progress</span>
          <span className="text-muted">
            {totalHours} / {totalGoal} hrs ({totalPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="h-4 bg-[var(--background-secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${totalPercent}%` }}
          />
        </div>
      </div>

      {/* Core vs Non-Core */}
      <div className="grid grid-cols-2 gap-4">
        {/* Core */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Core</span>
          </div>
          <div className="h-3 bg-[var(--background-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${corePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {coreHours} / {coreGoal} hrs
          </p>
        </div>

        {/* Non-Core */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Non-Core</span>
          </div>
          <div className="h-3 bg-[var(--background-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${noncorePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {noncoreHours} / {noncoreGoal} hrs
          </p>
        </div>
      </div>

      {/* Subject Breakdown Toggle */}
      {breakdown.length > 0 && (
        <div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
          >
            {showBreakdown ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide subject breakdown
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show subject breakdown
              </>
            )}
          </button>

          {showBreakdown && (
            <div className="mt-4 space-y-4">
              {/* Core Subjects */}
              {coreSubjects.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted uppercase mb-2">
                    Core Subjects
                  </h4>
                  <div className="space-y-2">
                    {coreSubjects.map((subject) => (
                      <div
                        key={subject.subject}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{subject.subject}</span>
                        <span className="text-muted">
                          {subject.total_hours} hrs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Non-Core Subjects */}
              {noncoreSubjects.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted uppercase mb-2">
                    Non-Core Subjects
                  </h4>
                  <div className="space-y-2">
                    {noncoreSubjects.map((subject) => (
                      <div
                        key={subject.subject}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{subject.subject}</span>
                        <span className="text-muted">
                          {subject.total_hours} hrs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && totalHours === 0 && (
        <div className="text-center py-4">
          <TrendingUp className="w-8 h-8 mx-auto text-muted mb-2" />
          <p className="text-sm text-muted">
            No hours logged yet. Complete assignments and log time to track progress!
          </p>
        </div>
      )}
    </div>
  );
}

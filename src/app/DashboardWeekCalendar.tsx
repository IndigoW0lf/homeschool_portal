'use client';

import { CalendarEntry } from '@/types';
import { WeekCalendar } from '@/components';

interface DashboardWeekCalendarProps {
  entries: CalendarEntry[];
}

export function DashboardWeekCalendar({ entries }: DashboardWeekCalendarProps) {
  return <WeekCalendar entries={entries} />;
}

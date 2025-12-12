'use client';

import { CalendarEntry } from '@/types';
import { WeekCalendar } from '@/components';

interface KidPortalWeekCalendarProps {
  entries: CalendarEntry[];
}

export function KidPortalWeekCalendar({ entries }: KidPortalWeekCalendarProps) {
  return <WeekCalendar entries={entries} />;
}

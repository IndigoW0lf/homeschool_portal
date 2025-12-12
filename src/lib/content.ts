// Data access layer for content
// In Phase 2, this can be swapped to Supabase while keeping the same interface

import { Kid, Quote, Resources, Lesson, CalendarEntry } from '@/types';
import kidsData from '../../content/kids.json';
import quotesData from '../../content/quotes.json';
import resourcesData from '../../content/resources.json';
import lessonsData from '../../content/lessons.json';
import calendarData from '../../content/calendar.json';

// Kids
export function getKids(): Kid[] {
  return kidsData as Kid[];
}

export function getKidById(id: string): Kid | undefined {
  return getKids().find(kid => kid.id === id);
}

// Quotes
export function getQuotes(): Quote[] {
  return quotesData as Quote[];
}

// Get a deterministic daily quote based on the date
export function getDailyQuote(date: Date = new Date()): Quote {
  const quotes = getQuotes();
  // Use the date as seed for deterministic selection
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % quotes.length;
  return quotes[index];
}

// Resources
export function getResources(): Resources {
  return resourcesData as Resources;
}

// Lessons
export function getLessons(): Lesson[] {
  return lessonsData as Lesson[];
}

export function getLessonById(id: string): Lesson | undefined {
  return getLessons().find(lesson => lesson.id === id);
}

export function getLessonsByIds(ids: string[]): Lesson[] {
  return ids.map(id => getLessonById(id)).filter((lesson): lesson is Lesson => lesson !== undefined);
}

// Calendar
export function getCalendarEntries(): CalendarEntry[] {
  return calendarData as CalendarEntry[];
}

export function getCalendarEntryByDate(dateString: string): CalendarEntry | undefined {
  return getCalendarEntries().find(entry => entry.date === dateString);
}

export function getCalendarEntriesForKid(kidId: string): CalendarEntry[] {
  return getCalendarEntries().filter(entry => entry.kidIds.includes(kidId));
}

export function getCalendarEntriesForDateRange(startDate: Date, endDate: Date): CalendarEntry[] {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  return getCalendarEntries().filter(entry => entry.date >= start && entry.date <= end);
}

export function getTodayEntry(kidId: string, date: Date = new Date()): CalendarEntry | undefined {
  const dateString = date.toISOString().split('T')[0];
  return getCalendarEntries().find(
    entry => entry.date === dateString && entry.kidIds.includes(kidId)
  );
}

export function getWeekEntries(kidId: string, date: Date = new Date()): CalendarEntry[] {
  // Get the start of the week (Monday)
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Get end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return getCalendarEntriesForKid(kidId).filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startOfWeek && entryDate <= endOfWeek;
  });
}

import { getWeekRange, formatDateString } from './dateUtils';
// In Phase 2, this can be swapped to Supabase while keeping the same interface

import { Kid, Quote, Resources, Lesson, CalendarEntry, AvatarAssets, StudioTemplates, ShopItems } from '@/types';
import kidsData from '../../content/kids.json';
import quotesData from '../../content/quotes.json';
import resourcesData from '../../content/resources.json';
import lessonsData from '../../content/lessons.json';
import calendarData from '../../content/calendar.json';
import avatarAssetsData from '../../content/avatar-assets.json';
import studioTemplatesData from '../../content/studio-templates.json';
import shopItemsData from '../../content/shop-items.json';

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
  // Calculate day of year: days since January 1st
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86400000
  ) + 1;
  const index = dayOfYear % quotes.length;
  return quotes[index];
}

// Resources
export function getResources(): Resources {
  return resourcesData as Resources;
}

export function getMiAcademyResource(): { label: string; url: string } | null {
  const resources = getResources();
  const reading = resources.reading || [];
  // Find item with pinnedToday: true or label containing "MiAcademy"
  const miacademy = reading.find(r => r.pinnedToday || r.label.toLowerCase().includes('miacademy'));
  return miacademy ? { label: miacademy.label, url: miacademy.url } : null;
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
  const start = formatDateString(startDate);
  const end = formatDateString(endDate);
  return getCalendarEntries().filter(entry => entry.date >= start && entry.date <= end);
}

export function getTodayEntry(kidId: string, date: Date = new Date()): CalendarEntry | undefined {
  const dateString = formatDateString(date);
  return getCalendarEntries().find(
    entry => entry.date === dateString && entry.kidIds.includes(kidId)
  );
}

export function getWeekEntries(kidId: string, date: Date = new Date()): CalendarEntry[] {
  const { start, end } = getWeekRange(date);

  return getCalendarEntriesForKid(kidId).filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= start && entryDate <= end;
  });
}

// Avatar Assets
export function getAvatarAssets(): AvatarAssets {
  return avatarAssetsData as AvatarAssets;
}

// Studio Templates
export function getStudioTemplates(): StudioTemplates {
  return studioTemplatesData as StudioTemplates;
}

// Shop Items
export function getShopItems(): ShopItems {
  return shopItemsData as ShopItems;
}

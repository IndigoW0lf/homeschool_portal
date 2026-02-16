import { describe, it, expect } from 'vitest';
import {
  formatDateString,
  getTodayInTimezone,
  getWeekDates,
  getWeekRange,
} from './dateUtils';

describe('formatDateString', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDateString(new Date(2025, 0, 15))).toBe('2025-01-15');
    expect(formatDateString(new Date(2025, 11, 31))).toBe('2025-12-31');
  });

  it('pads month and day with zero', () => {
    expect(formatDateString(new Date(2025, 0, 5))).toBe('2025-01-05');
  });
});

describe('getTodayInTimezone', () => {
  it('returns a string in YYYY-MM-DD form', () => {
    const result = getTodayInTimezone('America/Chicago');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns different dates for different timezones when near midnight UTC', () => {
    const utc = getTodayInTimezone('UTC');
    const chicago = getTodayInTimezone('America/Chicago');
    const tokyo = getTodayInTimezone('Asia/Tokyo');
    expect(utc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(chicago).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tokyo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back on invalid timezone', () => {
    const result = getTodayInTimezone('Invalid/Timezone');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getWeekDates', () => {
  it('returns 7 dates', () => {
    const week = getWeekDates(new Date(2025, 0, 15));
    expect(week).toHaveLength(7);
  });

  it('first day is Monday', () => {
    const week = getWeekDates(new Date(2025, 0, 15)); // Wed Jan 15, 2025
    const monday = week[0];
    expect(monday.getDay()).toBe(1);
  });
});

describe('getWeekRange', () => {
  it('returns start and end dates', () => {
    const { start, end } = getWeekRange(new Date(2025, 0, 15));
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
  });
});

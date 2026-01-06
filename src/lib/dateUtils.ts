// Shared date utilities

/**
 * Get an array of dates for the week containing the given date (Monday to Sunday)
 */
export function getWeekDates(date: Date = new Date()): Date[] {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  // Adjust to Monday (day 1). If Sunday (day 0), go back 6 days
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    week.push(d);
  }
  return week;
}

/**
 * Format a date to ISO date string (YYYY-MM-DD) using local timezone
 * This ensures dates match correctly regardless of UTC offset
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the start and end dates of the week containing the given date
 */
export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const weekDates = getWeekDates(date);
  return {
    start: weekDates[0],
    end: weekDates[6],
  };
}

/**
 * Get today's date string (YYYY-MM-DD) in a specific timezone
 * This prevents the server (running in UTC) from showing tomorrow's date
 * for users in timezones behind UTC (like CST = UTC-6)
 */
export function getTodayInTimezone(timezone: string = 'America/Chicago'): string {
  try {
    const now = new Date();
    // Format the date in the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // Returns YYYY-MM-DD
  } catch {
    // Fallback to UTC-based date (shouldn't happen)
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Get a Date object representing "now" in a specific timezone
 */
export function getNowInTimezone(timezone: string = 'America/Chicago'): Date {
  const dateStr = getTodayInTimezone(timezone);
  // Create date at noon to avoid any edge cases
  return new Date(dateStr + 'T12:00:00');
}

/**
 * Format a Date for display in a specific timezone
 */
export function formatDateInTimezone(
  date: Date, 
  timezone: string = 'America/Chicago',
  options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
): string {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: timezone }).format(date);
}


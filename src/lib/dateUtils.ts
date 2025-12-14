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

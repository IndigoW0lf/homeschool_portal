// localStorage utilities for done state persistence
// Key format: `homeschool_done::${kidId}::${date}::${lessonId}`

const STORAGE_PREFIX = 'homeschool_done';

export function getDoneKey(kidId: string, date: string, lessonId: string): string {
  return `${STORAGE_PREFIX}::${kidId}::${date}::${lessonId}`;
}

export function isDone(kidId: string, date: string, lessonId: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = getDoneKey(kidId, date, lessonId);
  const value = localStorage.getItem(key);
  return value === 'true';
}

export function setDone(kidId: string, date: string, lessonId: string, done: boolean): void {
  if (typeof window === 'undefined') return;
  const key = getDoneKey(kidId, date, lessonId);
  if (done) {
    localStorage.setItem(key, 'true');
  } else {
    localStorage.removeItem(key);
  }
}

export function toggleDone(kidId: string, date: string, lessonId: string): boolean {
  const currentState = isDone(kidId, date, lessonId);
  const newState = !currentState;
  setDone(kidId, date, lessonId, newState);
  return newState;
}

export function getDoneCount(kidId: string, date: string, lessonIds: string[]): number {
  if (typeof window === 'undefined') return 0;
  return lessonIds.filter(lessonId => isDone(kidId, date, lessonId)).length;
}

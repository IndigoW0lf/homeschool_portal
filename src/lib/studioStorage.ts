// localStorage utilities for studio state persistence
// Key format: `homeschool_studio::${kidId}`

import { StudioState } from '@/types';

const STORAGE_PREFIX = 'homeschool_studio';

export function getStudioKey(kidId: string): string {
  return `${STORAGE_PREFIX}::${kidId}`;
}

export function getStudioState(kidId: string): StudioState | null {
  if (typeof window === 'undefined') return null;
  const key = getStudioKey(kidId);
  const value = localStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as StudioState;
  } catch {
    return null;
  }
}

export function setStudioState(kidId: string, state: StudioState): void {
  if (typeof window === 'undefined') return;
  const key = getStudioKey(kidId);
  localStorage.setItem(key, JSON.stringify(state));
}

export function getDefaultStudioState(): StudioState {
  return {
    selectedTemplate: 'shirt',
    colors: {
      primary: '--fabric-blue',
      secondary: '--fabric-gold',
    },
  };
}








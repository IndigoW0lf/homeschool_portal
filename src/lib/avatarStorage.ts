// localStorage utilities for avatar state persistence
// Key format: `homeschool_avatar::${kidId}`

import { AvatarState } from '@/types';

const STORAGE_PREFIX = 'homeschool_avatar';

export function getAvatarKey(kidId: string): string {
  return `${STORAGE_PREFIX}::${kidId}`;
}

export function getAvatarState(kidId: string): AvatarState | null {
  if (typeof window === 'undefined') return null;
  const key = getAvatarKey(kidId);
  const value = localStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as AvatarState;
  } catch {
    return null;
  }
}

export function setAvatarState(kidId: string, state: AvatarState): void {
  if (typeof window === 'undefined') return;
  const key = getAvatarKey(kidId);
  localStorage.setItem(key, JSON.stringify(state));
}

export function getDefaultAvatarState(): AvatarState {
  return {
    base: 'base-01',
    outfit: 'shirt-01',
    colors: {
      shirt: '--fabric-blue',
      pants: '--fabric-green',
    },
  };
}








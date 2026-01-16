// localStorage utilities for avatar state persistence
// Key format: `homeschool_avatar::${kidId}`
// Now also syncs to database for cross-device persistence

import { AvatarState } from '@/types';
import { supabase } from '@/lib/supabase/browser';

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

/**
 * Save avatar state to database for cross-device persistence
 */
export async function saveAvatarToDatabase(kidId: string, state: AvatarState): Promise<void> {
  const { error } = await supabase
    .from('kids')
    .update({ avatar_state: state })
    .eq('id', kidId);

  if (error) {
    console.error('Error saving avatar to database:', error);
    throw error;
  }
}

/**
 * Hydrate avatar state from database to localStorage
 * Call this on kid portal page load
 */
export async function hydrateAvatarState(kidId: string): Promise<AvatarState | null> {
  if (typeof window === 'undefined') return null;
  
  const { data: kid } = await supabase
    .from('kids')
    .select('avatar_state')
    .eq('id', kidId)
    .single();
  
  if (kid?.avatar_state) {
    const state = kid.avatar_state as AvatarState;
    setAvatarState(kidId, state);
    return state;
  }
  
  return null;
}


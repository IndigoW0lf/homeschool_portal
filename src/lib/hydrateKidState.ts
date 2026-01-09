// Unified hydration utility for kid state
// Syncs all localStorage state from database on page load

import { hydrateAllProgressState } from './progressState';
import { hydrateAvatarState } from './avatarStorage';
import { hydrateDoneState } from './storage';

interface HydrationItem {
  date: string;
  itemId: string | null;
  status: string;
}

/**
 * Hydrate ALL kid state from database to localStorage
 * Call this once when the kid portal loads
 */
export async function hydrateKidState(
  kidId: string,
  date: string,
  scheduleItems?: HydrationItem[]
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const hydrationPromises: Promise<unknown>[] = [
    hydrateAllProgressState(kidId, date),
    hydrateAvatarState(kidId)
  ];
  
  // Hydrate completion state if schedule items provided
  if (scheduleItems && scheduleItems.length > 0) {
    hydrateDoneState(kidId, scheduleItems);
  }
  
  await Promise.all(hydrationPromises);
  
  console.log(`✅ Fully hydrated state for kid ${kidId}`);
}

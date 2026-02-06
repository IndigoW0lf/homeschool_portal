'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';
import { revalidatePath } from 'next/cache';

/**
 * Updates a schedule item's completion status.
 * Supports Kid Session (via Service Role) and Parent (via RLS).
 */
export async function setScheduleItemDoneAction(
  scheduleItemId: string,
  done: boolean
) {
  try {
     // Use the centralized mutation which handles auth (Parent vs Kid) AND awards stars/moons
     const { toggleScheduleItemComplete } = await import('@/lib/supabase/mutations');
     
     await toggleScheduleItemComplete(scheduleItemId, done);
     
     revalidatePath('/kids/[kidId]'); 
     return { success: true };

  } catch (error) {
    console.error('Update schedule item failed:', error);
    return { success: false, error: 'Failed to update item' };
  }
}

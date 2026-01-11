'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Update the actual time spent on a schedule item
 */
export async function updateActivityTime(scheduleItemId: string, actualMinutes: number) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('schedule_items')
    .update({ actual_minutes: actualMinutes })
    .eq('id', scheduleItemId)
    .select('id, actual_minutes')
    .single();
  
  if (error) {
    console.error('Error updating activity time:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/parent/progress');
  return { success: true, data };
}

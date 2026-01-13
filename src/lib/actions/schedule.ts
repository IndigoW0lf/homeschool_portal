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
    const kidSession = await getKidSession();
    const { createServerClient } = await import('@/lib/supabase/server');
    
    // Check if Parent (Standard Auth)
    // We try standard auth first. If it works, great.
    // If not, we check for Kid Session.
    
    const status = done ? 'completed' : 'pending';
    const completed_at = done ? new Date().toISOString() : null;
    
    // Check if user is logged in as parent
    const supabaseStandard = await createServerClient();
    const { data: { user } } = await supabaseStandard.auth.getUser();
    
    if (user) {
        // Parent: Use standard RLS
        const { error } = await supabaseStandard
           .from('schedule_items')
           .update({ status, completed_at })
           .eq('id', scheduleItemId);
           
        if (error) throw error;
        
        revalidatePath('/kids/[kidId]'); 
        return { success: true };
    }
    
    // Not parent? Check Kid Session
    if (kidSession) {
       // Kid: Use Service Role, but verify ownership
       const supabaseService = await createServiceRoleClient();
       
       // Verify item belongs to this kid
       // (We can do this in the update query by adding .eq('student_id', kidId))
       const { error, count } = await supabaseService
         .from('schedule_items')
         .update({ status, completed_at })
         .eq('id', scheduleItemId)
         .eq('student_id', kidSession.kidId) // CRITICAL SECURITY CHECK
         .select('id');
         
       if (error) throw error;
       
       if (count === 0) {
          // If no rows updated, either item doesn't exist OR it belongs to another kid
          return { success: false, error: 'Unauthorized or Item Not Found' };
       }
       
       // Revalidate pages (Kid Portal path is tricky as it has dynamic ID, but we can try generic)
       // Or rely on client refresh.
       revalidatePath(`/kids/${kidSession.kidId}`);
       return { success: true };
    }

    return { success: false, error: 'Unauthorized' };

  } catch (error) {
    console.error('Update schedule item failed:', error);
    return { success: false, error: 'Failed to update item' };
  }
}

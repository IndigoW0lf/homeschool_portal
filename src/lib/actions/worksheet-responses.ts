'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveWorksheetResponsesAction(
  kidId: string,
  assignmentId: string,
  responses: Record<string, string | string[] | null>
) {
  const supabase = await createServerClient();
  
  const { error } = await supabase
    .from('worksheet_responses')
    .upsert({
      kid_id: kidId,
      assignment_id: assignmentId,
      responses: responses,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'kid_id,assignment_id',
    });

  if (error) {
    console.error('Error saving worksheet responses:', error);
    throw new Error('Failed to save responses');
  }

  revalidatePath(`/kids/${kidId}`);
  return { success: true };
}

export async function getWorksheetResponsesAction(
  kidId: string,
  assignmentId: string
) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('worksheet_responses')
    .select('*')
    .eq('kid_id', kidId)
    .eq('assignment_id', assignmentId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is ok
    console.error('Error fetching responses:', error);
    return null;
  }

  return data;
}

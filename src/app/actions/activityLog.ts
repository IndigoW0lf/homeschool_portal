'use server';

import { revalidatePath } from 'next/cache';
import { 
  createActivityLogEntry, 
  updateActivityLogEntry, 
  deleteActivityLogEntry,
  getActivityLog,
  getActivityLogForKids,
  getActivityLogSummary
} from '@/lib/supabase/activityLog';

export async function logActivity(formData: {
  kidId: string;
  date: string;
  subject: string;
  title: string;
  description: string;
  durationMinutes: number;
}) {
  const result = await createActivityLogEntry({
    kidId: formData.kidId,
    date: formData.date,
    subject: formData.subject,
    title: formData.title,
    description: formData.description || undefined,
    durationMinutes: formData.durationMinutes || undefined,
    source: 'manual'
  });
  
  if (result.success) {
    revalidatePath('/parent/progress');
  }
  
  return result;
}

export async function editActivity(
  id: string,
  updates: {
    date?: string;
    subject?: string;
    title?: string;
    description?: string;
    durationMinutes?: number;
  }
) {
  const result = await updateActivityLogEntry(id, {
    date: updates.date,
    subject: updates.subject,
    title: updates.title,
    description: updates.description,
    durationMinutes: updates.durationMinutes
  });
  
  if (result.success) {
    revalidatePath('/parent/progress');
  }
  
  return result;
}

export async function removeActivity(id: string) {
  const result = await deleteActivityLogEntry(id);
  
  if (result.success) {
    revalidatePath('/parent/progress');
  }
  
  return result;
}

export async function fetchActivityLog(
  kidId: string,
  startDate?: string,
  endDate?: string
) {
  return getActivityLog(kidId, startDate, endDate);
}

export async function fetchActivityLogForKids(
  kidIds: string[],
  startDate?: string,
  endDate?: string
) {
  return getActivityLogForKids(kidIds, startDate, endDate);
}

export async function fetchActivityLogSummary(
  kidId: string,
  startDate?: string,
  endDate?: string
) {
  return getActivityLogSummary(kidId, startDate, endDate);
}

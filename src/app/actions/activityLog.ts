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

// Unified activity entry that can come from any source
export interface UnifiedActivityEntry {
  id: string;
  kidId: string;
  date: string;
  subject: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  source: 'manual' | 'imported' | 'in-app';
  grade?: number | null; // For imported curriculum with scores
}

/**
 * Fetch activities from all three sources combined:
 * - activity_log (manual entries)
 * - external_curriculum (imported CSV data)
 * - schedule_items (completed in-app work)
 */
export async function fetchUnifiedActivities(
  kidIds: string[],
  startDate?: string,
  endDate?: string
): Promise<UnifiedActivityEntry[]> {
  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = await createServerClient();

  const entries: UnifiedActivityEntry[] = [];

  // 1. Fetch manual activity log entries
  let activityLogQuery = supabase
    .from('activity_log')
    .select('*')
    .in('kid_id', kidIds)
    .order('date', { ascending: false });

  if (startDate) activityLogQuery = activityLogQuery.gte('date', startDate);
  if (endDate) activityLogQuery = activityLogQuery.lte('date', endDate);

  const { data: activityLogData } = await activityLogQuery;

  for (const row of activityLogData || []) {
    entries.push({
      id: row.id,
      kidId: row.kid_id,
      date: row.date,
      subject: row.subject,
      title: row.title,
      description: row.description,
      durationMinutes: row.duration_minutes,
      source: 'manual'
    });
  }

  // 2. Fetch imported external curriculum
  let externalQuery = supabase
    .from('external_curriculum')
    .select('*')
    .in('kid_id', kidIds)
    .order('date', { ascending: false });

  if (startDate) externalQuery = externalQuery.gte('date', startDate);
  if (endDate) externalQuery = externalQuery.lte('date', endDate);

  const { data: externalData } = await externalQuery;

  for (const row of externalData || []) {
    entries.push({
      id: row.id,
      kidId: row.kid_id,
      date: row.date,
      subject: row.subject || row.course || 'General',
      title: row.task_name,
      description: row.course ? `${row.source}: ${row.course}` : row.source,
      durationMinutes: null, // External imports don't have duration
      source: 'imported',
      grade: row.score
    });
  }

  // 3. Fetch completed schedule items
  let scheduleQuery = supabase
    .from('schedule_items')
    .select(`
      id, 
      student_id, 
      date, 
      status,
      lesson:lessons(id, title, type),
      assignment:assignment_items(id, title, type),
      resource:resources(id, name, category)
    `)
    .in('student_id', kidIds)
    .eq('status', 'completed')
    .order('date', { ascending: false });

  if (startDate) scheduleQuery = scheduleQuery.gte('date', startDate);
  if (endDate) scheduleQuery = scheduleQuery.lte('date', endDate);

  const { data: scheduleData } = await scheduleQuery;

  for (const row of scheduleData || []) {
    // Get title and subject from joined tables - cast through unknown for type safety
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lesson = (row.lesson as unknown) as { id: string; title: string; type: string } | { id: string; title: string; type: string }[] | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignment = (row.assignment as unknown) as { id: string; title: string; type: string } | { id: string; title: string; type: string }[] | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resource = (row.resource as unknown) as { id: string; name: string; category: string } | { id: string; name: string; category: string }[] | null;

    // Handle both single object and array cases (Supabase can return either)
    const lessonData = Array.isArray(lesson) ? lesson[0] : lesson;
    const assignmentData = Array.isArray(assignment) ? assignment[0] : assignment;
    const resourceData = Array.isArray(resource) ? resource[0] : resource;

    const title = lessonData?.title || assignmentData?.title || resourceData?.name || 'Completed Activity';
    const rawSubject = lessonData?.type || assignmentData?.type || resourceData?.category || 'General';
    
    // Normalize subject
    let subject = rawSubject;
    const lower = rawSubject.toLowerCase();
    if (lower.includes('read')) subject = 'Reading';
    else if (lower.includes('writ') || lower.includes('language')) subject = 'Writing';
    else if (lower.includes('math') || lower.includes('logic')) subject = 'Math';
    else if (lower.includes('sci')) subject = 'Science';
    else if (lower.includes('life') || lower.includes('skill')) subject = 'Life Skills';

    entries.push({
      id: row.id,
      kidId: row.student_id,
      date: row.date,
      subject,
      title,
      description: null,
      durationMinutes: null,
      source: 'in-app'
    });
  }

  // Sort by date descending
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return entries;
}

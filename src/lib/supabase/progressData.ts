// Progress data functions - Supabase backend
import { createServerClient } from './server';

export interface StudentProgress {
  id: string;
  kidId: string;
  totalStars: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  schoolDays: number[];
}

export interface ProgressAward {
  id: string;
  kidId: string;
  date: string;
  itemId: string;
  starsEarned: number;
  awardedAt: string;
}

// Fetch student progress
export async function getStudentProgress(kidId: string): Promise<StudentProgress | null> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('kid_id', kidId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching student progress:', error);
    return null;
  }
  
  return {
    id: data.id,
    kidId: data.kid_id,
    totalStars: data.total_stars || 0,
    currentStreak: data.current_streak || 0,
    bestStreak: data.best_streak || 0,
    lastCompletedDate: data.last_completed_date,
    schoolDays: data.school_days || [2, 3, 4]
  };
}

// Fetch unlocks for a student
export async function getStudentUnlocks(kidId: string): Promise<string[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('student_unlocks')
    .select('unlock_id')
    .eq('kid_id', kidId)
    .order('unlocked_at');
  
  if (error) {
    console.error('Error fetching unlocks:', error);
    return [];
  }
  
  return (data || []).map(row => row.unlock_id);
}

// Check if an item was already awarded for a specific date
export async function isItemAwarded(kidId: string, date: string, itemId: string): Promise<boolean> {
  const supabase = await createServerClient();
  
  const { data } = await supabase
    .from('progress_awards')
    .select('id')
    .eq('kid_id', kidId)
    .eq('date', date)
    .eq('item_id', itemId)
    .single();
  
  return !!data;
}

// Get all awards for a specific date
export async function getAwardsForDate(kidId: string, date: string): Promise<ProgressAward[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('progress_awards')
    .select('*')
    .eq('kid_id', kidId)
    .eq('date', date);
  
  if (error) {
    console.error('Error fetching awards:', error);
    return [];
  }
  
  return (data || []).map(row => ({
    id: row.id,
    kidId: row.kid_id,
    date: row.date,
    itemId: row.item_id,
    starsEarned: row.stars_earned,
    awardedAt: row.awarded_at
  }));
}

// Get subject counts for badges
export async function getKidSubjectCounts(kidId: string): Promise<Record<string, number>> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase.rpc('get_kid_subject_counts', {
    p_kid_id: kidId
  });
  
  if (error) {
    console.error('Error fetching subject counts:', error);
    return {};
  }
  
  // Normalize data into record with expanded categories
  const counts: Record<string, number> = {};
  (data || []).forEach((row: { subject: string; count: number }) => {
    // Map all subjects to display categories
    let key = row.subject.toLowerCase();
    
    // Reading category (includes Language Arts)
    if (key.includes('read') || key === 'language arts') key = 'reading';
    // Writing category
    else if (key.includes('writ')) key = 'writing';
    // Math category
    else if (key.includes('math') || key.includes('logic')) key = 'math';
    // Science category
    else if (key.includes('sci')) key = 'science';
    // Social Studies category (includes History, Geography)
    else if (key === 'social studies' || key.includes('history') || key.includes('geography')) key = 'social_studies';
    // Arts category (Art + Music)
    else if (key === 'art' || key === 'music') key = 'arts';
    // Life Skills category (includes PE)
    else if (key.includes('life') || key.includes('skill') || key === 'pe') key = 'life_skills';
    // Electives catch-all (Foreign Language, Technology, Field Trip, Other)
    else key = 'electives';
    
    counts[key] = (counts[key] || 0) + Number(row.count);
  });
  
  return counts;
}

// Get weekly activity for stats (supports range: 7, 30, 90 days)
export async function getWeeklyActivity(kidId: string, days: number = 7): Promise<{ date: string; count: number }[]> {
  const supabase = await createServerClient();
  
  // Use the new range RPC if available, fallback to old one
  const { data, error } = await supabase.rpc('get_activity_by_range', {
    p_kid_id: kidId,
    p_days: days
  });
  
  if (error) {
    console.error('Error fetching activity by range:', error);
    return [];
  }
  
  return data || [];
}

// Get life skills category counts for progress tracking
export async function getLifeSkillsCounts(kidId: string): Promise<Record<string, number>> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase.rpc('get_life_skills_counts', {
    p_kid_id: kidId
  });
  
  if (error) {
    console.error('Error fetching life skills counts:', error);
    return {};
  }
  
  // Normalize data into record
  const counts: Record<string, number> = {};
  (data || []).forEach((row: { category: string; count: number }) => {
    counts[row.category] = Number(row.count);
  });
  
  return counts;
}

// Get activity log statistics for a kid
export async function getActivityLogStats(kidId: string): Promise<{
  totalMinutes: number;
  totalEntries: number;
  subjectMinutes: Record<string, number>;
  subjectCounts: Record<string, number>;
}> {
  const supabase = await createServerClient();
  
  // Get all activity log entries for this kid
  const { data, error } = await supabase
    .from('activity_log')
    .select('subject, duration_minutes')
    .eq('kid_id', kidId);
  
  if (error) {
    console.error('Error fetching activity log stats:', error);
    return { totalMinutes: 0, totalEntries: 0, subjectMinutes: {}, subjectCounts: {} };
  }
  
  const stats = {
    totalMinutes: 0,
    totalEntries: 0,
    subjectMinutes: {} as Record<string, number>,
    subjectCounts: {} as Record<string, number>
  };
  
  (data || []).forEach((row) => {
    stats.totalEntries += 1;
    stats.totalMinutes += row.duration_minutes || 0;
    
    // Normalize subject key to display categories
    let key = (row.subject || 'other').toLowerCase();
    
    // Reading category (includes Language Arts)
    if (key.includes('read') || key === 'language arts') key = 'reading';
    // Writing category
    else if (key.includes('writ')) key = 'writing';
    // Math category
    else if (key.includes('math') || key.includes('logic')) key = 'math';
    // Science category
    else if (key.includes('sci')) key = 'science';
    // Social Studies category (includes History, Geography)
    else if (key === 'social studies' || key.includes('history') || key.includes('geography')) key = 'social_studies';
    // Arts category (Art + Music)
    else if (key === 'art' || key === 'music') key = 'arts';
    // Life Skills category (includes PE)
    else if (key.includes('life') || key.includes('skill') || key === 'pe') key = 'life_skills';
    // Electives catch-all
    else key = 'electives';
    
    stats.subjectMinutes[key] = (stats.subjectMinutes[key] || 0) + (row.duration_minutes || 0);
    stats.subjectCounts[key] = (stats.subjectCounts[key] || 0) + 1;
  });
  
  return stats;
}

// Unified activity entry type
export interface UnifiedActivity {
  id: string;
  date: string;
  title: string;
  subject: string;
  source: 'lunara_quest' | 'miacademy' | 'manual';
  sourceLabel: string;
  type?: string; // lesson, assignment, etc.
  score?: number | null; // for graded items
  durationMinutes?: number | null; // estimated duration
  actualMinutes?: number | null; // actual time logged by parent
  scheduleItemId?: string; // for Lunara Quest items - used to update time
}

// Get unified activities from all 3 sources for a kid
export async function getUnifiedActivities(
  kidId: string, 
  startDate: string,
  endDate?: string
): Promise<UnifiedActivity[]> {
  const supabase = await createServerClient();
  const activities: UnifiedActivity[] = [];
  
  // 1. Fetch completed schedule_items (Lunara Quest)
  const scheduleQuery = supabase
    .from('schedule_items')
    .select(`
      id, date, status, completed_at, item_type, title_override, actual_minutes,
      lessons:lesson_id(id, title, type, estimated_minutes),
      assignments:assignment_id(id, title, type, estimated_minutes),
      resources:resource_id(id, label, category)
    `)
    .eq('student_id', kidId)
    .eq('status', 'completed')
    .gte('date', startDate)
    .order('date', { ascending: false });
  
  if (endDate) scheduleQuery.lte('date', endDate);
  
  const { data: scheduleItems, error: scheduleErr } = await scheduleQuery;
  
  // Log for debugging (appears in server logs)
  console.log('[getUnifiedActivities] kidId:', kidId, 'startDate:', startDate);
  console.log('[getUnifiedActivities] Schedule items:', scheduleItems?.length || 0, 'error:', scheduleErr?.message);
  
  if (!scheduleErr && scheduleItems) {
    for (const item of scheduleItems) {
      // Supabase returns single joined records as objects, but TS thinks they're arrays
      const lesson = (item.lessons && !Array.isArray(item.lessons)) 
        ? item.lessons as unknown as { id: string; title: string; type: string; estimated_minutes?: number }
        : null;
      const assignment = (item.assignments && !Array.isArray(item.assignments))
        ? item.assignments as unknown as { id: string; title: string; type: string; estimated_minutes?: number }
        : null;
      const resource = (item.resources && !Array.isArray(item.resources))
        ? item.resources as unknown as { id: string; label: string; category: string }
        : null;
      
      // Determine title and subject based on what's populated
      let title = item.title_override || '';
      let subject = 'Other';
      let type = item.item_type || 'activity';
      let durationMinutes: number | undefined;
      
      if (lesson) {
        title = item.title_override || lesson.title;
        subject = lesson.type || 'Other';
        type = 'lesson';
        durationMinutes = lesson.estimated_minutes;
      } else if (assignment) {
        title = item.title_override || assignment.title;
        subject = assignment.type || 'Other';
        type = 'assignment';
        durationMinutes = assignment.estimated_minutes;
      } else if (resource) {
        title = item.title_override || resource.label;
        subject = resource.category || 'Other';
        type = 'resource';
      }
      
      // Fallback title if nothing found
      if (!title) {
        title = `${type.charAt(0).toUpperCase() + type.slice(1)} (${item.date})`;
      }
      
      // Always include schedule_items (they were counted by the RPC)
      activities.push({
        id: `schedule-${item.id}`,
        date: item.date,
        title,
        subject,
        source: 'lunara_quest',
        sourceLabel: 'Lunara Quest',
        type,
        durationMinutes,
        actualMinutes: (item as { actual_minutes?: number }).actual_minutes || null,
        scheduleItemId: item.id
      });
    }
  }
  
  // 2. Fetch external_curriculum (MiAcademy imports)
  const extQuery = supabase
    .from('external_curriculum')
    .select('id, date, task_name, subject, source, score')
    .eq('kid_id', kidId)
    .gte('date', startDate)
    .order('date', { ascending: false });
  
  if (endDate) extQuery.lte('date', endDate);
  
  const { data: extItems, error: extErr } = await extQuery;
  
  console.log('[getUnifiedActivities] External curriculum:', extItems?.length || 0, 'error:', extErr?.message);
  
  if (!extErr && extItems) {
    for (const item of extItems) {
      // Skip items with no date
      if (!item.date) continue;
      
      activities.push({
        id: `ext-${item.id}`,
        date: item.date,
        title: item.task_name,
        subject: item.subject || 'Other',
        source: 'miacademy',
        sourceLabel: item.source || 'MiAcademy',
        score: item.score
      });
    }
  }
  
  // 3. Fetch activity_log (manual entries)
  const logQuery = supabase
    .from('activity_log')
    .select('id, date, title, subject, duration_minutes')
    .eq('kid_id', kidId)
    .gte('date', startDate)
    .order('date', { ascending: false });
  
  if (endDate) logQuery.lte('date', endDate);
  
  const { data: logItems, error: logErr } = await logQuery;
  
  if (!logErr && logItems) {
    for (const item of logItems) {
      activities.push({
        id: `log-${item.id}`,
        date: item.date,
        title: item.title,
        subject: item.subject || 'Other',
        source: 'manual',
        sourceLabel: 'Manual',
        durationMinutes: item.duration_minutes
      });
    }
  }
  
  // Sort all by date descending
  activities.sort((a, b) => b.date.localeCompare(a.date));
  
  return activities;
}

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

// Get weekly activity for stats
export async function getWeeklyActivity(kidId: string): Promise<{ date: string; count: number }[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase.rpc('get_weekly_activity', {
    p_kid_id: kidId
  });
  
  if (error) {
    console.error('Error fetching weekly activity:', error);
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


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

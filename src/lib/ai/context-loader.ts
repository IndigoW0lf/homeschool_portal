/**
 * AI Context Loaders
 * 
 * Loads only what is needed for each request type.
 * Enforces family ownership via Supabase RLS.
 * Never passes full histories or unrelated data to the model.
 * 
 * Per AI philosophy docs:
 * - Prevents "AI knows too much" fear
 * - Keeps prompts short and scoped
 * - No persistent memory
 */

import { createServerClient } from '@/lib/supabase/server';
import { ThinkContext } from './types';

// ============================================
// CONTEXT TYPES (what we send to the model)
// ============================================

/**
 * Minimal week summary for WEEK_THINK context
 * Only includes themes and item counts, not full content
 */
export interface WeekContext {
  startDate: string;
  endDate: string;
  daysSummary: Array<{
    date: string;
    theme: string | null;
    itemCount: number;
    completedCount: number;
  }>;
}

/**
 * Minimal lesson context for LESSON_STUCK
 * Only includes title, type, and parent notes - no full instructions
 */
export interface LessonContext {
  id: string;
  title: string;
  type: string | null;
  parentNotes: string | null;
  estimatedMinutes: number;
}

/**
 * Minimal child context for INTEREST_SPARK
 * Only includes name, grade, and stated interests
 */
export interface ChildContext {
  id: string;
  name: string;
  gradeBand: string | null;
  interests: string[];  // From parent-stated notes, not inferred
}

/**
 * Family context - always loaded so Luna knows about all kids
 * Used for tailoring lessons to specific ages and creating content
 */
export interface FamilyContext {
  kids: Array<{
    id: string;
    name: string;
    gradeBand: string | null;
    age?: number | null;  // Calculated from birthdate if available
    interests?: string[];
    learningStyle?: string | null;
  }>;
  // Family-level preferences (could be extended later)
  homeschoolStyle?: string | null; // e.g., "Charlotte Mason", "Classical", "Eclectic"
}

// ============================================
// CONTEXT LOADERS
// ============================================

/**
 * Load week summary for WEEK_THINK context
 * Returns day counts and themes, not full lesson content
 */
export async function loadWeekContext(
  studentId: string,
  weekStartDate: string
): Promise<WeekContext | null> {
  const supabase = await createServerClient();
  
  // Calculate week range
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endDate = end.toISOString().split('T')[0];
  
  // Fetch schedule items for the week (RLS enforces family ownership)
  const { data, error } = await supabase
    .from('schedule_items')
    .select('date, status')
    .eq('student_id', studentId)
    .gte('date', weekStartDate)
    .lte('date', endDate);
  
  if (error) {
    console.error('Error loading week context:', error);
    return null;
  }
  
  // Fetch day plan themes
  const { data: dayPlans } = await supabase
    .from('day_plans')
    .select('date, theme')
    .gte('date', weekStartDate)
    .lte('date', endDate);
  
  const themeByDate = new Map(
    (dayPlans || []).map(p => [p.date, p.theme])
  );
  
  // Group by date
  const byDate = new Map<string, { total: number; completed: number }>();
  (data || []).forEach(item => {
    const current = byDate.get(item.date) || { total: 0, completed: 0 };
    current.total++;
    if (item.status === 'completed') current.completed++;
    byDate.set(item.date, current);
  });
  
  // Build summary (7 days max)
  const daysSummary = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const counts = byDate.get(dateStr) || { total: 0, completed: 0 };
    daysSummary.push({
      date: dateStr,
      theme: themeByDate.get(dateStr) || null,
      itemCount: counts.total,
      completedCount: counts.completed,
    });
  }
  
  return {
    startDate: weekStartDate,
    endDate,
    daysSummary,
  };
}

/**
 * Load minimal lesson context for LESSON_STUCK
 * Only loads what's needed to understand the situation
 */
export async function loadLessonContext(
  lessonId: string
): Promise<LessonContext | null> {
  const supabase = await createServerClient();
  
  // RLS enforces family ownership
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, type, parent_notes, estimated_minutes')
    .eq('id', lessonId)
    .single();
  
  if (error || !data) {
    console.error('Error loading lesson context:', error);
    return null;
  }
  
  return {
    id: data.id,
    title: data.title,
    type: data.type,
    parentNotes: data.parent_notes,
    estimatedMinutes: data.estimated_minutes,
  };
}

/**
 * Load child context for INTEREST_SPARK
 * Only includes basic info and parent-stated interests
 */
export async function loadChildContext(
  childId: string
): Promise<ChildContext | null> {
  const supabase = await createServerClient();
  
  // RLS enforces family ownership
  const { data, error } = await supabase
    .from('kids')
    .select('id, name, grade_band')
    .eq('id', childId)
    .single();
  
  if (error || !data) {
    console.error('Error loading child context:', error);
    return null;
  }
  
  // TODO: Load interests from a dedicated interests table when available
  // For now, return empty - interests must come from the request
  return {
    id: data.id,
    name: data.name,
    gradeBand: data.grade_band,
    interests: [], // Parent provides in message, not inferred
  };
}

/**
 * Load ALL kids in the family - used for every request
 * This lets Luna know about your family automatically
 */
export async function loadFamilyContext(): Promise<FamilyContext | null> {
  const supabase = await createServerClient();
  
  // RLS automatically filters to only this family's kids
  const { data: kidsData, error } = await supabase
    .from('kids')
    .select('id, name, grade_band, birthdate, bio')
    .order('name');
  
  if (error) {
    console.error('Error loading family context:', error);
    return null;
  }
  
  if (!kidsData || kidsData.length === 0) {
    return { kids: [] };
  }
  
  // Calculate ages from birthdates
  const today = new Date();
  const kids = kidsData.map(kid => {
    let age: number | null = null;
    if (kid.birthdate) {
      const birthDate = new Date(kid.birthdate);
      age = today.getFullYear() - birthDate.getFullYear();
      // Adjust if birthday hasn't occurred yet this year
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    return {
      id: kid.id,
      name: kid.name,
      gradeBand: kid.grade_band,
      age,
      // Could parse interests from bio if they're listed there
      interests: [],
      learningStyle: null,
    };
  });
  
  return { kids };
}

// ============================================
// CONTEXT FORMATTING (for prompt injection)
// ============================================

/**
 * Format context for injection into user prompt
 * Keeps prompts short and scoped
 */
export function formatContextForPrompt(
  context: ThinkContext,
  data: {
    week?: WeekContext | null;
    lesson?: LessonContext | null;
    child?: ChildContext | null;
    family?: FamilyContext | null;
  }
): string {
  const lines: string[] = [];
  
  // Always include family context if available (so Luna knows about all kids)
  if (data.family && data.family.kids.length > 0) {
    lines.push('[Your Family]');
    data.family.kids.forEach(kid => {
      const ageStr = kid.age ? `${kid.age} years old` : kid.gradeBand || 'age unknown';
      lines.push(`- ${kid.name}: ${ageStr}`);
    });
    lines.push(''); // Empty line for separation
  }
  
  switch (context) {
    case 'WEEK_THINK':
      if (data.week) {
        lines.push(`[Week: ${data.week.startDate} to ${data.week.endDate}]`);
        const summary = data.week.daysSummary
          .map(d => {
            const status = d.itemCount === 0 ? 'empty' : 
              `${d.completedCount}/${d.itemCount} done`;
            return `${d.date}: ${d.theme || 'no theme'} (${status})`;
          })
          .join('\n');
        lines.push(summary);
      }
      break;
      
    case 'LESSON_STUCK':
      if (data.lesson) {
        lines.push(`[Lesson: ${data.lesson.title}]`);
        if (data.lesson.type) lines.push(`Type: ${data.lesson.type}`);
        if (data.lesson.estimatedMinutes) {
          lines.push(`Estimated: ${data.lesson.estimatedMinutes} min`);
        }
        if (data.lesson.parentNotes) {
          lines.push(`Parent notes: ${data.lesson.parentNotes}`);
        }
      }
      break;
      
    case 'INTEREST_SPARK':
      if (data.child) {
        lines.push(`[Child: ${data.child.name}]`);
        if (data.child.gradeBand) lines.push(`Grade: ${data.child.gradeBand}`);
        if (data.child.interests.length > 0) {
          lines.push(`Known interests: ${data.child.interests.join(', ')}`);
        }
      }
      break;
      
    default:
      // REFLECTION and GENERAL modes still get family context (added above)
      break;
  }
  
  return lines.length > 0 ? lines.join('\n') : '';
}

// ============================================
// MAIN LOADER (used by route handler)
// ============================================

export interface LoadedContext {
  formatted: string;
  raw: {
    week?: WeekContext | null;
    lesson?: LessonContext | null;
    child?: ChildContext | null;
    family?: FamilyContext | null;
  };
}

/**
 * Load context based on request type
 * Returns formatted string for prompt + raw data for debugging
 * 
 * ALWAYS loads family context so Luna knows about all kids
 */
export async function loadContextForRequest(params: {
  context: ThinkContext;
  childProfileId?: string;
  lessonId?: string;
  weekStartDate?: string;
}): Promise<LoadedContext> {
  const { context, childProfileId, lessonId, weekStartDate } = params;
  
  const raw: LoadedContext['raw'] = {};
  
  // ALWAYS load family context so Luna knows about your kids
  raw.family = await loadFamilyContext();
  
  // Load additional context specific to the request type
  switch (context) {
    case 'WEEK_THINK':
      if (childProfileId && weekStartDate) {
        raw.week = await loadWeekContext(childProfileId, weekStartDate);
      }
      break;
      
    case 'LESSON_STUCK':
      if (lessonId) {
        raw.lesson = await loadLessonContext(lessonId);
      }
      break;
      
    case 'INTEREST_SPARK':
      if (childProfileId) {
        raw.child = await loadChildContext(childProfileId);
      }
      break;
      
    default:
      // REFLECTION and GENERAL still get family context (loaded above)
      break;
  }
  
  const formatted = formatContextForPrompt(context, raw);
  
  return { formatted, raw };
}

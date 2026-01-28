'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ImportRow {
  taskName: string;
  course: string;
  date: string;
  score: string | null;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

// Map Miacademy courses to subjects
const courseToSubject: Record<string, string> = {
  'reading comprehension': 'Reading',
  'survivor\'s quest': 'Reading',
  'math foundations': 'Math',
  'math': 'Math',
  'science': 'Science',
  'writing': 'Writing',
  'social studies': 'Social Studies',
  'history': 'History',
};

function parseSubjectFromCourse(course: string): string {
  const lowerCourse = course.toLowerCase();
  for (const [key, subject] of Object.entries(courseToSubject)) {
    if (lowerCourse.includes(key)) {
      return subject;
    }
  }
  // Default: use first word of course as subject
  return course.split(':')[0].trim();
}

function parseItemType(taskName: string): string {
  const lowerTask = taskName.toLowerCase();
  if (lowerTask.includes('assessment') || lowerTask.includes('quiz')) {
    return 'assessment';
  }
  if (lowerTask.includes('practice')) {
    return 'practice';
  }
  if (lowerTask.includes('supplemental')) {
    return 'supplemental';
  }
  if (lowerTask.includes('video')) {
    return 'video';
  }
  return 'lesson';
}

/**
 * Parse topic name from task name
 * Input: "Subtract Decimals 1 | Practice: Levels 7 - 9"
 * Output: "Subtract Decimals 1"
 */
function parseTopicFromTask(taskName: string): string {
  if (taskName.includes('|')) {
  }
  return taskName.trim();
}

/**
 * Parse practice level from task name if present
 * Input: "Subtract Decimals 1 | Practice: Levels 7 - 9"
 * Output: "Levels 7-9"
 */
function parseLevelFromTask(taskName: string): string | null {
  const lowerTask = taskName.toLowerCase();
  // Match patterns like "Levels 7 - 9", "Level 4", "Levels 1-3"
  const levelMatch = taskName.match(/Levels?\s*[\d]+\s*[-–]?\s*[\d]*/i);
  if (levelMatch) {
    return levelMatch[0].replace(/\s+/g, ' ').trim();
  }
  return null;
}

/**
 * Calculate mastery status from score
 * - weak: <80%
 * - developing: 80-89%
 * - mastered: >=90%
 * - in_progress: no score (practice/video)
 */
function calculateMasteryStatus(score: number | null): string {
  if (score === null) return 'in_progress';
  if (score >= 90) return 'mastered';
  if (score >= 80) return 'developing';
  return 'weak';
}

function parseScore(scoreStr: string | null): number | null {
  if (!scoreStr || scoreStr.trim() === '') return null;
  // Remove % symbol and parse
  const cleaned = scoreStr.replace('%', '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function parseDate(dateStr: string): string | null {
  // Handle MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  // Try ISO format
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString().split('T')[0];
  }
  return null;
}

export async function importExternalCurriculum(
  kidId: string,
  source: string,
  rows: ImportRow[]
): Promise<ImportResult> {
  const supabase = await createServerClient();
  const errors: string[] = [];
  let imported = 0;

  // Verify user has access to this kid
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, imported: 0, errors: ['Not authenticated'] };
  }

  // Process rows in batches
  const records = rows.map((row, idx) => {
    try {
      const date = parseDate(row.date);
      if (!date) {
        errors.push(`Row ${idx + 1}: Invalid date "${row.date}"`);
        return null;
      }

      const score = parseScore(row.score);
      
      return {
        kid_id: kidId,
        source: source || 'miacademy',
        task_name: row.taskName,
        course: row.course,
        subject: parseSubjectFromCourse(row.course),
        date: date,
        score: score,
        item_type: parseItemType(row.taskName),
        // Enhanced fields for practice generation
        topic: parseTopicFromTask(row.taskName),
        level: parseLevelFromTask(row.taskName),
        mastery_status: calculateMasteryStatus(score),
      };
    } catch (err) {
      errors.push(`Row ${idx + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
      return null;
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  if (records.length === 0) {
    return { success: false, imported: 0, errors: ['No valid rows to import'] };
  }

  // Insert records
  const { error: insertError, data } = await supabase
    .from('external_curriculum')
    .insert(records)
    .select();

  if (insertError) {
    console.error('Import error:', insertError);
    return { success: false, imported: 0, errors: [insertError.message] };
  }

  imported = data?.length || 0;

  revalidatePath('/parent/progress');

  return {
    success: true,
    imported,
    errors,
  };
}

export async function getExternalCurriculumStats(kidIds: string[]) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('external_curriculum')
    .select('*')
    .in('kid_id', kidIds)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching external curriculum:', error);
    return { byKid: {} };
  }

  const items = data || [];

  // Group by kid_id
  const byKid: Record<string, {
    items: typeof items;
    stats: {
      totalItems: number;
      gradedItems: number;
      avgGrade: number | null;
      subjectAverages: { subject: string; average: number; count: number }[];
    };
  }> = {};

  // Initialize for each kid
  kidIds.forEach(kidId => {
    byKid[kidId] = {
      items: [],
      stats: { totalItems: 0, gradedItems: 0, avgGrade: null, subjectAverages: [] }
    };
  });

  // Process items by kid
  items.forEach(item => {
    if (!byKid[item.kid_id]) {
      byKid[item.kid_id] = {
        items: [],
        stats: { totalItems: 0, gradedItems: 0, avgGrade: null, subjectAverages: [] }
      };
    }
    byKid[item.kid_id].items.push(item);
  });

  // Calculate stats per kid
  for (const kidId of Object.keys(byKid)) {
    const kidItems = byKid[kidId].items;
    const subjectGrades: Record<string, { total: number; count: number }> = {};
    let totalItems = 0;
    let gradedItems = 0;
    let totalScore = 0;

    kidItems.forEach(item => {
      totalItems++;
      if (item.score !== null) {
        gradedItems++;
        totalScore += item.score;

        if (!subjectGrades[item.subject]) {
          subjectGrades[item.subject] = { total: 0, count: 0 };
        }
        subjectGrades[item.subject].total += item.score;
        subjectGrades[item.subject].count++;
      }
    });

    const avgGrade = gradedItems > 0 ? Math.round(totalScore / gradedItems) : null;

    const subjectAverages = Object.entries(subjectGrades).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      count: data.count,
    })).sort((a, b) => b.count - a.count);

    byKid[kidId].stats = { totalItems, gradedItems, avgGrade, subjectAverages };
  }

  return { byKid };
}

export async function deleteExternalCurriculumItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Delete the item (RLS will verify ownership)
  const { error } = await supabase
    .from('external_curriculum')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/parent/progress');
  return { success: true };
}

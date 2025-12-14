import { createServerClient } from './server';
import { Kid, Lesson, CalendarEntry, Resources } from '@/types';
import { formatDateString } from '../dateUtils';

// Kids
export async function getKidsFromDB(): Promise<Kid[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('kids')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching kids:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    gradeBand: row.grade_band || '',
  }));
}

export async function getKidByIdFromDB(id: string): Promise<Kid | undefined> {
  const kids = await getKidsFromDB();
  return kids.find(k => k.id === id);
}

// Lessons
export async function getLessonsFromDB(): Promise<Lesson[]> {
  const supabase = await createServerClient();
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false });

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    return [];
  }

  const { data: links, error: linksError } = await supabase
    .from('lesson_links')
    .select('*');

  if (linksError) {
    console.error('Error fetching lesson links:', linksError);
  }

  const { data: attachments, error: attachmentsError } = await supabase
    .from('lesson_attachments')
    .select('*');

  if (attachmentsError) {
    console.error('Error fetching lesson attachments:', attachmentsError);
  }

  const linksByLesson = (links || []).reduce((acc, link) => {
    if (!acc[link.lesson_id]) acc[link.lesson_id] = [];
    acc[link.lesson_id].push({ label: link.label, url: link.url });
    return acc;
  }, {} as Record<string, { label: string; url: string }[]>);

  const attachmentsByLesson = (attachments || []).reduce((acc, att) => {
    if (!acc[att.lesson_id]) acc[att.lesson_id] = [];
    acc[att.lesson_id].push({ label: att.label, url: att.url });
    return acc;
  }, {} as Record<string, { label: string; url: string }[]>);

  return (lessons || []).map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    type: lesson.type, // Added type
    instructions: lesson.instructions,
    tags: lesson.tags || [],
    estimatedMinutes: lesson.estimated_minutes || 0,
    links: linksByLesson[lesson.id] || [],
    attachments: attachmentsByLesson[lesson.id] || [],
  }));
}

export async function getLessonByIdFromDB(id: string): Promise<Lesson | undefined> {
  const lessons = await getLessonsFromDB();
  return lessons.find(l => l.id === id);
}

export async function getLessonsByIdsFromDB(ids: string[]): Promise<Lesson[]> {
  const lessons = await getLessonsFromDB();
  return lessons.filter(l => ids.includes(l.id));
}

// Assignments (Task Items)
export async function getAssignmentItemsFromDB(): Promise<import('@/types').AssignmentItemRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('assignment_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assignment items:', error);
    return [];
  }
  return data || [];
}

// Day Plans (formerly Assignments/CalendarEntry)
export async function getDayPlansFromDB(): Promise<CalendarEntry[]> {
  const supabase = await createServerClient();
  const { data: plans, error } = await supabase
    .from('day_plans') // Renamed table
    .select('*')
    .order('date');

  if (error) {
    console.error('Error fetching day plans:', error);
    return [];
  }
  
  // Note: We need to refactor logic for 'kidIds' and 'lessonIds' since junction tables are gone.
  // Ideally we query schedule_items to find what's on this day for a kid.
  // For now, returning partial data to fix build errors.
  
  return (plans || []).map(p => ({
    date: p.date,
    theme: p.theme || '',
    kidIds: [], // TODO: Derived from schedule_items
    lessonIds: [], // TODO: Derived from schedule_items
    journalPrompt: p.journal_prompt || '',
    projectPrompt: p.project_prompt || null,
    parentNotes: p.parent_notes || '',
  }));
}

export async function getTodayEntryFromDB(date: Date = new Date()): Promise<CalendarEntry | undefined> {
  // Simplified logic for migration phase
  const dateString = formatDateString(date);
  const plans = await getDayPlansFromDB();
  return plans.find(p => p.date === dateString); // Ignoring kidId check for now as day plans are global for familys usually
}

export async function getWeekEntriesFromDB(date: Date = new Date()): Promise<CalendarEntry[]> {
  const { getWeekRange } = await import('../dateUtils');
  const { start, end } = getWeekRange(date);
  const startString = formatDateString(start);
  const endString = formatDateString(end);

  const plans = await getDayPlansFromDB();
  return plans.filter(entry => {
    return entry.date >= startString && entry.date <= endString;
  });
}

// Resources
export async function getResourcesFromDB(): Promise<Resources> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('Error fetching resources:', error);
    return { reading: [], logic: [], writing: [], projects: [] };
  }

  const resources: Resources = {
    reading: [],
    logic: [],
    writing: [],
    projects: [],
  };

  (data || []).forEach(row => {
    const category = row.category.toLowerCase() as keyof Resources;
    if (resources[category]) {
      resources[category].push({
        label: row.label,
        url: row.url,
        pinnedToday: row.pinned_today || false,
      });
    }
  });

  return resources;
}

export async function getMiAcademyResourceFromDB(): Promise<{ label: string; url: string } | null> {
  const resources = await getResourcesFromDB();
  const reading = resources.reading || [];
  const miacademy = reading.find(r => r.pinnedToday || r.label.toLowerCase().includes('miacademy'));
  return miacademy ? { label: miacademy.label, url: miacademy.url } : null;
}



// Schedule Items
export async function getScheduleItemsFromDB() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('schedule_items')
    .select(`
      *,
      lesson:lessons!schedule_items_lesson_id_fkey(id, title, type),
      assignment:assignment_items(id, title, type)
    `)
    .order('date');

  if (error) {
    console.error('Error fetching schedule items:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    date: row.date,
    studentId: row.student_id,
    itemType: row.item_type,
    status: row.status,
    completedAt: row.completed_at,
    itemId: row.item_type === 'lesson' ? row.lesson_id : row.assignment_id,
    title: row.lesson?.title || row.assignment?.title || 'Untitled',
    type: row.lesson?.type || row.assignment?.type || 'Task',
    // Mock details for DayModal compatibility if needed, or we rely on the Join
    studentIds: [row.student_id] // Helper for DayModal which expects array
  }));
}

// Get schedule items for a specific student, optionally filtered by date range
export async function getScheduleItemsForStudent(
  studentId: string, 
  startDate?: string, 
  endDate?: string
) {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('schedule_items')
    .select(`
      *,
      lesson:lessons!schedule_items_lesson_id_fkey(id, title, type, estimated_minutes, instructions, parent_notes),
      assignment:assignment_items(id, title, type, estimated_minutes, steps, deliverable, rubric)
    `)
    .eq('student_id', studentId)
    .order('date');

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  console.log('getScheduleItemsForStudent called:', { studentId, startDate, endDate });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching schedule items for student:', error);
    return [];
  }

  console.log('getScheduleItemsForStudent results:', { count: data?.length || 0, studentId });

  return (data || []).map(row => ({
    id: row.id,
    date: row.date,
    studentId: row.student_id,
    itemType: row.item_type,
    status: row.status,
    completedAt: row.completed_at,
    itemId: row.item_type === 'lesson' ? row.lesson_id : row.assignment_id,
    title: row.lesson?.title || row.assignment?.title || 'Untitled',
    type: row.lesson?.type || row.assignment?.type || 'Task',
    estimatedMinutes: row.lesson?.estimated_minutes || row.assignment?.estimated_minutes || 20,
    // Full details for item modal
    details: row.lesson || row.assignment || null
  }));
}

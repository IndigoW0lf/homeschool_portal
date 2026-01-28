import { createServerClient } from './server';
import { Kid, Lesson, CalendarEntry, Resources } from '@/types';
import { formatDateString } from '../dateUtils';
import type { Profile } from '@/types';

// User Profile
export async function getUserProfileFromDB(): Promise<Profile | null> {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data as Profile;
}

// Kids - filtered by family membership (all family members can see kids)
export async function getKidsFromDB(): Promise<Kid[]> {
  // Check for kid session first
  const { getKidSession } = await import('@/lib/kid-session');
  const kidSession = await getKidSession();
  
  if (kidSession) {
    console.log('[getKidsFromDB] using kid session', kidSession.kidId);
    // If logged in as a kid, use Service Role to fetch ONLY their own profile
    const { createServiceRoleClient } = await import('./server');
    const supabase = await createServiceRoleClient();
    
    // 1. Get current kid's family_id
    const { data: currentKid, error: kidError } = await supabase
      .from('kids')
      .select('family_id, id, name, grade_band, grades, avatar_url, favorite_color, birthday, bio, favorite_shows, favorite_music, favorite_foods, favorite_subjects, hobbies, nickname, avatar_state, journal_enabled, journal_allow_skip, journal_prompt_types, streak_enabled, featured_badges')
      .eq('id', kidSession.kidId)
      .single();

    if (kidError) {
       console.error('[getKidsFromDB] Error fetching current kid:', kidError);
       return [];
    }
    
    if (!currentKid) {
       console.error('[getKidsFromDB] No kid found for ID:', kidSession.kidId);
       return [];
    }

    if (!currentKid?.family_id) {
       // Fallback: Kid has no family_id (legacy?), just return them
       console.log('[getKidsFromDB] Kid has no family_id, returning single record');
       return [mapKidRow(currentKid)];
    }

    // 2. Fetch ALL kids in that family
    const { data, error } = await supabase
      .from('kids')
      .select('*')
      .eq('family_id', currentKid.family_id)
      .order('id');
      
    if (error) {
       console.error('[getKidsFromDB] Error fetching sibling kids:', error);
       // Fallback: return just the current kid
       return [mapKidRow(currentKid)];
    }
    
    return (data || []).map(mapKidRow);
  }

  // Otherwise, standard Parent/User flow
  const supabase = await createServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // Not logged in, no kids
  
  // Get user's family IDs
  const { data: families } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id);
  
  const familyIds = families?.map(f => f.family_id) || [];
  
  // Query kids by family_id OR user_id (for backwards compatibility)
  let query = supabase.from('kids').select('*');
  
  if (familyIds.length > 0) {
    // Family-based access: get kids from any family the user belongs to
    query = query.or(`family_id.in.(${familyIds.join(',')}),user_id.eq.${user.id}`);
  } else {
    // Fallback: legacy user_id based access
    query = query.eq('user_id', user.id);
  }
  
  const { data, error } = await query.order('id');

  if (error) {
    console.error('Error fetching kids:', error);
    return [];
  }

  return (data || []).map(mapKidRow);
}

// Helper to map DB row to Kid type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapKidRow(row: any): Kid {
  return {
    id: row.id,
    name: row.name,
    gradeBand: row.grade_band || '',
    grades: row.grades || [],
    familyId: row.family_id || undefined,
    avatarUrl: row.avatar_url || undefined,
    favoriteColor: row.favorite_color || undefined,
    birthday: row.birthday || undefined,
    bio: row.bio || undefined,
    favoriteShows: row.favorite_shows || undefined,
    favoriteMusic: row.favorite_music || undefined,
    favoriteFoods: row.favorite_foods || undefined,
    favoriteSubjects: row.favorite_subjects || undefined,
    hobbies: row.hobbies || undefined,
    nickname: row.nickname || undefined,
    avatarState: row.avatar_state || undefined,
    journalEnabled: row.journal_enabled ?? true,
    journalAllowSkip: row.journal_allow_skip ?? true,
    journalPromptTypes: row.journal_prompt_types || undefined,
    streakEnabled: row.streak_enabled ?? true,
    featuredBadges: row.featured_badges || [],
  };
}

export async function getKidByIdFromDB(id: string): Promise<Kid | undefined> {
  const kids = await getKidsFromDB();
  return kids.find(k => k.id === id);
}

// Lessons - filtered by family membership (all family members can see lessons)
export async function getLessonsFromDB(): Promise<Lesson[]> {
  const supabase = await createServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // Not logged in
  
  // Get all user IDs in user's families (for shared lessons)
  const { data: families } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id);
  
  const familyIds = families?.map(f => f.family_id) || [];
  
  // Get all family member user_ids
  let familyUserIds = [user.id];
  if (familyIds.length > 0) {
    const { data: allMembers } = await supabase
      .from('family_members')
      .select('user_id')
      .in('family_id', familyIds);
    
    familyUserIds = [...new Set(allMembers?.map(m => m.user_id) || [user.id])];
  }
  
  // Query lessons from any family member or legacy null user_id
  const userIdList = familyUserIds.map(id => `user_id.eq.${id}`).join(',');
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .or(`${userIdList},user_id.is.null`)
    .order('created_at', { ascending: false });

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    return [];
  }

  // Fallback: fetch from junction tables for legacy lessons without JSONB links
  let linksByLesson: Record<string, { label: string; url: string }[]> = {};
  let attachmentsByLesson: Record<string, { label: string; url: string }[]> = {};
  
  // Only fetch from junction tables if needed (for backwards compat)
  const lessonsWithoutJsonLinks = (lessons || []).filter(l => !l.links || l.links.length === 0);
  if (lessonsWithoutJsonLinks.length > 0) {
    const { data: links } = await supabase.from('lesson_links').select('*');
    const { data: attachments } = await supabase.from('lesson_attachments').select('*');
    
    linksByLesson = (links || []).reduce((acc, link) => {
      if (!acc[link.lesson_id]) acc[link.lesson_id] = [];
      acc[link.lesson_id].push({ label: link.label, url: link.url });
      return acc;
    }, {} as Record<string, { label: string; url: string }[]>);

    attachmentsByLesson = (attachments || []).reduce((acc, att) => {
      if (!acc[att.lesson_id]) acc[att.lesson_id] = [];
      acc[att.lesson_id].push({ label: att.label, url: att.url });
      return acc;
    }, {} as Record<string, { label: string; url: string }[]>);
  }

  return (lessons || []).map(lesson => {
    // Use new JSONB columns if available, otherwise fallback to junction tables
    const jsonLinks = Array.isArray(lesson.links) ? lesson.links : [];
    const links = jsonLinks.length > 0 ? jsonLinks : (linksByLesson[lesson.id] || []);
    
    // Parse key_questions (handle both string[] and {text:string}[] formats)
    let keyQuestions: string[] = [];
    if (Array.isArray(lesson.key_questions)) {
      keyQuestions = lesson.key_questions.map((q: string | { text: string }) => 
        typeof q === 'string' ? q : q.text || ''
      ).filter(Boolean);
    }
    
    return {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      instructions: lesson.instructions || '',
      description: lesson.description || undefined,
      keyQuestions: keyQuestions.length > 0 ? keyQuestions : undefined,
      materials: lesson.materials || undefined,
      tags: lesson.tags || [],
      estimatedMinutes: lesson.estimated_minutes || 0,
      links,
      attachments: attachmentsByLesson[lesson.id] || [],
      parentNotes: lesson.parent_notes || undefined,
      is_pinned: lesson.is_pinned,
      display_order: lesson.display_order,
    };
  });
}

export async function getLessonByIdFromDB(id: string): Promise<Lesson | undefined> {
  const lessons = await getLessonsFromDB();
  return lessons.find(l => l.id === id);
}

export async function getLessonsByIdsFromDB(ids: string[]): Promise<Lesson[]> {
  const lessons = await getLessonsFromDB();
  return lessons.filter(l => ids.includes(l.id));
}

// Assignments (Task Items) - filtered by authenticated user
export async function getAssignmentItemsFromDB(): Promise<import('@/types').AssignmentItemRow[]> {
  const supabase = await createServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // Not logged in
  
  const { data, error } = await supabase
    .from('assignment_items')
    .select('*')
    .or(`user_id.eq.${user.id},user_id.is.null`) // Include legacy data
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

// Resources - filtered by authenticated user
export async function getResourcesFromDB(): Promise<Resources> {
  // Check for kid session first
  const { getKidSession } = await import('@/lib/kid-session');
  const { createServerClient, createServiceRoleClient } = await import('./server');
  
  const kidSession = await getKidSession();
  let supabase;
  let targetUserId: string | null = null;
  
  if (kidSession) {
    // Kid Session: Need to find the parent's ID to fetch THEIR resources
    supabase = await createServiceRoleClient();
    
    // 1. Get kid's parent (user_id)
    const { data: kid } = await supabase
      .from('kids')
      .select('user_id')
      .eq('id', kidSession.kidId)
      .single();
      
    if (kid) {
      targetUserId = kid.user_id;
    }
  } else {
    // Parent Session: Use standard client
    supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) targetUserId = user.id;
  }
  
  if (!targetUserId) return { reading: [], logic: [], writing: [], projects: [] };
  
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .or(`user_id.eq.${targetUserId},user_id.is.null`) // Include legacy data
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



// Schedule Items - filtered by authenticated user
export async function getScheduleItemsFromDB() {
  const supabase = await createServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('schedule_items')
    .select(`
      *,
      lesson:lessons!schedule_items_lesson_id_fkey(id, title, type),
      assignment:assignment_items(id, title, type)
    `)
    .or(`user_id.eq.${user.id},user_id.is.null`) // Include legacy data
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
  // Check for kid session first
  const { getKidSession } = await import('@/lib/kid-session');
  // Dynamic import server utils to avoid circular dependencies if any (safe practice here)
  const { createServerClient, createServiceRoleClient } = await import('./server');
  
  const kidSession = await getKidSession();
  
  let supabase;
  
  if (kidSession && kidSession.kidId === studentId) {
    // Authorized kid viewing their own schedule -> Use Service Role
    supabase = await createServiceRoleClient();
  } else {
    // Normal parent/user access -> Use Standard Client (RLS)
    supabase = await createServerClient();
  }
  
  let query = supabase
    .from('schedule_items')
    .select(`
      *,
      lesson:lessons!schedule_items_lesson_id_fkey(id, title, type, estimated_minutes, instructions, parent_notes, links, description, key_questions, materials),
      assignment:assignment_items(id, title, type, estimated_minutes, steps, deliverable, rubric, links, worksheet_data)
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
    // Interactive worksheet support
    hasWorksheet: !!(row.assignment?.worksheet_data),
    assignmentId: row.assignment?.id || null,
    // Full details for item modal
    details: row.lesson || row.assignment || null
  }));
}

// Get schedule items for a date range (all students)
export async function getScheduleItemsForDateRange(
  startDate: string,
  endDate: string
): Promise<Array<{
  id: string;
  date: string;
  student_id: string;
  title?: string;
  title_override?: string;
  item_type: string;
}>> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('schedule_items')
    .select(`
      id, date, student_id, item_type, title_override,
      lessons:lesson_id ( title ),
      assignment_items:assignment_id ( title ),
      resources:resource_id ( label )
    `)
    .gte('date', startDate)
    .lte('date', endDate);
    
  if (error) {
    console.error('Error fetching schedule items for date range:', error);
    return [];
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    student_id: row.student_id,
    item_type: row.item_type,
    title_override: row.title_override,
    title: row.lessons?.title || row.assignment_items?.title || row.resources?.label || row.title_override || 'Untitled'
  }));
}

// Holidays
export async function getHolidaysFromDB(): Promise<import('@/types').Holiday[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji || '📅',
    startDate: row.start_date,
    endDate: row.end_date,
  }));
}

export async function getUpcomingHolidaysFromDB(limit = 5): Promise<import('@/types').Holiday[]> {
  const supabase = await createServerClient();
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .or(`start_date.gte.${today},end_date.gte.${today}`)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming holidays:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji || '📅',
    startDate: row.start_date,
    endDate: row.end_date,
  }));
}








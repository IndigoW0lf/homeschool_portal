'use server';

import { createServerClient } from './server';
import { LessonRow, AssignmentItemRow, ResourceRow, ScheduleItemRow } from '@/types';

// Lessons
export async function createLesson(lesson: Omit<LessonRow, 'id' | 'created_at'>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('lessons')
    .insert(lesson)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLesson(id: string, lesson: Partial<LessonRow>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('lessons')
    .update(lesson)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLesson(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function cloneLesson(id: string) {
  const supabase = await createServerClient();
  
  // Fetch the original lesson
  const { data: original, error: fetchError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !original) throw fetchError || new Error('Lesson not found');
  
  // Create a copy with new title
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      title: `${original.title} (Copy)`,
      type: original.type,
      instructions: original.instructions,
      tags: original.tags,
      estimated_minutes: original.estimated_minutes,
      parent_notes: original.parent_notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Assignments (Items)
export async function createAssignment(assignment: Omit<AssignmentItemRow, 'id' | 'created_at'>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('assignment_items')
    .insert(assignment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAssignment(id: string, assignment: Partial<AssignmentItemRow>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('assignment_items')
    .update(assignment)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAssignment(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('assignment_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function cloneAssignment(id: string) {
  const supabase = await createServerClient();
  
  // Fetch the original assignment
  const { data: original, error: fetchError } = await supabase
    .from('assignment_items')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !original) throw fetchError || new Error('Assignment not found');
  
  // Create a copy with new title
  const { data, error } = await supabase
    .from('assignment_items')
    .insert({
      title: `${original.title} (Copy)`,
      type: original.type,
      deliverable: original.deliverable,
      rubric: original.rubric,
      steps: original.steps,
      parent_notes: original.parent_notes,
      estimated_minutes: original.estimated_minutes,
      tags: original.tags,
      links: original.links,
      is_template: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Resources
export async function createResource(resource: Omit<ResourceRow, 'id'>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('resources')
    .insert(resource)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateResource(id: string, resource: Partial<ResourceRow>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('resources')
    .update(resource)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResource(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Schedule / Playlist
export async function assignItemToSchedule(
  type: 'lesson' | 'assignment',
  itemId: string,
  date: string,
  studentIds: string[]
) {
  const supabase = await createServerClient();
  
  console.log('assignItemToSchedule called with:', { type, itemId, date, studentIds });

  if (!studentIds.length) {
    console.warn('assignItemToSchedule: No student IDs provided!');
    return false;
  }

  const rows = studentIds.map(studentId => ({
    date,
    student_id: studentId,
    item_type: type,
    lesson_id: type === 'lesson' ? itemId : null,
    assignment_id: type === 'assignment' ? itemId : null,
    status: 'pending'
  }));
  
  console.log('Inserting rows:', rows);

  const { error } = await supabase
    .from('schedule_items')
    .insert(rows);

  if (error) {
    console.error('assignItemToSchedule DB Error:', error);
    throw error;
  }
  
  console.log('assignItemToSchedule success');
  return true;
}

export async function addToSchedule(item: Omit<ScheduleItemRow, 'id' | 'status' | 'completed_at'>) {
  const supabase = await createServerClient();
  // TODO: Validate item_type matches ID presence (e.g. if type='lesson', lesson_id must be set)
  
  const { data, error } = await supabase
    .from('schedule_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}
// ... existing code ...

export async function toggleScheduleItemComplete(id: string, isCompleted: boolean) {
  const supabase = await createServerClient();
  const status = isCompleted ? 'completed' : 'pending';
  const completed_at = isCompleted ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from('schedule_items')
    .update({ status, completed_at })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Deletes an item from the schedule
export async function deleteScheduleItemAction(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('schedule_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

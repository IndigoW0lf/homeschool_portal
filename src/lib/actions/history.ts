'use server';

import { createServerClient } from '../supabase/server';

export type HistoryItem = {
  id: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
  student: {
    id: string;
    name: string;
  };
};

export async function getLessonHistory(lessonId: string): Promise<HistoryItem[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('schedule_items')
    .select(`
      id,
      date,
      status,
      completed_at,
      kids (
        id,
        name
      )
    `)
    .eq('lesson_id', lessonId)
    .order('date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching lesson history:', error);
    return [];
  }

  // Transform to simpler shape
  return data.map((item: any) => ({
    id: item.id,
    date: item.date,
    status: item.status,
    completed_at: item.completed_at,
    student: item.kids ? {
      id: item.kids.id,
      name: item.kids.name
    } : { id: 'unknown', name: 'Unknown' }
  }));
}

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
  type RawHistoryRow = { id: string; date: string; status: string; completed_at: string | null; kids: { id: string; name: string } | { id: string; name: string }[] | null };
  return (data as unknown as RawHistoryRow[]).map(item => {
    const kids = Array.isArray(item.kids) ? item.kids[0] : item.kids;
    return {
      id: item.id,
      date: item.date,
      status: item.status as HistoryItem['status'],
      completed_at: item.completed_at,
      student: kids ? { id: kids.id, name: kids.name } : { id: 'unknown', name: 'Unknown' }
    };
  });
}

// Fetch worksheet responses for parent viewing
import { createServerClient } from './server';

export interface WorksheetResponseData {
  id: string;
  kidId: string;
  kidName: string;
  assignmentId: string;
  assignmentTitle: string;
  responses: Record<string, string | string[] | null>;
  submittedAt: string;
  worksheetData: {
    title?: string;
    sections?: Array<{
      title?: string;
      items?: Array<{
        id?: string;
        type: string;
        question: string;
        options?: string[];
        answer?: string;
      }>;
    }>;
  };
}

export async function getWorksheetResponsesForKids(kidIds: string[]): Promise<WorksheetResponseData[]> {
  if (kidIds.length === 0) return [];
  
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('worksheet_responses')
    .select(`
      id,
      kid_id,
      assignment_id,
      responses,
      submitted_at,
      kids:kid_id (name),
      assignment:assignment_id (title, worksheet_data)
    `)
    .in('kid_id', kidIds)
    .order('submitted_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching worksheet responses:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    kidId: row.kid_id,
    kidName: (row.kids as any)?.name || 'Unknown',
    assignmentId: row.assignment_id,
    assignmentTitle: (row.assignment as any)?.title || 'Untitled',
    responses: row.responses as Record<string, string | string[] | null>,
    submittedAt: row.submitted_at,
    worksheetData: (row.assignment as any)?.worksheet_data || {},
  }));
}

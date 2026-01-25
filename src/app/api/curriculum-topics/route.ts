import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/curriculum-topics
 * 
 * Fetches imported curriculum topics for use in lesson/worksheet creation.
 * Supports filtering by kid_id, subject, and mastery_status.
 * 
 * Query params:
 * - kidId: Filter by specific kid
 * - subject: Filter by subject (e.g., "Math", "Reading")
 * - masteryStatus: Filter by mastery level ("weak", "developing", "mastered", "in_progress")
 * - needsPractice: If "true", only returns items with mastery_status = "weak"
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const kidId = searchParams.get('kidId');
    const subject = searchParams.get('subject');
    const masteryStatus = searchParams.get('masteryStatus');
    const needsPractice = searchParams.get('needsPractice') === 'true';

    // Build query
    let query = supabase
      .from('external_curriculum')
      .select(`
        id,
        kid_id,
        topic,
        subject,
        course,
        score,
        mastery_status,
        item_type,
        date,
        practice_generated
      `)
      .not('topic', 'is', null) // Only items with parsed topics
      .order('date', { ascending: false });

    // Apply filters
    if (kidId) {
      query = query.eq('kid_id', kidId);
    }
    if (subject) {
      query = query.eq('subject', subject);
    }
    if (masteryStatus) {
      query = query.eq('mastery_status', masteryStatus);
    }
    if (needsPractice) {
      query = query.eq('mastery_status', 'weak');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching curriculum topics:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by topic and get unique topics with their latest info
    const topicsMap = new Map<string, {
      topic: string;
      subject: string;
      course: string;
      kidId: string;
      latestScore: number | null;
      masteryStatus: string;
      latestDate: string;
      practiceGenerated: boolean;
      itemCount: number;
    }>();

    for (const item of data || []) {
      const key = `${item.kid_id}:${item.topic}`;
      const existing = topicsMap.get(key);
      
      if (!existing || new Date(item.date) > new Date(existing.latestDate)) {
        topicsMap.set(key, {
          topic: item.topic,
          subject: item.subject,
          course: item.course,
          kidId: item.kid_id,
          latestScore: item.score,
          masteryStatus: item.mastery_status || 'in_progress',
          latestDate: item.date,
          practiceGenerated: item.practice_generated || false,
          itemCount: existing ? existing.itemCount + 1 : 1,
        });
      } else if (existing) {
        existing.itemCount += 1;
      }
    }

    const topics = Array.from(topicsMap.values()).sort((a, b) => {
      // Sort weak items first, then by date
      if (a.masteryStatus === 'weak' && b.masteryStatus !== 'weak') return -1;
      if (a.masteryStatus !== 'weak' && b.masteryStatus === 'weak') return 1;
      return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
    });

    return NextResponse.json({ topics });
  } catch (err) {
    console.error('Curriculum topics API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

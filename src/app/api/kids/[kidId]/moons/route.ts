import { NextRequest, NextResponse } from 'next/server';
import { getKidSession } from '@/lib/kid-session';
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/kids/[kidId]/moons
 * Fetches moon balance for a kid.
 * Works for both kid sessions (uses Service Role) and parent sessions (uses RLS).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kidId: string }> }
) {
  const { kidId } = await params;

  try {
    const kidSession = await getKidSession();
    
    let supabase;
    
    if (kidSession && kidSession.kidId === kidId) {
      // Kid viewing their own data → Use Service Role (bypass RLS)
      supabase = await createServiceRoleClient();
    } else {
      // Parent/other user → Use standard client (RLS)
      supabase = await createServerClient();
      
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch moon balance from student_progress
    const { data, error } = await supabase
      .from('student_progress')
      .select('total_stars')
      .eq('kid_id', kidId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (acceptable, means 0 moons)
      console.error('[Moons API] Error fetching moons:', error);
      return NextResponse.json({ error: 'Failed to fetch moons' }, { status: 500 });
    }

    return NextResponse.json({ 
      moons: data?.total_stars || 0,
      kidId 
    });

  } catch (error) {
    console.error('[Moons API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

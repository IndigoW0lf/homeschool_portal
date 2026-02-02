import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ kidId: string }>;
}

/**
 * GET /api/kids/[kidId]/owned-avatars
 * Returns list of avatar IDs owned by the kid
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('kid_owned_avatars')
    .select('avatar_id, category, name, svg_path')
    .eq('kid_id', kidId);

  if (error) {
    console.error('[owned-avatars] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch owned avatars' }, { status: 500 });
  }

  // Return list of owned avatar IDs
  const owned = (data || []).map(item => item.avatar_id);
  
  return NextResponse.json({
    owned,
    avatars: data || [],
  });
}

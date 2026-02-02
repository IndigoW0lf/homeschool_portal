import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/avatar-state
 * Fetch the current user's Open Peeps avatar state
 */
export async function GET() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('open_peeps_avatar_state')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[profile/avatar-state] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch avatar state' }, { status: 500 });
  }

  return NextResponse.json({
    openPeepsState: data?.open_peeps_avatar_state || null,
  });
}

/**
 * PUT /api/profile/avatar-state
 * Save the current user's Open Peeps avatar state
 */
export async function PUT(request: NextRequest) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { openPeepsState: Record<string, string>; avatarUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { openPeepsState, avatarUrl } = body;

  if (!openPeepsState) {
    return NextResponse.json({ error: 'openPeepsState is required' }, { status: 400 });
  }

  // Update the profile's avatar state
  const { error } = await supabase
    .from('profiles')
    .update({
      open_peeps_avatar_state: openPeepsState,
      avatar_url: avatarUrl || null,
    })
    .eq('id', user.id);

  if (error) {
    console.error('[profile/avatar-state] PUT error:', error);
    return NextResponse.json({ error: 'Failed to save avatar state' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
